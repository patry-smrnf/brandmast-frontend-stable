const DEFAULT_WEBFORM_API_URL = "https://api.webform.tdy-apps.com";

function nonEmptyEnv(name: string): string | undefined {
  const v = process.env[name];
  if (v === undefined || v === null) return undefined;
  const t = v.trim();
  return t.length > 0 ? t : undefined;
}

function resolveWebformApiBaseUrl(): string {
  return (
    nonEmptyEnv("NEXT_PUBLIC_WEBFORM_API_URL") ??
    nonEmptyEnv("WEBFORM_API_URL") ??
    DEFAULT_WEBFORM_API_URL
  );
}

/** Webform API - ten sam adres w przeglądarce i na serwerze (localhost i produkcja). */
export function getServerWebformApiBaseUrl(): string {
  return resolveWebformApiBaseUrl();
}

export function getBrowserWebformApiBaseUrl(): string {
  return resolveWebformApiBaseUrl();
}
