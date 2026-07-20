import { NextResponse, type NextRequest } from "next/server";

import { decodeJwtPayload } from "@/lib/auth/jwt";
import { homePathForRole, isUserRole, type UserRole } from "@/lib/api/token";

function asUserRole(value: unknown): UserRole | null {
  return isUserRole(value) ? value : null;
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

function redirectNoAccess(request: NextRequest, pathname: string, search: string) {
  const url = new URL("/no-access", request.url);
  url.searchParams.set("from", `${pathname}${search}`);
  return NextResponse.redirect(url);
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
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");

  // No token: protect everything except /login and /no-access
  if (!hasToken) {
    if (isLogin || isNoAccess) return NextResponse.next();
    return redirectTo(request, "/login");
  }

  // Token present: prevent staying on /login
  if (isLogin) {
    if (role) return redirectTo(request, homePathForRole(role));
    return redirectTo(request, "/brandmaster");
  }

  // Landing route: redirect based on role
  if (isRoot) {
    if (role) return redirectTo(request, homePathForRole(role));
    return redirectTo(request, "/brandmaster");
  }

  // Role guards
  if (isBrandmasterRoute && role !== "brandmaster") {
    return redirectNoAccess(request, pathname, search);
  }

  if (isSupervisorRoute && role !== "supervisor") {
    return redirectNoAccess(request, pathname, search);
  }

  if (isAdminRoute && role !== "admin") {
    return redirectNoAccess(request, pathname, search);
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
