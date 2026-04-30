"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { isAxiosError } from "axios";

import { brandmastApi, tokenStore } from "@/lib/api";
import {
  getConfigState,
  hydrateConfigFromStorage,
  setConfig,
  setConfigError,
  setConfigLoading,
} from "@/lib/config/configStore";

type Props = {
  /**
   * Refetch config at most once per `ttlMs` while navigating.
   * Keeps config fresh without spamming the API.
   */
  ttlMs?: number;
};

export function ConfigBootstrap({ ttlMs = 60_000 }: Props) {
  const pathname = usePathname();
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    hydrateConfigFromStorage();
  }, []);

  useEffect(() => {
    const token = tokenStore.get();
    if (!token) return;

    const { lastFetchedAt, status } = getConfigState();
    const now = Date.now();
    const isFresh = typeof lastFetchedAt === "number" && now - lastFetchedAt < ttlMs;
    if (isFresh || status === "loading") return;

    let cancelled = false;
    (async () => {
      setConfigLoading();
      try {
        const res = await brandmastApi.fetchConfig();
        if (cancelled) return;
        if (res.success && res.data) {
          setConfig(res.data);
          return;
        }
        setConfigError(res.message ?? "Nie udało się pobrać konfiguracji.");
      } catch (err) {
        if (cancelled) return;
        if (isAxiosError(err)) {
          const maybeData = err.response?.data as
            | { message?: string; success?: boolean }
            | undefined;
          setConfigError(maybeData?.message ?? "Błąd sieci podczas pobierania konfiguracji.");
          return;
        }
        setConfigError("Błąd podczas pobierania konfiguracji.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, ttlMs]);

  return null;
}

