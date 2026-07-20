import { getBrowserApiBaseUrl } from "@/lib/api/base-url";
import { ApiError } from "@/lib/api/errors";
import { tokenStore } from "@/lib/api/token";
import type { LogsStreamParams, ServiceLogEntry, ServiceLogResponse } from "@/lib/api/generated/types";

export type LogsStreamHandlers = {
  onConnected?: () => void;
  onLog?: (entry: ServiceLogEntry) => void;
  onError?: (error: unknown) => void;
  /** Fired when the stream returns 401 (or EventSource fails right after open without `connected`). */
  onUnauthorized?: () => void;
  /** Fired when the stream returns 403. */
  onForbidden?: () => void;
};

export type SubscribeLogsStreamOptions = {
  /** JWT override; defaults to `tokenStore.get()`. */
  token?: string | null;
  /**
   * Prefer `fetch` + `Authorization: Bearer` (can read 401/403).
   * Set to `"eventsource"` when custom headers are unavailable.
   * @default "fetch"
   */
  transport?: "fetch" | "eventsource";
  /** Reconnect after close/timeout (~30 min server timeout). @default true */
  reconnect?: boolean;
  /** Delay before reconnect. @default 2000 */
  reconnectDelayMs?: number;
};

export type LogsStreamSubscription = {
  close: () => void;
};

