"use client"

import * as React from "react"
import { isAxiosError } from "axios"

import {
  brandmastApi,
  mergeServiceLogs,
  subscribeLogsStream,
  type LogsStreamSubscription,
  type ServiceLogResponse,
} from "@/lib/api"
import {
  collectServiceNames,
  filterLogsExcludingService,
  mergeServiceNameLists,
  sortLogsNewestFirst,
} from "./discover-utils"

export const DISCOVER_DEFAULT_LIMIT = 50
export const DISCOVER_MIN_LIMIT = 1
export const DISCOVER_MAX_LIMIT = 500

export type DiscoverStreamStatus = "idle" | "loading" | "live" | "paused" | "error"

function clampLimit(limit: number): number {
  if (!Number.isFinite(limit)) return DISCOVER_DEFAULT_LIMIT
  return Math.min(DISCOVER_MAX_LIMIT, Math.max(DISCOVER_MIN_LIMIT, Math.trunc(limit)))
}

function readApiError(err: unknown): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as { message?: string; errorCode?: string } | undefined
    return data?.message ?? err.message ?? "Błąd sieci."
  }
  if (err instanceof Error) return err.message
  return "Nieznany błąd."
}

function takeNewest(logs: ServiceLogResponse[], limit: number): ServiceLogResponse[] {
  const sorted = sortLogsNewestFirst(logs)
  return sorted.length > limit ? sorted.slice(0, limit) : sorted
}

function applyExcludeAndLimit(
  logs: ServiceLogResponse[],
  excludeService: string,
  limit: number,
): ServiceLogResponse[] {
  return takeNewest(filterLogsExcludingService(logs, excludeService), limit)
}

export function useDiscoverLogs(
  serviceFilter: string,
  limit: number = DISCOVER_DEFAULT_LIMIT,
  excludeService: string = "",
) {
  const clampedLimit = clampLimit(limit)
  const excludeTrimmed = excludeService.trim()

  const [logs, setLogs] = React.useState<ServiceLogResponse[]>([])
  // Start as idle so SSR + first client paint match (loading is set in the fetch effect).
  const [status, setStatus] = React.useState<DiscoverStreamStatus>("idle")
  const [hasLoaded, setHasLoaded] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [liveEnabled, setLiveEnabled] = React.useState(true)
  const [lastConnectedAt, setLastConnectedAt] = React.useState<number | null>(null)
  const [reloadToken, setReloadToken] = React.useState(0)
  const [seenServices, setSeenServices] = React.useState<string[]>([])

  const subRef = React.useRef<LogsStreamSubscription | null>(null)
  const serviceRef = React.useRef(serviceFilter)
  const excludeRef = React.useRef(excludeTrimmed)
  const liveRef = React.useRef(liveEnabled)
  const limitRef = React.useRef(clampedLimit)

  React.useEffect(() => {
    serviceRef.current = serviceFilter
  }, [serviceFilter])

  React.useEffect(() => {
    excludeRef.current = excludeTrimmed
  }, [excludeTrimmed])

  React.useEffect(() => {
    liveRef.current = liveEnabled
  }, [liveEnabled])

  React.useEffect(() => {
    limitRef.current = clampedLimit
    setLogs((prev) => applyExcludeAndLimit(prev, excludeRef.current, clampedLimit))
  }, [clampedLimit])

  const rememberServices = React.useCallback((batch: ServiceLogResponse[]) => {
    const names = collectServiceNames(batch)
    if (names.length === 0) return
    setSeenServices((prev) => mergeServiceNameLists(prev, names))
  }, [])

  const stopStream = React.useCallback(() => {
    subRef.current?.close()
    subRef.current = null
  }, [])

  const refresh = React.useCallback(() => {
    setReloadToken((n) => n + 1)
  }, [])

  const pause = React.useCallback(() => {
    liveRef.current = false
    setLiveEnabled(false)
    stopStream()
    setStatus("paused")
  }, [stopStream])

  const resume = React.useCallback(() => {
    liveRef.current = true
    setLiveEnabled(true)
    setStatus((s) => (s === "error" ? s : "idle"))
  }, [])

  // History
  React.useEffect(() => {
    let cancelled = false

    async function loadHistory() {
      // Don't clobber an already-live stream indicator while refreshing history.
      setStatus((prev) => (prev === "live" ? "live" : "loading"))
      setError(null)

      // Over-fetch a bit when excluding so the visible limit still fills after client filter.
      const fetchLimit = excludeTrimmed
        ? Math.min(DISCOVER_MAX_LIMIT, Math.max(clampedLimit * 3, clampedLimit + 50))
        : clampedLimit

      try {
        const res = await brandmastApi.fetchLogs({
          limit: fetchLimit,
          ...(serviceFilter ? { service: serviceFilter } : {}),
        })
        if (cancelled) return
        const raw = res.data ?? []
        rememberServices(raw)
        setLogs(applyExcludeAndLimit(raw, excludeTrimmed, clampedLimit))
        setHasLoaded(true)
        if (!liveRef.current) {
          setStatus("paused")
        } else {
          // Preserve "live" if SSE already connected; otherwise stay in connecting (idle).
          setStatus((prev) => (prev === "live" ? "live" : "idle"))
        }
      } catch (err) {
        if (cancelled) return
        setError(readApiError(err))
        setHasLoaded(true)
        setStatus("error")
        setLogs([])
      }
    }

    void loadHistory()
    return () => {
      cancelled = true
    }
  }, [serviceFilter, excludeTrimmed, clampedLimit, reloadToken, rememberServices])

  // Live SSE — owns stream lifecycle (history must not stopStream permanently).
  React.useEffect(() => {
    if (!liveEnabled) {
      stopStream()
      return
    }

    stopStream()
    setStatus((prev) => (prev === "error" ? prev : "idle"))

    const streamParams = serviceFilter ? { service: serviceFilter } : undefined

    subRef.current = subscribeLogsStream(streamParams, {
      onConnected: () => {
        setLastConnectedAt(Date.now())
        setStatus("live")
        setError(null)
      },
      onLog: (entry) => {
        // If backend skips `connected`, first log still means the stream works.
        setStatus((prev) => (prev === "live" ? prev : "live"))

        const currentService = serviceRef.current
        if (currentService && entry.serviceName !== currentService) return

        if (entry.serviceName?.trim()) {
          rememberServices([entry])
        }

        const excluded = excludeRef.current
        if (excluded && (entry.serviceName?.trim() ?? "") === excluded) return

        setLogs((prev) => {
          const merged = mergeServiceLogs(prev, entry)
          return applyExcludeAndLimit(merged, excludeRef.current, limitRef.current)
        })
      },
      onUnauthorized: () => {
        setError("Sesja wygasła — zaloguj się ponownie.")
        setStatus("error")
        stopStream()
      },
      onForbidden: () => {
        setError("Brak uprawnień admina do podglądu logów.")
        setStatus("error")
        stopStream()
      },
      onError: () => {
        setStatus((prev) => {
          if (prev === "error" || prev === "paused") return prev
          if (!liveRef.current) return "paused"
          return "idle"
        })
      },
    })

    return () => {
      stopStream()
    }
  }, [liveEnabled, serviceFilter, reloadToken, stopStream, rememberServices])

  return {
    logs,
    status,
    error,
    hasLoaded,
    liveEnabled,
    lastConnectedAt,
    limit: clampedLimit,
    seenServices,
    refresh,
    pause,
    resume,
  }
}
