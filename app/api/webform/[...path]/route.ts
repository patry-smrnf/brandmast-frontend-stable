import { getServerWebformApiBaseUrl } from "@/lib/api/webform/base-url";

export const runtime = "nodejs";

function joinUrl(base: string, parts: string[]) {
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  const p = parts.map((x) => x.replace(/^\/+|\/+$/g, "")).filter(Boolean).join("/");
  return p ? `${b}/${p}` : b;
}

function filterRequestHeaders(headers: Headers) {
  const out = new Headers(headers);
  out.delete("host");
  out.delete("content-length");
  out.delete("accept-encoding");
  return out;
}

async function proxy(req: Request, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await ctx.params;
  const upstreamUrl = new URL(joinUrl(getServerWebformApiBaseUrl(), path));

  const reqUrl = new URL(req.url);
  upstreamUrl.search = reqUrl.search;

  const method = req.method.toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD";

  const upstream = await fetch(upstreamUrl.toString(), {
    method,
    headers: filterRequestHeaders(req.headers),
    body: hasBody ? req.body : undefined,
    redirect: "manual",
  });

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: new Headers(upstream.headers),
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const HEAD = proxy;
export const OPTIONS = proxy;
