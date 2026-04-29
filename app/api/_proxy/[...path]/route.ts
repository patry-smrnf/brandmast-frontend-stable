export const runtime = "nodejs";

function getBackendBaseUrl() {
  // Server-only by default; safe to override per environment.
  return (
    process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://localhost:8081"
  );
}

function joinUrl(base: string, parts: string[]) {
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  const p = parts.map((x) => x.replace(/^\/+|\/+$/g, "")).filter(Boolean).join("/");
  return p ? `${b}/${p}` : b;
}

function filterRequestHeaders(headers: Headers) {
  const out = new Headers(headers);
  // Let fetch set these correctly for the backend request.
  out.delete("host");
  out.delete("content-length");
  // Avoid accidental compression issues across environments.
  out.delete("accept-encoding");
  return out;
}

async function proxy(req: Request, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await ctx.params;
  const backendUrl = new URL(joinUrl(getBackendBaseUrl(), path));

  // Preserve query string
  const reqUrl = new URL(req.url);
  backendUrl.search = reqUrl.search;

  const method = req.method.toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD";

  const upstream = await fetch(backendUrl.toString(), {
    method,
    headers: filterRequestHeaders(req.headers),
    body: hasBody ? req.body : undefined,
    // Ensure cookies/session work when backend uses them.
    credentials: "include",
    redirect: "manual",
  });

  // Stream response through (including non-JSON)
  const resHeaders = new Headers(upstream.headers);
  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: resHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const HEAD = proxy;
export const OPTIONS = proxy;

