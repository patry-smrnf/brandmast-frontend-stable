"use client"

import * as React from "react"
import { Suspense } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Loader2Icon, PauseIcon, PlayIcon, RefreshCwIcon, UserSearchIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { DiscoverFilterPanel } from "./_components/DiscoverFilterPanel"
import { DiscoverLogRow } from "./_components/DiscoverLogRow"
import { FindBrandmasterDialog } from "./_components/FindBrandmasterDialog"
import {
  collectHighlightTerms,
  countActiveRules,
  createDefaultFilterPreset,
  hasApiFilterFields,
  loadFilterPreset,
  presetFromSearchParams,
  presetToSearchParams,
  resolvePresetSize,
  saveFilterPreset,
  searchParamsHaveFilters,
  type DiscoverFilterPreset,
} from "./discover-filters"
import { formatTotalLabel, presetHasServerFilters } from "./discover-search"
import {
  collectMethodNames,
  collectServiceNames,
  formatLogDayLabel,
  KNOWN_SERVICE_NAMES,
  loadLogColors,
  logDayKey,
  logRowKey,
  mergeServiceNameLists,
  saveLogColors,
  type LogMarkColor,
} from "./discover-utils"
import { useDiscoverLogs, type DiscoverStreamStatus } from "./use-discover-logs"

function statusLabel(
  status: DiscoverStreamStatus,
  liveEnabled: boolean,
  liveBlockedByPage: boolean,
): string {
  if (status === "loading") return "Ładowanie"
  if (status === "error") return "Błąd"
  if (liveBlockedByPage) return "Live tylko na 1. stronie"
  if (!liveEnabled || status === "paused") return "Wstrzymane"
  if (status === "live") return "Live"
  return "Łączenie…"
}

function statusDotClass(
  status: DiscoverStreamStatus,
  liveEnabled: boolean,
  liveBlockedByPage: boolean,
): string {
  if (status === "error") return "bg-destructive"
  if (status === "loading") return "bg-amber-400 animate-pulse"
  if (liveBlockedByPage) return "bg-amber-500"
  if (!liveEnabled || status === "paused") return "bg-muted-foreground"
  if (status === "live") return "bg-emerald-400 animate-pulse"
  return "bg-sky-400 animate-pulse"
}

export default function AdminDiscoverPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2Icon className="size-5 animate-spin" />
          Ładowanie…
        </div>
      }
    >
      <AdminDiscoverPageInner />
    </Suspense>
  )
}

