import { decodeJwtPayload } from "@/lib/auth/jwt";

const STORAGE_KEY = "brandmast.token";
const ROLE_STORAGE_KEY = "brandmast.role";

export type UserRole = "brandmaster" | "supervisor";

const TOKEN_COOKIE_KEY = STORAGE_KEY;
const ROLE_COOKIE_KEY = ROLE_STORAGE_KEY;

/** Fired in the same tab when token/role changes (localStorage `storage` only fires cross-tab). */
export const AUTH_CHANGED_EVENT = "brandmast:auth-changed";
/** @deprecated Prefer AUTH_CHANGED_EVENT — kept for existing listeners. */
export const ROLE_CHANGED_EVENT = AUTH_CHANGED_EVENT;

function asUserRole(value: unknown): UserRole | null {
  return value === "brandmaster" || value === "supervisor" ? value : null;
}

function roleFromJwt(token: string): UserRole | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;

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

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  try {
    const cookies = document.cookie.split("; ");
    const encodedPrefix = `${encodeURIComponent(name)}=`;
    const rawPrefix = `${name}=`;
    for (const part of cookies) {
      if (part.startsWith(encodedPrefix)) {
        return decodeURIComponent(part.slice(encodedPrefix.length));
      }
      if (part.startsWith(rawPrefix)) {
        return decodeURIComponent(part.slice(rawPrefix.length));
      }
    }
  } catch {
    // ignore
  }
  return null;
}

function setCookie(name: string, value: string, options?: { maxAgeSeconds?: number }) {
  if (typeof document === "undefined") return;
  const maxAge = options?.maxAgeSeconds ?? 60 * 60 * 24 * 7; // 7d
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

function clearCookie(name: string) {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${encodeURIComponent(name)}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}

export function notifyAuthChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function setAuthCookies(input: { token?: string | null; role?: UserRole | null }) {
  if ("token" in input) {
    if (input.token) setCookie(TOKEN_COOKIE_KEY, input.token);
    else clearCookie(TOKEN_COOKIE_KEY);
  }
  if ("role" in input) {
    if (input.role) setCookie(ROLE_COOKIE_KEY, input.role);
    else clearCookie(ROLE_COOKIE_KEY);
  }
}

export function clearAuthCookies() {
  clearCookie(TOKEN_COOKIE_KEY);
  clearCookie(ROLE_COOKIE_KEY);
}

let clearingSession = false;

/**
 * Clears localStorage + cookies and hard-navigates to /login so proxy/middleware
 * sees the empty session (fixes stuck state: cookie without usable client token).
 */
export function clearSessionAndRedirectToLogin() {
  if (typeof window === "undefined") return;
  if (clearingSession) return;
  clearingSession = true;

  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(ROLE_STORAGE_KEY);
  } catch {
    // ignore
  }
  clearAuthCookies();
  notifyAuthChanged();

  if (window.location.pathname === "/login") {
    clearingSession = false;
    return;
  }

  window.location.assign("/login");
}

/**
 * Re-sync localStorage from auth cookies (proxy uses cookies; API client uses LS).
 * Safe to call once on app mount.
 */
export function hydrateAuthFromCookies() {
  if (typeof window === "undefined") return false;

  let changed = false;
  try {
    const lsToken = window.localStorage.getItem(STORAGE_KEY);
    if (!lsToken) {
      const cookieToken = readCookie(TOKEN_COOKIE_KEY);
      if (cookieToken) {
        window.localStorage.setItem(STORAGE_KEY, cookieToken);
        changed = true;
      }
    }

    const lsRole = asUserRole(window.localStorage.getItem(ROLE_STORAGE_KEY));
    if (!lsRole) {
      const cookieRole = asUserRole(readCookie(ROLE_COOKIE_KEY));
      if (cookieRole) {
        window.localStorage.setItem(ROLE_STORAGE_KEY, cookieRole);
        changed = true;
      } else {
        const token = window.localStorage.getItem(STORAGE_KEY) ?? readCookie(TOKEN_COOKIE_KEY);
        const jwtRole = token ? roleFromJwt(token) : null;
        if (jwtRole) {
          window.localStorage.setItem(ROLE_STORAGE_KEY, jwtRole);
          setAuthCookies({ role: jwtRole });
          changed = true;
        }
      }
    }
  } catch {
    return false;
  }

  if (changed) notifyAuthChanged();
  return changed;
}

export type TokenStore = {
  get(): string | null;
  set(token: string): void;
  clear(): void;
};

export const tokenStore: TokenStore = {
  get() {
    if (typeof window === "undefined") return null;
    try {
      const fromLs = window.localStorage.getItem(STORAGE_KEY);
      if (fromLs) return fromLs;
      // Read-only cookie fallback (write-back happens in hydrateAuthFromCookies).
      return readCookie(TOKEN_COOKIE_KEY);
    } catch {
      return null;
    }
  },
  set(token: string) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, token);
      setAuthCookies({ token });
      notifyAuthChanged();
    } catch {
      // ignore
    }
  },
  clear() {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      setAuthCookies({ token: null });
      notifyAuthChanged();
    } catch {
      // ignore
    }
  },
};

export type RoleStore = {
  get(): UserRole | null;
  set(role: UserRole): void;
  clear(): void;
};

export const roleStore: RoleStore = {
  get() {
    if (typeof window === "undefined") return null;
    try {
      const fromLs = asUserRole(window.localStorage.getItem(ROLE_STORAGE_KEY));
      if (fromLs) return fromLs;

      const fromCookie = asUserRole(readCookie(ROLE_COOKIE_KEY));
      if (fromCookie) return fromCookie;

      const token = tokenStore.get();
      return token ? roleFromJwt(token) : null;
    } catch {
      return null;
    }
  },
  set(role: UserRole) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(ROLE_STORAGE_KEY, role);
      setAuthCookies({ role });
      notifyAuthChanged();
    } catch {
      // ignore
    }
  },
  clear() {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(ROLE_STORAGE_KEY);
      setAuthCookies({ role: null });
      notifyAuthChanged();
    } catch {
      // ignore
    }
  },
};
