import { isAxiosError } from "axios";

export type ApiErrorPayload = {
  message?: string;
  code?: string;
  errorCode?: string;
  details?: unknown;
  violations?: Array<{ field?: string; message?: string }>;
};

export class ApiError extends Error {
  readonly name = "ApiError";
  readonly status: number;
  readonly code?: string;
  readonly details?: unknown;
  readonly url?: string;

  constructor(args: {
    message: string;
    status: number;
    code?: string;
    details?: unknown;
    url?: string;
    cause?: unknown;
  }) {
    super(args.message, { cause: args.cause });
    this.status = args.status;
    this.code = args.code;
    this.details = args.details;
    this.url = args.url;
  }
}

const AUTH_HINT_RE = /auth|unauthori[sz]ed|forbidden|token|jwt|session|sesja|wygas/i;

type EnvelopeLike = {
  message?: unknown;
  errorCode?: unknown;
  code?: unknown;
  violations?: Array<{ field?: string; message?: string }>;
};

function readEnvelope(data: unknown): EnvelopeLike | null {
  if (!data || typeof data !== "object") return null;
  return data as EnvelopeLike;
}

function messageFromEnvelope(data: EnvelopeLike | null): string | undefined {
  if (!data) return undefined;
  if (typeof data.message === "string" && data.message.trim()) return data.message.trim();
  if (Array.isArray(data.violations)) {
    const parts = data.violations
      .map((v) => {
        const msg = typeof v?.message === "string" ? v.message.trim() : "";
        if (!msg) return "";
        const field = typeof v?.field === "string" ? v.field.trim() : "";
        return field ? `${field}: ${msg}` : msg;
      })
      .filter(Boolean);
    if (parts.length) return parts.join("; ");
  }
  if (typeof data.errorCode === "string" && data.errorCode.trim()) return data.errorCode.trim();
  if (typeof data.code === "string" && data.code.trim()) return data.code.trim();
  return undefined;
}

function statusOf(err: unknown): number | undefined {
  if (err instanceof ApiError) return err.status;
  if (isAxiosError(err)) return err.response?.status;
  return undefined;
}

function envelopeOf(err: unknown): EnvelopeLike | null {
  if (err instanceof ApiError) {
    return readEnvelope(err.details) ?? {
      message: err.message,
      code: err.code,
      errorCode: err.code,
    };
  }
  if (isAxiosError(err)) return readEnvelope(err.response?.data);
  return null;
}

/**
 * Best-effort human-readable message from Axios / ApiError / Error.
 */
export function getApiErrorMessage(err: unknown, fallback = "Nieznany błąd."): string {
  if (err instanceof ApiError) {
    const fromDetails = messageFromEnvelope(readEnvelope(err.details));
    if (fromDetails) return fromDetails;
    if (err.message.trim()) return err.message.trim();
    return fallback;
  }

  if (isAxiosError(err)) {
    const fromBody = messageFromEnvelope(readEnvelope(err.response?.data));
    if (fromBody) return fromBody;
    if (typeof err.message === "string" && err.message.trim()) return err.message.trim();
    return fallback;
  }

  if (err instanceof Error && err.message.trim()) return err.message.trim();
  return fallback;
}

/**
 * 401/403 always; 400 when message/errorCode looks auth-related.
 */
export function isAuthApiError(err: unknown): boolean {
  const status = statusOf(err);
  if (status === 401 || status === 403) return true;
  if (status !== 400) return false;

  const envelope = envelopeOf(err);
  const haystack = [envelope?.errorCode, envelope?.code, envelope?.message, err instanceof Error ? err.message : ""]
    .filter((v): v is string => typeof v === "string" && v.length > 0)
    .join(" ");

  return AUTH_HINT_RE.test(haystack);
}