function AdminDiscoverPageInner() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [preset, setPreset] = React.useState<DiscoverFilterPreset>(() =>
    createDefaultFilterPreset(),
  )
  const [filtersReady, setFiltersReady] = React.useState(false)
  const urlHydratedRef = React.useRef(false)

  const [expandedKeys, setExpandedKeys] = React.useState<Set<string>>(() => new Set())
  const [colors, setColors] = React.useState<Record<string, LogMarkColor>>({})
  const [nowMs, setNowMs] = React.useState(() => Date.now())
  const [findBmOpen, setFindBmOpen] = React.useState(false)

  const isClient = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  React.useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 5_000)
    return () => window.clearInterval(id)
  }, [])

  React.useEffect(() => {
    const fromLs = loadFilterPreset()
    const params = new URLSearchParams(searchParams.toString())
    if (searchParamsHaveFilters(params)) {
      setPreset(presetFromSearchParams(params, fromLs))
    } else {
      setPreset(fromLs)
    }
    setColors(loadLogColors())
    setFiltersReady(true)
    urlHydratedRef.current = true
    // Only hydrate once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    if (!filtersReady) return
    saveFilterPreset(preset)
  }, [preset, filtersReady])

  // Sync key filters → URL (replace, no history spam)
  React.useEffect(() => {
    if (!filtersReady || !urlHydratedRef.current) return
    const next = presetToSearchParams(preset)
    const current = searchParams.toString()
    const nextStr = next.toString()
    if (current === nextStr) return
    const href = nextStr ? `${pathname}?${nextStr}` : pathname
    router.replace(href, { scroll: false })
  }, [preset, filtersReady, pathname, router, searchParams])

  // Debounce search body so typing doesn't hammer POST /search.
  // First paint after hydrate applies immediately (no empty-window flash).
  const [searchPreset, setSearchPreset] = React.useState(preset)
  const [searchReady, setSearchReady] = React.useState(false)
  const searchHydratedRef = React.useRef(false)
  React.useEffect(() => {
    if (!filtersReady) return
    if (!searchHydratedRef.current) {
      searchHydratedRef.current = true
      setSearchPreset(preset)
      setSearchReady(true)
      return
    }
    const id = window.setTimeout(() => setSearchPreset(preset), 350)
    return () => window.clearTimeout(id)
  }, [preset, filtersReady])

  const size = resolvePresetSize(searchPreset)
  const highlightTerms = React.useMemo(
    () => collectHighlightTerms(searchPreset),
    [searchPreset],
  )

  const {
    logs,
    status,
    error,
    hasLoaded,
    liveEnabled,
    liveBlockedByPage,
    liveNewCount,
    clearLiveNew,
    pageIndex,
    total,
    tookMs,
    canPrev,
    canNext,
    goNext,
    goPrev,
    seenServices,
    seenMethods,
    refresh,
    pause,
    resume,
  } = useDiscoverLogs({
    preset: searchPreset,
    size,
    enabled: searchReady,
  })

  const knownServices = React.useMemo(
    () =>
      mergeServiceNameLists(
        [...KNOWN_SERVICE_NAMES],
        seenServices,
        collectServiceNames(logs),
      ),
    [seenServices, logs],
  )

  const knownMethods = React.useMemo(
    () => mergeServiceNameLists(seenMethods, collectMethodNames(logs)),
    [seenMethods, logs],
  )

  const hasFilters = presetHasServerFilters(searchPreset)
  const activeRuleCount = countActiveRules(preset.rules)
  const totalLabel = formatTotalLabel(total)

  const setLogColor = React.useCallback((key: string, color: LogMarkColor | null) => {
    setColors((prev) => {
      const next = { ...prev }
      if (color) next[key] = color
      else delete next[key]
      saveLogColors(next)
      return next
    })
  }, [])

  const onTrackingIdClick = React.useCallback((id: string) => {
    setPreset((prev) => ({ ...prev, trackingId: id }))
  }, [])

  const toggleExpanded = React.useCallback((key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-3 py-6 sm:px-4 sm:py-8 lg:px-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Discover</h1>
            <Badge variant="outline" className="font-normal">
              Logs
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Wyszukiwanie serwerowe (Filter AST) + live SSE — klik trackingId filtruje
            łańcuch requestu.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setFindBmOpen(true)}
            title="Znajdź brandmastera po loginie"
          >
            <UserSearchIcon data-icon="inline-start" />
            Znajdź BM
          </Button>

          <div
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card/60 px-2.5 py-1.5 text-xs"
            title={
              liveBlockedByPage
                ? "Live jest wstrzymane poza pierwszą stroną wyników"
                : "Status strumienia SSE"
            }
          >
            <span
              className={cn(
                "size-2 rounded-full",
                statusDotClass(status, liveEnabled, liveBlockedByPage),
              )}
              aria-hidden
            />
            <span className="text-muted-foreground">
              {statusLabel(status, liveEnabled, liveBlockedByPage)}
            </span>
          </div>

          {liveBlockedByPage ? (
            <Badge variant="outline" className="font-normal text-[10px]">
              Live tylko na 1. stronie
            </Badge>
          ) : null}

          {liveNewCount > 0 ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                clearLiveNew()
                refresh()
              }}
              title="Wróć do najnowszych i odśwież"
            >
              {liveNewCount} nowych
            </Button>
          ) : null}

          {liveEnabled && !liveBlockedByPage ? (
            <Button type="button" variant="outline" size="sm" onClick={pause}>
              <PauseIcon data-icon="inline-start" />
              Wstrzymaj
            </Button>
          ) : (
            <Button type="button" variant="outline" size="sm" onClick={resume}>
              <PlayIcon data-icon="inline-start" />
              Live
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={isClient && status === "loading" ? true : undefined}
          >
            <RefreshCwIcon
              data-icon="inline-start"
              className={cn(status === "loading" && "animate-spin")}
            />
            Odśwież
          </Button>
        </div>
      </header>

      <DiscoverFilterPanel
        preset={preset}
        onChange={setPreset}
        serviceOptions={knownServices}
        methodOptions={knownMethods}
        hits={logs.length}
        totalLabel={totalLabel}
        tookMs={tookMs}
        pageIndex={pageIndex}
        canPrev={canPrev}
        canNext={canNext}
        onPrev={goPrev}
        onNext={goNext}
        usingDefaultTime={
          !(preset.from ?? "").trim() && !(preset.to ?? "").trim()
        }
      />

      {error ? (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <span className="min-w-0">{error}</span>
          <Button type="button" variant="outline" size="sm" onClick={refresh}>
            <RefreshCwIcon data-icon="inline-start" />
            Ponów
          </Button>
        </div>
      ) : null}

      <section className="flex min-h-[28rem] flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card/30 shadow-sm">
        <div className="hidden border-b border-border/80 bg-muted/30 px-3 py-2 font-mono text-[10px] tracking-wide text-muted-foreground uppercase sm:grid sm:grid-cols-[auto_8.5rem_4.5rem_9rem_minmax(0,1fr)] sm:gap-3 sm:px-3 lg:grid-cols-[auto_10rem_5rem_11rem_minmax(0,1fr)]">
          <span className="w-[3.25rem]" />
          <span>Time</span>
          <span>Level</span>
          <span>Service</span>
          <span>Message</span>
        </div>

        {!hasLoaded && logs.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2Icon className="size-5 animate-spin" />
            Pobieranie historii logów…
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-1 py-16 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Brak logów</p>
            <p className="text-xs">
              {hasFilters || hasApiFilterFields(preset) || activeRuleCount > 0
                ? "Żaden log nie spełnia filtrów — zmień je, rozszerz zakres czasu lub wyczyść."
                : "Gdy pojawią się nowe wpisy, zobaczysz je tutaj na żywo."}
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[min(70vh,44rem)] flex-1">
            <div>
              {logs.map((log, index) => {
                const key = logRowKey(log)
                const day = logDayKey(log.createdAt)
                const prevDay = index > 0 ? logDayKey(logs[index - 1]?.createdAt) : null
                const showDaySep = Boolean(day && day !== prevDay)
                return (
                  <React.Fragment key={key}>
                    {showDaySep ? (
                      <div className="sticky top-0 z-10 border-b border-border/70 bg-muted/90 px-3 py-1.5 text-[11px] font-medium tracking-wide text-muted-foreground backdrop-blur-sm">
                        {formatLogDayLabel(log.createdAt)}
                      </div>
                    ) : null}
                    <DiscoverLogRow
                      log={log}
                      color={colors[key] ?? null}
                      expanded={expandedKeys.has(key)}
                      onToggle={() => toggleExpanded(key)}
                      onColorChange={(color) => setLogColor(key, color)}
                      onTrackingIdClick={onTrackingIdClick}
                      highlightTerms={highlightTerms}
                      nowMs={nowMs}
                    />
                  </React.Fragment>
                )
              })}
            </div>
          </ScrollArea>
        )}
      </section>

      <FindBrandmasterDialog
        open={findBmOpen}
        onOpenChange={setFindBmOpen}
        onUseLogin={(login) => {
          setPreset((prev) => ({
            ...prev,
            detailsContains: login,
          }))
        }}
      />
    </main>
  )
}
