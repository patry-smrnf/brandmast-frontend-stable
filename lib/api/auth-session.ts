import { clearAuthCookies, roleStore, tokenStore } from "@/lib/api/token";

/**
 * Clears all client auth state and hard-navigates to login.
 * Prefer this over soft `router.push` so unmounts cannot abort logout.
 */
export function forceLogout() {
  if (typeof window === "undefined") return;
  tokenStore.clear();
  roleStore.clear();
  clearAuthCookies();
  window.location.assign("/login");
}
