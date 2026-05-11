const DEFAULT_DEV = "http://localhost:8081";

function nonEmptyEnv(name: string): string | undefined {
  const v = process.env[name];
  if (v === undefined || v === null) return undefined;
  const t = v.trim();
  return t.length > 0 ? t : undefined;
}

/**
 * Browser Axios base URL from `NEXT_PUBLIC_API_BASE_URL`.
 * If the variable is present but empty, requests stay same-origin (e.g. Vercel `/api` rewrite).
 * If unset, defaults to local backend.
 */
export function getBrowserApiBaseUrl(): string {
  const v = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (v !== undefined) return v;
  return DEFAULT_DEV;
}

/**
 * Absolute backend URL for server-side `fetch` (proxy route). Empty values are ignored.
 * Prefer `API_BASE_URL`; falls back to non-empty `NEXT_PUBLIC_API_BASE_URL`.
 */
export function getServerApiBaseUrl(): string {
  return nonEmptyEnv("API_BASE_URL") ?? nonEmptyEnv("NEXT_PUBLIC_API_BASE_URL") ?? DEFAULT_DEV;
}
