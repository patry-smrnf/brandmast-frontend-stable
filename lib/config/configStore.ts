import { useSyncExternalStore } from "react";

import type { SettingResponse } from "@/lib/api";

export type ConfigStatus = "idle" | "loading" | "ready" | "error";

export type ConfigState = {
  status: ConfigStatus;
  config: SettingResponse | null;
  lastFetchedAt: number | null;
  errorMessage: string | null;
};

const STORAGE_KEY = "brandmast.config";

let state: ConfigState = {
  status: "idle",
  config: null,
  lastFetchedAt: null,
  errorMessage: null,
};

const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners)
    l(); // wywolanie wszystkich listenerow
}

// funkcja do aktualizacji stanu
function setState(patch: Partial<ConfigState>) {
  state = { ...state, ...patch };
  emit();
}

// funkcja do pobierania stanu
export function getConfigState() {
  return state;
}

/** `false` only when config explicitly disables CAS; missing config does not block. */
export function isCasConnected(): boolean {
  return state.config?.accessConfig?.isCasConnected !== false;
}

/** Brandmaster must accept consents when config explicitly sets `zgody` to false. */
export function needsBrandmasterConsent(config: SettingResponse | null | undefined): boolean {
  return config?.brandmasterData?.zgody === false;
}


export function subscribeConfig(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useConfigState() {
  return useSyncExternalStore(subscribeConfig, getConfigState, getConfigState);
}

export function setConfig(config: SettingResponse) {
  setState({
    status: "ready",
    config,
    lastFetchedAt: Date.now(),
    errorMessage: null,
  });

  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ config, lastFetchedAt: Date.now() }),
    );
  } catch {
    // ignore
  }
}

export function setConfigLoading() {
  setState({ status: "loading", errorMessage: null });
}

export function setConfigError(message: string) {
  setState({ status: "error", errorMessage: message });
}

export function hydrateConfigFromStorage() {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as {
      config?: SettingResponse;
      lastFetchedAt?: number;
    };
    if (!parsed?.config) return;

    setState({
      status: "ready",
      config: parsed.config,
      lastFetchedAt: typeof parsed.lastFetchedAt === "number" ? parsed.lastFetchedAt : null,
      errorMessage: null,
    });
  } catch {
    // ignore
  }
}

