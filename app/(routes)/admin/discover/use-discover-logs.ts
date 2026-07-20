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
  mergeServiceNameLists,
  sortLogsNewestFirst,
} from "./discover-utils"

export const DISCOVER_DEFAULT_SIZE = 50
export const DISCOVER_MIN_SIZE = 1
export const DISCOVER_MAX_SIZE = 500
/** @deprecated use DISCOVER_DEFAULT_SIZE */
export const DISCOVER_DEFAULT_LIMIT = DISCOVER_DEFAULT_SIZE
export const DISCOVER_MIN_LIMIT = DISCOVER_MIN_SIZE
export const DISCOVER_MAX_LIMIT = DISCOVER_MAX_SIZE

export type DiscoverStreamStatus = "idle" | "loading" | "live" | "paused" | "error"

function clampSize(size: number): number {
  if (!Number.isFinite(size)) return DISCOVER_DEFAULT_SIZE
  return Math.min(DISCOVER_MAX_SIZE, Math.max(DISCOVER_MIN_SIZE, Math.trunc(size)))
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

export type UseDiscoverLogsOptions = {
  /**
   * When true (client-side filter rules active), fetch page 0 with size=MAX (500)
   * so local filters can still fill the display size.
   */
  expandBufferForClientFilters?: boolean
  trackingId?: string
  from?: string
  to?: string
}

export function useDiscoverLogs(
  serviceFilter: string,
  size: number = DISCOVER_DEFAULT_SIZE,
  _excludeService: string = "",
  options: UseDiscoverLogsOptions = {},
) {
  const displaySize = clampSize(size)
  const expandBuffer = Boolean(options.expandBufferForClientFilters)
  const trackingId = (options.trackingId ?? "").trim()
  const from = (options.from ?? "").trim()
  const to = (options.to ?? "").trim()

  const fetchSize = expandBuffer ? DISCOVER_MAX_SIZE : displaySize

  const [page, setPage] = React.useState(0)
  const [logs, setLogs] = React.useState<ServiceLogResponse[]>([])
  const [totalElements, setTotalElements] = React.useState(0)
  const [totalPages, setTotalPages] = React.useState(0)
  const [status, setStatus] = React.useState<DiscoverStreamStatus>("idle")
  const [hasLoaded, setHasLoaded] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [liveEnabled, setLiveEnabled] = React.useState(true)
  const [lastConnectedAt, setLastConnectedAt] = React.useState<number | null>(null)
  const [reloadToken, setReloadToken] = React.useState(0)
  const [seenServices, setSeenServices] = React.useState<string[]>([])

  const subRef = React.useRef<LogsStreamSubscription | null>(null)
  const serviceRef = React.useRef(serviceFilter)
  const liveRef = React.useRef(liveEnabled)
  const pageRef = React.useRef(page)
  const fetchSizeRef = React.useRef(fetchSize)

  // Reset to first page when server-side filters / size mode change.
  React.useEffect(() => {
    setPage(0)
  }, [serviceFilter, trackingId, from, to, fetchSize, expandBuffer])

  React.useEffect(() => {
    serviceRef.current = serviceFilter
  }, [serviceFilter])

  React.useEffect(() => {
    liveRef.current = liveEnabled
  }, [liveEnabled])

  React.useEffect(() => {
    pageRef.current = page
  }, [page])

  React.useEffect(() => {
    fetchSizeRef.current = fetchSize
  }, [fetchSize])

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

  const goToPage = React.useCallback(
    (next: number) => {
      setPage((prev) => {
        const max = Math.max(totalPages - 1, 0)
        return Math.min(Math.max(0, next), max)
      })
    },
    [totalPages],
  )

  // History
  React.useEffect(() => {
    let cancelled = false

    async function loadHistory() {
      setStatus((prev) => (prev === "live" ? "live" : "loading"))
      setError(null)

      const requestPage = expandBuffer ? 0 : page

      try {
        const res = await brandmastApi.fetchLogs({
          page: requestPage,
          size: fetchSize,
          ...(serviceFilter ? { service: serviceFilter } : {}),
          ...(trackingId ? { trackingId } : {}),
          ...(from ? { from } : {}),
          ...(to ? { to } : {}),
        })
        if (cancelled) return

        if (res.success === false) {
          throw new Error(res.message || res.errorCode || "Nie udało się pobrać logów")
        }

        const data = res.data
        const items = sortLogsNewestFirst(data?.items ?? [])
        rememberServices(items)
        setLogs(items)
        setTotalElements(data?.totalElements ?? items.length)
        setTotalPages(data?.totalPages ?? 1)
        setHasLoaded(true)

        if (!liveRef.current) {
          setStatus("paused")
        } else {
          setStatus((prev) => (prev === "live" ? "live" : "idle"))
        }
      } catch (err) {
        if (cancelled) return
        setError(readApiError(err))
        setHasLoaded(true)
        setStatus("error")
        setLogs([])
        setTotalElements(0)
        setTotalPages(0)
      }
    }

    void loadHistory()
    return () => {
      cancelled = true
    }
  }, [
    serviceFilter,
    trackingId,
    from,
    to,
    page,
    fetchSize,
    expandBuffer,
    reloadToken,
    rememberServices,
  ])

  // Live SSE — only merge into list when viewing page 0 (or buffer mode).
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
        setStatus((prev) => (prev === "live" ? prev : "live"))

        const currentService = serviceRef.current
        if (currentService && entry.serviceName !== currentService) return

        // Respect trackingId drill-down while live.
        if (trackingId && entry.trackingId !== trackingId) return

        if (entry.serviceName?.trim()) {
          rememberServices([entry])
        }

        // Don't prepend live rows into deep history pages — avoids pagination races.
        if (pageRef.current > 0 && !expandBuffer) return

        setLogs((prev) => {
          const merged = mergeServiceLogs(prev, entry)
          return takeNewest(merged, fetchSizeRef.current)
        })
        setTotalElements((n) => n + 1)
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
  }, [
    liveEnabled,
    serviceFilter,
    trackingId,
    expandBuffer,
    reloadToken,
    stopStream,
    rememberServices,
  ])

  const canPrev = page > 0 && !expandBuffer
  const canNext = !expandBuffer && page + 1 < totalPages

  return {
    logs,
    status,
    error,
    hasLoaded,
    liveEnabled,
    lastConnectedAt,
    limit: displaySize,
    size: displaySize,
    bufferLimit: fetchSize,
    page: expandBuffer ? 0 : page,
    totalElements,
    totalPages: expandBuffer ? 1 : totalPages,
    canPrev,
    canNext,
    goToPage,
    setPage: goToPage,
    seenServices,
    refresh,
    pause,
    resume,
  }
}
