const STORAGE_KEY = "brandmast.token";
const ROLE_STORAGE_KEY = "brandmast.role";

export type UserRole = "brandmaster" | "supervisor" | "admin";

export function isUserRole(value: unknown): value is UserRole {
  return value === "brandmaster" || value === "supervisor" || value === "admin";
}

export function homePathForRole(role: UserRole): string {
  if (role === "admin") return "/admin";
  if (role === "supervisor") return "/supervisor";
  return "/brandmaster";
}

const TOKEN_COOKIE_KEY = STORAGE_KEY;
const ROLE_COOKIE_KEY = ROLE_STORAGE_KEY;

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

export type TokenStore = {
  get(): string | null;
  set(token: string): void;
  clear(): void;
};

export const tokenStore: TokenStore = {
  get() {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  },
  set(token: string) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, token);
      setAuthCookies({ token });
    } catch {
      // ignore
    }
  },
  clear() {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      setAuthCookies({ token: null });
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
      const raw = window.localStorage.getItem(ROLE_STORAGE_KEY);
      if (isUserRole(raw)) return raw;
      return null;
    } catch {
      return null;
    }
  },
  set(role: UserRole) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(ROLE_STORAGE_KEY, role);
      setAuthCookies({ role });
    } catch {
      // ignore
    }
  },
  clear() {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(ROLE_STORAGE_KEY);
      setAuthCookies({ role: null });
    } catch {
      // ignore
    }
  },
};

