const STORAGE_KEY = "brandmast.token";
const ROLE_STORAGE_KEY = "brandmast.role";

export type UserRole = "brandmaster" | "supervisor";

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
    } catch {
      // ignore
    }
  },
  clear() {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(STORAGE_KEY);
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
      if (raw === "brandmaster" || raw === "supervisor") return raw;
      return null;
    } catch {
      return null;
    }
  },
  set(role: UserRole) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(ROLE_STORAGE_KEY, role);
    } catch {
      // ignore
    }
  },
  clear() {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(ROLE_STORAGE_KEY);
    } catch {
      // ignore
    }
  },
};

