"use client"

import * as React from "react"
import { Loader2Icon, PauseIcon, PlayIcon, RefreshCwIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { DiscoverFilterPanel } from "./_components/DiscoverFilterPanel"
import { DiscoverLogRow } from "./_components/DiscoverLogRow"
import {
  countActiveRules,
  createDefaultFilterPreset,
  filterLogsByRules,
  loadFilterPreset,
  resolvePresetSize,
  saveFilterPreset,
  type DiscoverFilterPreset,
} from "./discover-filters"
import {
  collectServiceNames,
  KNOWN_SERVICE_NAMES,
  loadLogColors,
  logRowKey,
  mergeServiceNameLists,
  saveLogColors,
  type LogMarkColor,
} from "./discover-utils"
import { useDiscoverLogs, type DiscoverStreamStatus } from "./use-discover-logs"

function statusLabel(status: DiscoverStreamStatus, liveEnabled: boolean): string {
  if (status === "loading") return "Ładowanie"
  if (status === "error") return "Błąd"
  if (!liveEnabled || status === "paused") return "Wstrzymane"
  if (status === "live") return "Live"
  return "Łączenie…"
}

function statusDotClass(status: DiscoverStreamStatus, liveEnabled: boolean): string {
  if (status === "error") return "bg-destructive"
  if (status === "loading") return "bg-amber-400 animate-pulse"
  if (!liveEnabled || status === "paused") return "bg-muted-foreground"
  if (status === "live") return "bg-emerald-400 animate-pulse"
  return "bg-sky-400 animate-pulse"
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = React.useState(value)
  React.useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(id)
  }, [value, delayMs])
  return debounced
}

export default function AdminDiscoverPage() {
  const [preset, setPreset] = React.useState<DiscoverFilterPreset>(() =>
    createDefaultFilterPreset(),
  )
  const [filtersReady, setFiltersReady] = React.useState(false)

  const [expandedKey, setExpandedKey] = React.useState<string | null>(null)
  const [colors, setColors] = React.useState<Record<string, LogMarkColor>>({})

  const isClient = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  React.useEffect(() => {
    setPreset(loadFilterPreset())
    setColors(loadLogColors())
    setFiltersReady(true)
  }, [])

  React.useEffect(() => {
    if (!filtersReady) return
    saveFilterPreset(preset)
  }, [preset, filtersReady])

  const serviceInclude = useDebouncedValue((preset.serviceInclude ?? "").trim(), 350)
  const trackingId = useDebouncedValue((preset.trackingId ?? "").trim(), 350)
  const from = useDebouncedValue((preset.from ?? "").trim(), 350)
  const to = useDebouncedValue((preset.to ?? "").trim(), 350)
  const size = resolvePresetSize(preset)
  const activeRuleCount = countActiveRules(preset.rules)

  const {
    logs,
    status,
    error,
    hasLoaded,
    liveEnabled,
    bufferLimit,
    page,
    totalPages,
    totalElements,
    canPrev,
    canNext,
    goToPage,
    seenServices,
    refresh,
    pause,
    resume,
  } = useDiscoverLogs(serviceInclude, size, "", {
    expandBufferForClientFilters: activeRuleCount > 0,
    trackingId,
    from,
    to,
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

  const matchedLogs = React.useMemo(
    () => filterLogsByRules(logs, preset.rules),
    [logs, preset.rules],
  )

  // When local rules are active we over-fetch; still cap displayed rows by size.
  const filteredLogs = React.useMemo(() => {
    if (activeRuleCount === 0) return matchedLogs
    return matchedLogs.length > size ? matchedLogs.slice(0, size) : matchedLogs
  }, [matchedLogs, size, activeRuleCount])

  const hasFilters =
    activeRuleCount > 0 ||
    Boolean(serviceInclude) ||
    Boolean(trackingId) ||
    Boolean(from) ||
    Boolean(to)

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
            Historia (page/size) + live SSE — klik trackingId filtruje cały łańcuch requestu.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card/60 px-2.5 py-1.5 text-xs"
            title="Status strumienia SSE"
          >
            <span
              className={cn("size-2 rounded-full", statusDotClass(status, liveEnabled))}
              aria-hidden
            />
            <span className="text-muted-foreground">{statusLabel(status, liveEnabled)}</span>
          </div>

          {liveEnabled ? (
            <Button type="button" variant="outline" size="sm" onClick={pause}>
              <PauseIcon data-icon="inline-start" />
              Pause
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
        hits={filteredLogs.length}
        matched={matchedLogs.length}
        total={logs.length}
        bufferLimit={bufferLimit}
        page={page}
        totalPages={totalPages}
        totalElements={totalElements}
        canPrev={canPrev}
        canNext={canNext}
        onPageChange={goToPage}
      />

      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
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
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-1 py-16 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Brak logów</p>
            <p className="text-xs">
              {hasFilters
                ? "Żaden log nie spełnia filtrów / reguł — zmień je lub wyczyść."
                : "Gdy pojawią się nowe wpisy, zobaczysz je tutaj na żywo."}
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[min(70vh,44rem)] flex-1">
            <div>
              {filteredLogs.map((log) => {
                const key = logRowKey(log)
                return (
                  <DiscoverLogRow
                    key={key}
                    log={log}
                    color={colors[key] ?? null}
                    expanded={expandedKey === key}
                    onToggle={() =>
                      setExpandedKey((prev) => (prev === key ? null : key))
                    }
                    onColorChange={(color) => setLogColor(key, color)}
                    onTrackingIdClick={onTrackingIdClick}
                  />
                )
              })}
            </div>
          </ScrollArea>
        )}
      </section>
    </main>
  )
}
