"use client"

import * as React from "react"
import {
  AlertTriangleIcon,
  BarChart3Icon,
  CalendarDaysIcon,
  LayoutListIcon,
  PlusIcon,
  RefreshCwIcon,
  UsersIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import type { BrandmastersResponse } from "@/lib/api/generated/types"
import { brandmasterMatchesQuery } from "@/lib/brandmasters/brandmaster-utils"
import { toDateKey, toMonthKey } from "@/lib/dates/date-utils"
import { isCasConnected } from "@/lib/config"
import { cn } from "@/lib/utils"

import { useSvActions } from "../use-sv-actions"
import { CasDisconnectedBanner } from "../_components/CasDisconnectedBanner"
import { AddBrandmasterSheet } from "./_components/AddBrandmasterSheet"
import { BrandmastersDetailPanel } from "./_components/BrandmastersDetailPanel"
import { BrandmastersListView } from "./_components/BrandmastersListView"
import { BrandmastersStatsView } from "./_components/BrandmastersStatsView"
import {
  aggregateBrandmasterStats,
  filterStatsByBrandmasterSearch,
  formatStatsDayLabel,
} from "./brandmaster-stats-utils"
import { useBrandmasters } from "./use-brandmasters"

type ViewMode = "list" | "stats"

function LoadingSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="h-14 animate-pulse rounded-xl border border-border/80 bg-muted/50"
        />
      ))}
    </div>
  )
}

function StatsLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <div className="h-20 animate-pulse rounded-xl border border-border/80 bg-muted/50" />
        <div className="h-20 animate-pulse rounded-xl border border-border/80 bg-muted/50" />
        <div className="col-span-2 h-20 animate-pulse rounded-xl border border-border/80 bg-muted/50 sm:col-span-1" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-32 animate-pulse rounded-xl border border-border/80 bg-muted/50"
        />
      ))}
    </div>
  )
}

function lastDateKeyOfMonth(monthKey: string) {
  const [y, m] = monthKey.split("-")
  return toDateKey(new Date(Number(y), Number(m), 0))
}

