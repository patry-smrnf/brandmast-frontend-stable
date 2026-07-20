"use client"

import * as React from "react"
import {
  Loader2Icon,
  PauseIcon,
  PlayIcon,
  RefreshCwIcon,
  SearchIcon,
  XIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { DiscoverLogRow } from "./_components/DiscoverLogRow"
import {
  collectServiceNames,
  filterLogsByText,
  loadLogColors,
  logRowKey,
  mergeServiceNameLists,
  saveLogColors,
  type LogMarkColor,
} from "./discover-utils"
import {
  DISCOVER_DEFAULT_LIMIT,
  DISCOVER_MAX_LIMIT,
  DISCOVER_MIN_LIMIT,
  useDiscoverLogs,
  type DiscoverStreamStatus,
} from "./use-discover-logs"

const ALL_SERVICES = "__all__"
const NO_EXCLUDE = "__none__"
const LIMIT_PRESETS = [25, 50, 100, 200, 500] as const


function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = React.useState(value)
  React.useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(id)
  }, [value, delayMs])
  return debounced
}

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

export default function AdminDiscoverPage() {
  const [textQuery, setTextQuery] = React.useState("")
  const deferredText = React.useDeferredValue(textQuery)

  const [serviceDraft, setServiceDraft] = React.useState("")
  const serviceFilter = useDebouncedValue(serviceDraft.trim(), 350)

  const [excludeDraft, setExcludeDraft] = React.useState("")
  const excludeService = useDebouncedValue(excludeDraft.trim(), 350)

  const [limit, setLimit] = React.useState(DISCOVER_DEFAULT_LIMIT)

  const [expandedKey, setExpandedKey] = React.useState<string | null>(null)
  const [colors, setColors] = React.useState<Record<string, LogMarkColor>>({})

  const { logs, status, error, hasLoaded, liveEnabled, seenServices, refresh, pause, resume } =
    useDiscoverLogs(serviceFilter, limit, excludeService)

  const isClient = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  React.useEffect(() => {
    setColors(loadLogColors())
  }, [])

  const knownServices = React.useMemo(
    () => mergeServiceNameLists(seenServices, collectServiceNames(logs)),
    [seenServices, logs],
  )

  const serviceOptions = React.useMemo(() => {
    const set = new Set(knownServices)
    const includeDraft = serviceDraft.trim()
    const exclDraft = excludeDraft.trim()
    if (includeDraft) set.add(includeDraft)
    if (exclDraft) set.add(exclDraft)
    if (serviceFilter) set.add(serviceFilter)
    if (excludeService) set.add(excludeService)
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pl"))
  }, [knownServices, serviceDraft, excludeDraft, serviceFilter, excludeService])

  const filteredLogs = React.useMemo(
    () => filterLogsByText(logs, deferredText),
    [logs, deferredText],
  )

  const setLogColor = React.useCallback((key: string, color: LogMarkColor | null) => {
    setColors((prev) => {
      const next = { ...prev }
      if (color) next[key] = color
      else delete next[key]
      saveLogColors(next)
      return next
    })
  }, [])

  const clearFilters = () => {
    setTextQuery("")
    setServiceDraft("")
    setExcludeDraft("")
  }

  const hasFilters = Boolean(textQuery.trim() || serviceDraft.trim() || excludeDraft.trim())

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
            Historia i podgląd na żywo logów serwisowych — w stylu OpenSearch Discover.
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

      <section className="rounded-xl border border-border bg-card/40 shadow-sm">
        <div className="flex flex-col gap-3 p-3 sm:p-4 lg:flex-row lg:items-end">
          <div className="min-w-0 flex-1 space-y-1.5">
            <Label htmlFor="discover-search" className="text-xs text-muted-foreground">
              Szukaj w logach
            </Label>
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="discover-search"
                value={textQuery}
                onChange={(e) => setTextQuery(e.target.value)}
                placeholder="message, service, trackingId, details…"
                className="h-9 pr-9 pl-9"
                autoComplete="off"
              />
              {textQuery ? (
                <button
                  type="button"
                  className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={() => setTextQuery("")}
                  aria-label="Wyczyść wyszukiwanie"
                >
                  <XIcon className="size-3.5" />
                </button>
              ) : null}
            </div>
          </div>

          <div className="w-full space-y-1.5 sm:w-36 lg:w-40">
            <Label htmlFor="discover-limit" className="text-xs text-muted-foreground">
              Limit
            </Label>
            <Select
              value={String(limit)}
              onValueChange={(v) => {
                const n = Number(v)
                if (!Number.isFinite(n)) return
                setLimit(
                  Math.min(DISCOVER_MAX_LIMIT, Math.max(DISCOVER_MIN_LIMIT, Math.trunc(n))),
                )
              }}
            >
              <SelectTrigger id="discover-limit" className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LIMIT_PRESETS.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full space-y-1.5 lg:w-64">
            <Label htmlFor="discover-service" className="text-xs text-muted-foreground">
              Tylko serviceName
            </Label>
            <Select
              value={serviceDraft.trim() || ALL_SERVICES}
              onValueChange={(v) => {
                const next = v === ALL_SERVICES ? "" : (v ?? "")
                setServiceDraft(next)
                if (next && excludeDraft.trim() === next) setExcludeDraft("")
              }}
            >
              <SelectTrigger id="discover-service" className="h-9 w-full">
                <SelectValue placeholder="Wszystkie serwisy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_SERVICES}>Wszystkie serwisy</SelectItem>
                {serviceOptions.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={serviceDraft}
              onChange={(e) => setServiceDraft(e.target.value)}
              onBlur={() => {
                setServiceDraft((s) => {
                  const next = s.trim()
                  if (next && excludeDraft.trim() === next) setExcludeDraft("")
                  return next
                })
              }}
              placeholder="Lub wpisz serviceName…"
              className="h-8 text-xs"
              list="discover-service-options"
              autoComplete="off"
            />
          </div>

          <div className="w-full space-y-1.5 lg:w-64">
            <Label htmlFor="discover-exclude" className="text-xs text-muted-foreground">
              Wyklucz serviceName
            </Label>
            <Select
              value={excludeDraft.trim() || NO_EXCLUDE}
              onValueChange={(v) => {
                const next = v === NO_EXCLUDE ? "" : (v ?? "")
                setExcludeDraft(next)
                if (next && serviceDraft.trim() === next) setServiceDraft("")
              }}
            >
              <SelectTrigger id="discover-exclude" className="h-9 w-full">
                <SelectValue placeholder="Bez wykluczenia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_EXCLUDE}>Bez wykluczenia</SelectItem>
                {serviceOptions.map((name) => (
                  <SelectItem key={`ex-${name}`} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={excludeDraft}
              onChange={(e) => setExcludeDraft(e.target.value)}
              onBlur={() => {
                setExcludeDraft((s) => {
                  const next = s.trim()
                  if (next && serviceDraft.trim() === next) setServiceDraft("")
                  return next
                })
              }}
              placeholder="Lub wpisz serwis do ukrycia…"
              className="h-8 text-xs"
              list="discover-service-options"
              autoComplete="off"
            />
            <datalist id="discover-service-options">
              {serviceOptions.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>

          {hasFilters ? (
            <Button type="button" variant="ghost" size="sm" className="lg:mb-0.5" onClick={clearFilters}>
              <XIcon data-icon="inline-start" />
              Wyczyść filtry
            </Button>
          ) : null}
        </div>

        <Separator />

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 text-xs text-muted-foreground sm:px-4">
          <span>
            Hits:{" "}
            <span className="font-medium text-foreground tabular-nums">{filteredLogs.length}</span>
            {deferredText.trim() || serviceFilter || excludeService ? (
              <span className="text-muted-foreground"> / {logs.length}</span>
            ) : null}
          </span>
          <span className="hidden sm:inline">·</span>
          <span>
            Limit:{" "}
            <span className="font-medium text-foreground tabular-nums">{limit}</span>
          </span>
          <span className="hidden sm:inline">·</span>
          <span>
            Serwisy:{" "}
            <span className="font-medium text-foreground tabular-nums">
              {serviceOptions.length}
            </span>
          </span>
          {serviceFilter ? (
            <>
              <span className="hidden sm:inline">·</span>
              <span>
                Tylko: <span className="font-mono text-foreground">{serviceFilter}</span>
              </span>
            </>
          ) : null}
          {excludeService ? (
            <>
              <span className="hidden sm:inline">·</span>
              <span>
                Bez: <span className="font-mono text-foreground">{excludeService}</span>
              </span>
            </>
          ) : null}
        </div>
      </section>

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
                ? "Spróbuj zmienić filtry lub wyczyścić wyszukiwanie."
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
