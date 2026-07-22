"use client"

import * as React from "react"
import { isAxiosError } from "axios"

import {
  brandmastApi,
  mergeServiceLogs,
  subscribeLogsStream,
  type LogsStreamSubscription,
  type LogsSearchTotal,
  type ServiceLogResponse,
  type Violation,
} from "@/lib/api"
import type { DiscoverFilterPreset } from "./discover-filters"
import {
  buildLogsSearchRequest,
  discoverSearchIdentity,
  liveEntryMatchesPreset,
} from "./discover-search"
import {
  collectMethodNames,
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
    const data = err.response?.data as
      | { message?: string; errorCode?: string; violations?: Violation[] }
      | undefined
    const violations = data?.violations?.filter((v) => v.message?.trim())
    if (violations && violations.length > 0) {
      return violations
        .map((v) => (v.field ? `${v.field}: ${v.message}` : v.message))
        .join(" · ")
    }
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
  /** Full UI preset — built into POST /api/logs/search Filter AST. */
  preset: DiscoverFilterPreset
  size?: number
  /** When false, skip history/SSE (e.g. waiting for localStorage hydrate). */
  enabled?: boolean
}

type CursorNav = {
  after: string | null
  before: string | null
}

export function useDiscoverLogs({
  preset,
  size,
  enabled = true,
}: UseDiscoverLogsOptions) {
  const displaySize = clampSize(size ?? DISCOVER_DEFAULT_SIZE)
  const searchKey = React.useMemo(() => discoverSearchIdentity(preset), [preset])
  const serviceForStream = (preset.serviceInclude ?? "").trim()

  const [logs, setLogs] = React.useState<ServiceLogResponse[]>([])
  const [total, setTotal] = React.useState<LogsSearchTotal | null>(null)
  const [tookMs, setTookMs] = React.useState<number | null>(null)
  const [nextCursor, setNextCursor] = React.useState<string | null>(null)
  const [prevCursor, setPrevCursor] = React.useState<string | null>(null)
  const [hasMore, setHasMore] = React.useState(false)
  const [pageIndex, setPageIndex] = React.useState(0)
  const [cursorNav, setCursorNav] = React.useState<CursorNav>({ after: null, before: null })
  /** Search key for which `cursorNav` is valid — avoids fetching with stale cursors. */
  const [navSearchKey, setNavSearchKey] = React.useState(searchKey)

  const [status, setStatus] = React.useState<DiscoverStreamStatus>("idle")
  const [hasLoaded, setHasLoaded] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [liveEnabled, setLiveEnabled] = React.useState(true)
  const [liveNewCount, setLiveNewCount] = React.useState(0)
  const [lastConnectedAt, setLastConnectedAt] = React.useState<number | null>(null)
  const [reloadToken, setReloadToken] = React.useState(0)
  const [seenServices, setSeenServices] = React.useState<string[]>([])
  const [seenMethods, setSeenMethods] = React.useState<string[]>([])

  const subRef = React.useRef<LogsStreamSubscription | null>(null)
  const presetRef = React.useRef(preset)
  const liveRef = React.useRef(liveEnabled)
  const pageIndexRef = React.useRef(pageIndex)
  const sizeRef = React.useRef(displaySize)
  const userWantsLiveRef = React.useRef(true)
  const autoPausedByPageRef = React.useRef(false)

  const liveBlockedByPage = pageIndex > 0
  const cursorsReady = navSearchKey === searchKey

  // Reset cursor when search identity changes (filters / size / time).
  React.useEffect(() => {
    setCursorNav({ after: null, before: null })
    setPageIndex(0)
    setNavSearchKey(searchKey)
  }, [searchKey])

  React.useEffect(() => {
    presetRef.current = preset
  }, [preset])

  React.useEffect(() => {
    liveRef.current = liveEnabled
  }, [liveEnabled])

  React.useEffect(() => {
    pageIndexRef.current = pageIndex
  }, [pageIndex])

  React.useEffect(() => {
    sizeRef.current = displaySize
  }, [displaySize])

  const rememberServices = React.useCallback((batch: ServiceLogResponse[]) => {
    const names = collectServiceNames(batch)
    if (names.length === 0) return
    setSeenServices((prev) => mergeServiceNameLists(prev, names))
  }, [])

  const rememberMethods = React.useCallback((batch: ServiceLogResponse[]) => {
    const names = collectMethodNames(batch)
    if (names.length === 0) return
    setSeenMethods((prev) => mergeServiceNameLists(prev, names))
  }, [])

  const stopStream = React.useCallback(() => {
    subRef.current?.close()
    subRef.current = null
  }, [])

  // Auto-pause live when browsing history pages; resume on page 0 if user wants live.
  React.useEffect(() => {
    if (liveBlockedByPage) {
      if (liveRef.current) {
        autoPausedByPageRef.current = true
        liveRef.current = false
        setLiveEnabled(false)
        stopStream()
        setStatus("paused")
      }
      return
    }
    if (autoPausedByPageRef.current && userWantsLiveRef.current) {
      autoPausedByPageRef.current = false
      liveRef.current = true
      setLiveEnabled(true)
      setStatus((s) => (s === "error" ? s : "idle"))
    }
  }, [liveBlockedByPage, stopStream])

  const refresh = React.useCallback(() => {
    setLiveNewCount(0)
    setCursorNav({ after: null, before: null })
    setPageIndex(0)
    setReloadToken((n) => n + 1)
  }, [])

  const clearLiveNew = React.useCallback(() => {
    setLiveNewCount(0)
  }, [])

  const pause = React.useCallback(() => {
    userWantsLiveRef.current = false
    autoPausedByPageRef.current = false
    liveRef.current = false
    setLiveEnabled(false)
    stopStream()
    setStatus("paused")
  }, [stopStream])

  const resume = React.useCallback(() => {
    userWantsLiveRef.current = true
    autoPausedByPageRef.current = false
    if (pageIndexRef.current > 0) {
      setCursorNav({ after: null, before: null })
      setPageIndex(0)
      setReloadToken((n) => n + 1)
    }
    liveRef.current = true
    setLiveEnabled(true)
    setStatus((s) => (s === "error" ? s : "idle"))
  }, [])

  const goNext = React.useCallback(() => {
    if (!nextCursor) return
    setCursorNav({ after: nextCursor, before: null })
    setPageIndex((i) => i + 1)
  }, [nextCursor])

  const goPrev = React.useCallback(() => {
    if (pageIndex <= 0) return
    if (prevCursor) {
      setCursorNav({ after: null, before: prevCursor })
      setPageIndex((i) => Math.max(0, i - 1))
      return
    }
    // Fallback when backend omits prevCursor — jump to first page
    setCursorNav({ after: null, before: null })
    setPageIndex(0)
  }, [prevCursor, pageIndex])

  // History via POST /api/logs/search
  React.useEffect(() => {
    if (!enabled || !cursorsReady) return

    let cancelled = false

    async function loadHistory() {
      setStatus((prev) => (prev === "live" ? "live" : "loading"))
      setError(null)

      try {
        const body = buildLogsSearchRequest({
          preset: presetRef.current,
          after: cursorNav.after,
          before: cursorNav.before,
          trackTotalHits: true,
          highlight: false,
        })
        const res = await brandmastApi.searchLogs(body)
        if (cancelled) return

        if (res.success === false) {
          throw new Error(res.message || res.errorCode || "Nie udało się pobrać logów")
        }

        const data = res.data
        const items = sortLogsNewestFirst(data?.items ?? [])
        rememberServices(items)
        rememberMethods(items)
        setLogs(items)
        setTotal(
          data?.total
            ? {
                value: data.total.value ?? 0,
                relation: data.total.relation === "gte" ? "gte" : "eq",
              }
            : { value: items.length, relation: "eq" },
        )
        setTookMs(typeof data?.tookMs === "number" ? data.tookMs : null)
        setNextCursor(data?.page?.nextCursor ?? null)
        setPrevCursor(data?.page?.prevCursor ?? null)
        setHasMore(Boolean(data?.page?.hasMore))
        setLiveNewCount(0)
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
        setTotal(null)
        setTookMs(null)
        setNextCursor(null)
        setPrevCursor(null)
        setHasMore(false)
      }
    }

    void loadHistory()
    return () => {
      cancelled = true
    }
  }, [
    enabled,
    cursorsReady,
    searchKey,
    cursorNav.after,
    cursorNav.before,
    reloadToken,
    rememberServices,
    rememberMethods,
  ])

  // Live SSE — Phase A: only `service` on wire; client filters until filterId (Phase B).
  React.useEffect(() => {
    if (!enabled || !liveEnabled || liveBlockedByPage) {
      stopStream()
      return
    }

    stopStream()
    setStatus((prev) => (prev === "error" ? prev : "idle"))

    const streamParams = serviceForStream ? { service: serviceForStream } : undefined

    subRef.current = subscribeLogsStream(streamParams, {
      onConnected: () => {
        setLastConnectedAt(Date.now())
        setStatus("live")
        setError(null)
      },
      onLog: (entry) => {
        setStatus((prev) => (prev === "live" ? prev : "live"))

        if (!liveEntryMatchesPreset(entry, presetRef.current)) return

        if (entry.serviceName?.trim()) {
          rememberServices([entry])
        }
        if (entry.methodName?.trim()) {
          rememberMethods([entry])
        }

        if (pageIndexRef.current > 0) {
          setLiveNewCount((n) => n + 1)
          return
        }

        setLogs((prev) => {
          const merged = mergeServiceLogs(prev, entry)
          return takeNewest(merged, sizeRef.current)
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
  }, [
    enabled,
    liveEnabled,
    liveBlockedByPage,
    serviceForStream,
    searchKey,
    reloadToken,
    stopStream,
    rememberServices,
    rememberMethods,
  ])

  const canPrev = pageIndex > 0
  const canNext = hasMore && Boolean(nextCursor)
  const totalElements = total?.value ?? 0

  return {
    logs,
    status,
    error,
    hasLoaded,
    liveEnabled,
    liveBlockedByPage,
    liveNewCount,
    clearLiveNew,
    lastConnectedAt,
    limit: displaySize,
    size: displaySize,
    pageIndex,
    page: pageIndex,
    total,
    totalElements,
    tookMs,
    hasMore,
    nextCursor,
    prevCursor,
    canPrev,
    canNext,
    goNext,
    goPrev,
    /** @deprecated offset pages — use goNext/goPrev */
    goToPage: (next: number) => {
      if (next <= 0) {
        setCursorNav({ after: null, before: null })
        setPageIndex(0)
        setReloadToken((n) => n + 1)
      }
    },
    seenServices,
    seenMethods,
    refresh,
    pause,
    resume,
  }
}