export default function SupervisorBrandmastersPage() {
  const [viewMode, setViewMode] = React.useState<ViewMode>("list")
  const [addBrandmasterOpen, setAddBrandmasterOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [selected, setSelected] = React.useState<BrandmastersResponse | null>(null)
  const [statsMonthKey, setStatsMonthKey] = React.useState(() => toMonthKey(new Date()))
  const [statsFromDateKey, setStatsFromDateKey] = React.useState(() => toDateKey(new Date()))
  const casConnected = isCasConnected()

  const { brandmasters, isLoading, error, refetch, removeBrandmasterLocally } = useBrandmasters()
  const {
    rows: actionRows,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useSvActions(statsMonthKey, { enabled: viewMode === "stats" })

  const filteredBrandmasters = React.useMemo(
    () => brandmasters.filter((bm) => brandmasterMatchesQuery(bm, search)),
    [brandmasters, search]
  )

  React.useEffect(() => {
    setStatsFromDateKey((prev) => {
      if (prev.startsWith(statsMonthKey)) return prev
      const today = toDateKey(new Date())
      return today.startsWith(statsMonthKey) ? today : `${statsMonthKey}-01`
    })
  }, [statsMonthKey])

  const statsMonthDateBounds = React.useMemo(
    () => ({
      min: `${statsMonthKey}-01`,
      max: lastDateKeyOfMonth(statsMonthKey),
    }),
    [statsMonthKey]
  )

  const statsFromDayLabel = React.useMemo(
    () => formatStatsDayLabel(statsFromDateKey),
    [statsFromDateKey]
  )

  const brandmasterStats = React.useMemo(() => {
    const aggregated = aggregateBrandmasterStats(actionRows, brandmasters, {
      fromDateKey: statsFromDateKey,
      monthKey: statsMonthKey,
    })
    return filterStatsByBrandmasterSearch(aggregated, brandmasters, search)
  }, [actionRows, brandmasters, search, statsFromDateKey, statsMonthKey])

  const selectedId = selected?.brandmasterId ?? null
  const isStatsView = viewMode === "stats"
  const listBusy = isLoading
  const statsBusy = statsLoading
  const showRefreshSpin = isStatsView ? statsBusy : listBusy

  React.useEffect(() => {
    if (!selected) return
    const stillExists = brandmasters.some(
      (bm) => (bm.brandmasterId ?? 0) === (selected.brandmasterId ?? 0)
    )
    if (!stillExists) setSelected(null)
  }, [brandmasters, selected])

  function onRowClick(bm: BrandmastersResponse) {
    setSelected(bm)
  }

  function onDeleted(id: number) {
    removeBrandmasterLocally(id)
    setSelected(null)
  }

  function handleRefresh() {
    void refetch()
    if (isStatsView) void refetchStats()
  }

  return (
    <main className="flex flex-1 flex-col bg-background pb-24">
      <div className="mx-auto w-full max-w-5xl px-4 py-6">
        {!casConnected ? <CasDisconnectedBanner /> : null}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 space-y-1">
            <p className="text-xs text-muted-foreground">Panel Supervisora</p>
            <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight sm:text-2xl">
              <UsersIcon className="size-5 text-muted-foreground" aria-hidden />
              Brandmasterzy w zespole
            </h1>
            <p className="max-w-prose text-sm text-muted-foreground">
              {isStatsView
                ? "Statystyki akcji w miesiącu: odwołania, godziny łącznie oraz od wybranego dnia."
                : "Podgląd brandmasterów przypisanych do teamu. Wybierz wiersz, aby zobaczyć szczegóły lub usunąć konto."}
            </p>
            <p className="text-xs text-muted-foreground">
              {isStatsView ? (
                statsBusy ? (
                  <span className="inline-flex items-center gap-1.5">
                    <RefreshCwIcon className="size-3.5 animate-spin" />
                    Ładowanie statystyk…
                  </span>
                ) : statsError ? (
                  <span className="inline-flex items-center gap-1.5 text-destructive">
                    <AlertTriangleIcon className="size-3.5" />
                    {statsError}
                  </span>
                ) : (
                  <span>
                    Miesiąc{" "}
                    <span className="font-medium tabular-nums text-foreground">{statsMonthKey}</span>
                    {" · "}
                    <span className="font-medium text-foreground">{brandmasterStats.length}</span>
                    {search.trim() ? " pasujących" : " brandmasterów"}
                  </span>
                )
              ) : listBusy ? (
                <span className="inline-flex items-center gap-1.5">
                  <RefreshCwIcon className="size-3.5 animate-spin" />
                  Ładowanie…
                </span>
              ) : error ? (
                <span className="inline-flex items-center gap-1.5 text-destructive">
                  <AlertTriangleIcon className="size-3.5" />
                  {error}
                </span>
              ) : (
                <span>
                  <span className="font-medium text-foreground">{filteredBrandmasters.length}</span>
                  {search.trim()
                    ? ` pasujących (${brandmasters.length} łącznie)`
                    : ` brandmasterów`}
                </span>
              )}
            </p>
          </div>

          <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row">
            {!isStatsView ? (
              <Button
                type="button"
                size="sm"
                className="w-full sm:w-auto"
                disabled={listBusy || !casConnected}
                title={!casConnected ? "CAS jest wyłączony" : undefined}
                onClick={() => setAddBrandmasterOpen(true)}
              >
                <PlusIcon className="size-4" />
                <span className="ml-2">Dodaj brandmastera</span>
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              disabled={listBusy || (isStatsView && statsBusy)}
              onClick={handleRefresh}
            >
              <RefreshCwIcon className={cn("size-4", showRefreshSpin ? "animate-spin" : null)} />
              <span className="ml-2">Odśwież</span>
            </Button>
          </div>
        </header>

        {casConnected ? (
          <AddBrandmasterSheet
            open={addBrandmasterOpen}
            onOpenChange={setAddBrandmasterOpen}
            existingBrandmasters={brandmasters}
            onBrandmasterAdded={() => void refetch()}
          />
        ) : null}

        <Separator className="my-6" />

        <section className="space-y-4">
          <Input
            type="search"
            placeholder={
              isStatsView
                ? "Szukaj brandmastera w statystykach…"
                : "Szukaj po imieniu, nazwisku, loginie, e-mailu, ID…"
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
            autoComplete="off"
          />

          <div
            className="grid w-full max-w-md grid-cols-2 gap-1 rounded-xl border border-border bg-muted/50 p-1 shadow-xs"
            role="group"
            aria-label="Tryb widoku"
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-pressed={viewMode === "list"}
              onClick={() => setViewMode("list")}
              className={cn(
                "h-9 w-full justify-center gap-1.5 rounded-lg text-xs font-medium",
                viewMode === "list"
                  ? "bg-background text-foreground shadow-sm hover:bg-background"
                  : "text-muted-foreground hover:bg-background/70 hover:text-foreground"
              )}
            >
              <LayoutListIcon className="size-3.5 shrink-0" aria-hidden />
              Lista
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-pressed={viewMode === "stats"}
              onClick={() => setViewMode("stats")}
              className={cn(
                "h-9 w-full justify-center gap-1.5 rounded-lg text-xs font-medium",
                viewMode === "stats"
                  ? "bg-background text-foreground shadow-sm hover:bg-background"
                  : "text-muted-foreground hover:bg-background/70 hover:text-foreground"
              )}
            >
              <BarChart3Icon className="size-3.5 shrink-0" aria-hidden />
              Statystyki
            </Button>
          </div>

          {isStatsView ? (
            <div className="grid grid-cols-1 gap-4 sm:max-w-xl sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="bm-stats-month" className="text-xs text-muted-foreground">
                  Miesiąc statystyk
                </Label>
                <div className="relative">
                  <CalendarDaysIcon
                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <Input
                    id="bm-stats-month"
                    type="month"
                    value={statsMonthKey}
                    onChange={(e) => setStatsMonthKey(e.target.value)}
                    className="pl-9 tabular-nums"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="bm-stats-from-day" className="text-xs text-muted-foreground">
                  Godziny od dnia
                </Label>
                <div className="relative">
                  <CalendarDaysIcon
                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <Input
                    id="bm-stats-from-day"
                    type="date"
                    value={statsFromDateKey}
                    min={statsMonthDateBounds.min}
                    max={statsMonthDateBounds.max}
                    onChange={(e) => setStatsFromDateKey(e.target.value)}
                    className="pl-9 tabular-nums"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Suma akcji od tego dnia do końca miesiąca ({statsFromDayLabel}).
                </p>
              </div>
            </div>
          ) : null}
        </section>

        <div className="mt-8">
          {isStatsView ? (
            statsBusy ? (
              <StatsLoadingSkeleton />
            ) : statsError ? (
              <p className="rounded-xl border border-dashed border-destructive/40 bg-destructive/5 px-4 py-8 text-center text-sm text-destructive">
                {statsError}
              </p>
            ) : (
              <BrandmastersStatsView
                stats={brandmasterStats}
                fromDayLabel={statsFromDayLabel}
                emptyMessage={
                  search.trim()
                    ? "Brak brandmasterów pasujących do wyszukiwania."
                    : "Brak brandmasterów w zespole."
                }
              />
            )
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
              <div>
                {listBusy ? (
                  <LoadingSkeleton />
                ) : (
                  <BrandmastersListView
                    brandmasters={filteredBrandmasters}
                    selectedId={selectedId}
                    onRowClick={onRowClick}
                    emptyMessage={
                      search.trim()
                        ? "Brak brandmasterów pasujących do wyszukiwania."
                        : "Brak brandmasterów w zespole."
                    }
                  />
                )}
              </div>

              {!listBusy ? (
                <BrandmastersDetailPanel selected={selected} onDeleted={onDeleted} />
              ) : null}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
