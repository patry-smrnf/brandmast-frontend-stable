export type JwtPayload = Record<string, unknown>;

function base64UrlToBase64(input: string) {
  return input.replace(/-/g, "+").replace(/_/g, "/");
}

function decodeBase64(base64: string) {
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  // `atob` is available in browsers and in Next middleware (edge runtime).
  const binary = atob(padded);
  // Convert binary string to UTF-8 string
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payloadPart = parts[1];
    const json = decodeBase64(base64UrlToBase64(payloadPart));
    const parsed = JSON.parse(json) as JwtPayload;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

