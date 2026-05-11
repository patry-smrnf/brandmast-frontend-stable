const DEFAULT_DEV = "http://localhost:8081";

function nonEmptyEnv(name: string): string | undefined {
  const v = process.env[name];
  if (v === undefined || v === null) return undefined;
  const t = v.trim();
  return t.length > 0 ? t : undefined;
}

/**
 * Browser Axios base URL from `NEXT_PUBLIC_API_BASE_URL`.
 * If the variable is present but empty, requests stay same-origin so Vercel `vercel.json` rewrites can proxy `/api/*` (deployed only).
 * Set `NEXT_PUBLIC_USE_SAME_ORIGIN_API=true` when your host UI cannot store an empty public var (e.g. Vercel).
 * On Vercel (production/preview), defaults to same-origin when no public URL is set — see `NEXT_PUBLIC_VERCEL_ENV`.
 * Locally, defaults to `http://localhost:8081`.
 */
export function getBrowserApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_USE_SAME_ORIGIN_API === "true") return "";
  const v = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (v !== undefined) return v;
  const vercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV;
  if (vercelEnv === "production" || vercelEnv === "preview") return "";
  return DEFAULT_DEV;
}

/**
 * Absolute backend URL for server-side `fetch` (proxy route). Empty values are ignored.
 * Prefer `API_BASE_URL`; falls back to non-empty `NEXT_PUBLIC_API_BASE_URL`.
 */
export function getServerApiBaseUrl(): string {
  return nonEmptyEnv("API_BASE_URL") ?? nonEmptyEnv("NEXT_PUBLIC_API_BASE_URL") ?? DEFAULT_DEV;
}
