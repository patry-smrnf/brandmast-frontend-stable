const DEFAULT_DEV = "http://localhost:8000";

function nonEmptyEnv(name: string): string | undefined {
  const v = process.env[name];
  if (v === undefined || v === null) return undefined;
  const t = v.trim();
  return t.length > 0 ? t : undefined;
}

/**
 * Same idea as `getApiBaseUrl` in brandmastv3_frontend (`lib/api-client.ts`):
 * - Optional `NEXT_PUBLIC_API_URL` wins (full base override).
 * - In the browser: localhost / 127.0.0.1 → local API origin; otherwise same-origin `""` so `/api/*` hits `vercel.json` rewrites on Vercel.
 * - On the server (no `window`): `VERCEL_URL` set → same-origin `""`; else local default.
 *
 * Paths in this app are like `/api/auth/login` (already include `/api`), so the base is an origin or empty - not `.../api` like v3.
 */
export function getBrowserApiBaseUrl(): string {
  const explicit = nonEmptyEnv("NEXT_PUBLIC_API_URL") ?? nonEmptyEnv("NEXT_PUBLIC_API_BASE_URL");
  if (explicit) return explicit;

  if (typeof window !== "undefined") {
    const isLocalhost =
      window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    return isLocalhost ? DEFAULT_DEV : "";
  }

  return nonEmptyEnv("VERCEL_URL") ? "" : DEFAULT_DEV;
}

/**
 * Absolute backend URL for server-side `fetch` (proxy route).
 */
export function getServerApiBaseUrl(): string {
  return (
    nonEmptyEnv("API_BASE_URL") ??
    nonEmptyEnv("NEXT_PUBLIC_API_URL") ??
    nonEmptyEnv("NEXT_PUBLIC_API_BASE_URL") ??
    DEFAULT_DEV
  );
}