function joinBaseAndPath(base: string, path: string): string {
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

function buildLogsStreamUrl(params?: LogsStreamParams & { access_token?: string }): string {
  const url = new URL(joinBaseAndPath(getBrowserApiBaseUrl() || (typeof window !== "undefined" ? window.location.origin : ""), "/api/logs/stream"));
  if (params?.service) url.searchParams.set("service", params.service);
  if (params?.access_token) url.searchParams.set("access_token", params.access_token);
  return url.toString();
}

function parseServiceLogEntry(raw: string): ServiceLogEntry | null {
  try {
    return JSON.parse(raw) as ServiceLogEntry;
  } catch {
    return null;
  }
}

/**
 * Merge history + live entries by `id` (preferred) or `createdAt`+`trackingId`+`message`.
 * Newer `createdAt` wins on conflict; result sorted ascending by createdAt then id.
 */
export function mergeServiceLogs(
  existing: ServiceLogResponse[],
  incoming: ServiceLogResponse | ServiceLogResponse[],
): ServiceLogResponse[] {
  const incomingList = Array.isArray(incoming) ? incoming : [incoming];
  const byKey = new Map<string, ServiceLogResponse>();

  const keyOf = (log: ServiceLogResponse): string => {
    if (log.id != null) return `id:${log.id}`;
    return `t:${log.createdAt ?? ""}|${log.trackingId ?? ""}|${log.serviceName ?? ""}|${log.message ?? ""}`;
  };

  for (const log of existing) {
    byKey.set(keyOf(log), log);
  }
  for (const log of incomingList) {
    const key = keyOf(log);
    const prev = byKey.get(key);
    if (!prev) {
      byKey.set(key, log);
      continue;
    }
    const prevTs = prev.createdAt ? Date.parse(prev.createdAt) : 0;
    const nextTs = log.createdAt ? Date.parse(log.createdAt) : 0;
    byKey.set(key, nextTs >= prevTs ? { ...prev, ...log } : { ...log, ...prev });
  }

  return Array.from(byKey.values()).sort((a, b) => {
    const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
    const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
    if (ta !== tb) return ta - tb;
    return (a.id ?? 0) - (b.id ?? 0);
  });
}

type SseFrame = { event?: string; data: string };

function parseSseChunk(buffer: string): { frames: SseFrame[]; rest: string } {
  const frames: SseFrame[] = [];
  const parts = buffer.split(/\r?\n\r?\n/);
  const rest = parts.pop() ?? "";

  for (const part of parts) {
    if (!part.trim() || part.startsWith(":")) continue;
    let event: string | undefined;
    const dataLines: string[] = [];
    for (const line of part.split(/\r?\n/)) {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      else if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
    }
    if (dataLines.length === 0) continue;
    frames.push({ event, data: dataLines.join("\n") });
  }

  return { frames, rest };
}

function dispatchSseFrame(frame: SseFrame, handlers: LogsStreamHandlers) {
  const eventName = frame.event ?? "message";
  if (eventName === "connected" || (eventName === "message" && frame.data.trim() === "ok")) {
    handlers.onConnected?.();
    return;
  }
  if (eventName === "log") {
    const entry = parseServiceLogEntry(frame.data);
    if (entry) handlers.onLog?.(entry);
    return;
  }
  // Some servers emit log payloads as default `message` events.
  if (eventName === "message") {
    const entry = parseServiceLogEntry(frame.data);
    if (entry) handlers.onLog?.(entry);
  }
}

/**
 * Live logs (SSE). Prefer fetch + Bearer; use EventSource + `access_token` as fallback.
 * Server timeout ~30 minutes — client reconnects by default.
 */
export function subscribeLogsStream(
  params?: LogsStreamParams,
  handlers: LogsStreamHandlers = {},
  options: SubscribeLogsStreamOptions = {},
): LogsStreamSubscription {
  const transport = options.transport ?? "fetch";
  const reconnect = options.reconnect ?? true;
  const reconnectDelayMs = options.reconnectDelayMs ?? 2000;

  let closed = false;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let abortController: AbortController | null = null;
  let eventSource: EventSource | null = null;

  const clearReconnect = () => {
    if (reconnectTimer != null) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  const scheduleReconnect = () => {
    if (closed || !reconnect) return;
    clearReconnect();
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      if (!closed) start();
    }, reconnectDelayMs);
  };

  const stopActive = () => {
    abortController?.abort();
    abortController = null;
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };

  const startFetch = async () => {
    const token = options.token !== undefined ? options.token : tokenStore.get();
    if (!token) {
      handlers.onUnauthorized?.();
      handlers.onError?.(
        new ApiError({ message: "Missing JWT for logs stream", status: 401, code: "auth.unauthorized" }),
      );
      return;
    }

    abortController = new AbortController();
    const url = buildLogsStreamUrl(params);

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "text/event-stream",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        signal: abortController.signal,
      });

      if (res.status === 401) {
        handlers.onUnauthorized?.();
        handlers.onError?.(
          new ApiError({ message: "Unauthorized", status: 401, code: "auth.unauthorized", url }),
        );
        return;
      }
      if (res.status === 403) {
        handlers.onForbidden?.();
        handlers.onError?.(
          new ApiError({ message: "Forbidden — admin only", status: 403, code: "auth.forbidden", url }),
        );
        return;
      }
      if (!res.ok || !res.body) {
        handlers.onError?.(
          new ApiError({
            message: `Logs stream failed (${res.status})`,
            status: res.status,
            url,
          }),
        );
        scheduleReconnect();
        return;
      }

      // HTTP 200 + body means the stream is open (don't wait only for `event:connected`).
      handlers.onConnected?.();

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (!closed) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parsed = parseSseChunk(buffer);
        buffer = parsed.rest;
        for (const frame of parsed.frames) {
          dispatchSseFrame(frame, handlers);
        }
      }

      if (!closed) scheduleReconnect();
    } catch (err) {
      if (closed || (err instanceof DOMException && err.name === "AbortError")) return;
      handlers.onError?.(err);
      scheduleReconnect();
    }
  };

  const startEventSource = () => {
    const token = options.token !== undefined ? options.token : tokenStore.get();
    if (!token) {
      handlers.onUnauthorized?.();
      handlers.onError?.(
        new ApiError({ message: "Missing JWT for logs stream", status: 401, code: "auth.unauthorized" }),
      );
      return;
    }

    let sawConnected = false;
    const url = buildLogsStreamUrl({ ...params, access_token: token });
    eventSource = new EventSource(url);

    const markConnected = () => {
      if (sawConnected) return;
      sawConnected = true;
      handlers.onConnected?.();
    };

    eventSource.onopen = () => {
      markConnected();
    };

    eventSource.addEventListener("connected", () => {
      markConnected();
    });

    eventSource.addEventListener("log", (e) => {
      markConnected();
      const entry = parseServiceLogEntry((e as MessageEvent).data);
      if (entry) handlers.onLog?.(entry);
    });

    eventSource.onerror = () => {
      if (closed) return;
      eventSource?.close();
      eventSource = null;
      if (!sawConnected) {
        handlers.onUnauthorized?.();
        handlers.onError?.(
          new ApiError({
            message: "Logs stream connection failed (possible 401/403)",
            status: 401,
            code: "auth.unauthorized",
            url,
          }),
        );
        return;
      }
      handlers.onError?.(new Error("Logs stream disconnected"));
      scheduleReconnect();
    };
  };

  const start = () => {
    stopActive();
    if (transport === "eventsource") startEventSource();
    else void startFetch();
  };

  start();

  return {
    close() {
      closed = true;
      clearReconnect();
      stopActive();
    },
  };
}
