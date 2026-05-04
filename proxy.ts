import { NextResponse, type NextRequest } from "next/server";

import { decodeJwtPayload } from "@/lib/auth/jwt";

type UserRole = "brandmaster" | "supervisor";

function asUserRole(value: unknown): UserRole | null {
  return value === "brandmaster" || value === "supervisor" ? value : null;
}

function getRoleFromJwt(token: string): UserRole | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  // Prefer a direct claim, but support a few common shapes.
  const direct = asUserRole(payload.role);
  if (direct) return direct;

  const accountDetails = payload.accountDetails;
  if (accountDetails && typeof accountDetails === "object") {
    const role = asUserRole((accountDetails as Record<string, unknown>).role);
    if (role) return role;
  }

  const user = payload.user;
  if (user && typeof user === "object") {
    const role = asUserRole((user as Record<string, unknown>).role);
    if (role) return role;
  }

  return null;
}

function redirectTo(request: NextRequest, pathname: string) {
  return NextResponse.redirect(new URL(pathname, request.url));
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const tokenCookie = request.cookies.get("brandmast.token")?.value ?? null;
  const roleCookie = request.cookies.get("brandmast.role")?.value ?? null;

  const hasToken = typeof tokenCookie === "string" && tokenCookie.length > 0;
  const roleFromToken = tokenCookie ? getRoleFromJwt(tokenCookie) : null;
  const role = roleFromToken ?? asUserRole(roleCookie);

  const isLogin = pathname === "/login";
  const isRoot = pathname === "/";
  const isNoAccess = pathname === "/no-access";

  const isBrandmasterRoute = pathname === "/brandmaster" || pathname.startsWith("/brandmaster/");
  const isSupervisorRoute = pathname === "/supervisor" || pathname.startsWith("/supervisor/");

  // No token: protect everything except /login and /no-access
  if (!hasToken) {
    if (isLogin || isNoAccess) return NextResponse.next();
    return redirectTo(request, "/login");
  }

  // Token present: prevent staying on /login
  if (isLogin) {
    if (role === "supervisor") return redirectTo(request, "/supervisor");
    return redirectTo(request, "/brandmaster");
  }

  // Landing route: redirect based on role
  if (isRoot) {
    if (role === "supervisor") return redirectTo(request, "/supervisor");
    return redirectTo(request, "/brandmaster");
  }

  // Role guards
  if (isBrandmasterRoute && role !== "brandmaster") {
    const url = new URL("/no-access", request.url);
    url.searchParams.set("from", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  if (isSupervisorRoute && role !== "supervisor") {
    const url = new URL("/no-access", request.url);
    url.searchParams.set("from", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Run for all routes except:
     * - Next.js internals
     * - static files
     * - API routes (if you ever add them)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$|api).*)",
  ],
};

