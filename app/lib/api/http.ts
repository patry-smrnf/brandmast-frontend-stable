import { ApiError, type ApiErrorPayload } from "./errors";

type Json =
  | null
  | boolean
  | number
  | string
  | Json[]
  | { [key: string]: Json };

export type ApiFetchOptions = Omit<RequestInit, "body"> & {
  timeoutMs?: number;
  body?: unknown;
};

function joinUrl(base: string, path: string) {
  if (!base) return path;
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

function parseMaybeJson(text: string): unknown {
  if (!text) return undefined;
  try {
    return JSON.parse(text) as Json;
  } catch {
    return undefined;
  }
}

async function readBody(res: Response): Promise<{ text: string; json?: unknown }> {
  const text = await res.text().catch(() => "");
  const json = parseMaybeJson(text);
  return { text, json };
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions & { baseUrl?: string } = {},
): Promise<T> {
  const {
    baseUrl = "/api/_proxy",
    timeoutMs = 15_000,
    headers,
    body,
    ...init
  } = options;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const url = joinUrl(baseUrl, path);

  try {
    const hasBody = body !== undefined && body !== null && init.method !== "GET" && init.method !== "HEAD";
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(hasBody ? { "Content-Type": "application/json" } : {}),
        ...(headers ?? {}),
      },
      body: hasBody ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const { text, json } = await readBody(res);
      const payload = (json ?? undefined) as ApiErrorPayload | undefined;
      throw new ApiError({
        message: payload?.message || text || `Request failed (${res.status})`,
        status: res.status,
        code: payload?.code,
        details: payload?.details ?? payload ?? json ?? text,
        url,
      });
    }

    // Some endpoints return empty bodies (204) or non-JSON (e.g. file download)
    const contentType = res.headers.get("content-type") ?? "";
    if (res.status === 204) return undefined as T;
    if (!contentType.includes("application/json")) {
      return (await res.text()) as unknown as T;
    }

    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError({
        message: `Request timed out after ${timeoutMs}ms`,
        status: 408,
        url,
        cause: err,
      });
    }
    throw new ApiError({
      message: "Network error",
      status: 0,
      url,
      cause: err,
    });
  } finally {
    clearTimeout(timeout);
  }
}

