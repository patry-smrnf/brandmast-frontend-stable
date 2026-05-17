const DEFAULT_WEBFORM_API_URL = "https://api.webform.tdy-apps.com";

function nonEmptyEnv(name: string): string | undefined {
  const v = process.env[name];
  if (v === undefined || v === null) return undefined;
  const t = v.trim();
  return t.length > 0 ? t : undefined;
}

/** Absolute URL for server-side proxy to webform API. */
export function getServerWebformApiBaseUrl(): string {
  return nonEmptyEnv("WEBFORM_API_URL") ?? DEFAULT_WEBFORM_API_URL;
}

/** Browser calls same-origin proxy (`/api/webform`). */
export function getBrowserWebformApiBaseUrl(): string {
  return "/api/webform";
}
