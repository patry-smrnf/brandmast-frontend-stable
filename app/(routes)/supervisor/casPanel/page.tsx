"use client"

import * as React from "react"
import {
  AlertTriangleIcon,
  BarChart3Icon,
  CalendarDaysIcon,
  ClipboardListIcon,
  RefreshCwIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import type { TourPlannerActionListItem } from "@/lib/api/generated/types"
import type { CasActionStatus } from "@/lib/cas-status"
import { formatPlDatePoland, parseIso, toDateKeyInPoland } from "@/lib/dates/date-utils"
import { cn } from "@/lib/utils"

import { CasActionCard } from "./_components/CasActionCard"
import { CasActionDetailSheet } from "./_components/CasActionDetailSheet"
import { CasDayStatsSheet } from "./_components/CasDayStatsSheet"
import {
  casActionHasBrandmaster,
  filterCasActionsForDisplay,
  getCasActionRowKey,
} from "./cas-panel-utils"
import { useCasPanelActions } from "./use-cas-panel"

function LoadingSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="h-[5.5rem] animate-pulse rounded-xl border border-border/80 bg-muted/50"
        />
      ))}
    </div>
  )
}

export default function SupervisorCasPanelPage() {
  const [dateKey, setDateKey] = React.useState(() => toDateKeyInPoland())
  const [search, setSearch] = React.useState("")
  const [selectedAction, setSelectedAction] = React.useState<TourPlannerActionListItem | null>(
    null,
  )
  const [detailOpen, setDetailOpen] = React.useState(false)
  const [statsOpen, setStatsOpen] = React.useState(false)

  const { actions, isLoading, error, refetch, updateActionStatus } = useCasPanelActions(dateKey)

  const displayActions = React.useMemo(
    () => filterCasActionsForDisplay(actions, search),
    [actions, search],
  )

  const actionsWithBm = React.useMemo(
    () => actions.filter(casActionHasBrandmaster),
    [actions],
  )

  const headerDate = React.useMemo(() => {
    const d = parseIso(`${dateKey}T12:00:00`)
    return d ? formatPlDatePoland(d) : dateKey
  }, [dateKey])

  function openAction(action: TourPlannerActionListItem) {
    setSelectedAction(action)
    setDetailOpen(true)
  }

  function handleDetailOpenChange(open: boolean) {
    setDetailOpen(open)
    if (!open) setSelectedAction(null)
  }

  async function handleStatusChange(ident: string, status: CasActionStatus) {
    const result = await updateActionStatus(ident, status)
    setSelectedAction((prev) =>
      prev?.ident?.trim() === ident ? { ...prev, status } : prev,
    )
    return result
  }

  return (
    <main className="flex flex-1 flex-col bg-background pb-24">
      <div className="mx-auto w-full max-w-5xl px-4 py-6">
        <header className="flex flex-col gap-4">
          <div className="min-w-0 space-y-1">
            <p className="text-xs text-muted-foreground">Panel Supervisora</p>
            <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight sm:text-2xl">
              <ClipboardListIcon className="size-5 text-muted-foreground" aria-hidden />
              Widok CAS
            </h1>
            <p className="max-w-prose text-sm text-muted-foreground">
              Akcje z Tour Plannera dla wybranego dnia. Klikamy karte, aby zobaczyć szczegóły,
              zmienić status lub wyniki sprzedaży.
            </p>
            <p className="text-xs text-muted-foreground">
              {isLoading ? (
                <span className="inline-flex items-center gap-1.5">
                  <RefreshCwIcon className="size-3.5 animate-spin" />
                  Ładowanie akcji…
                </span>
              ) : error ? (
                <span className="inline-flex items-center gap-1.5 text-destructive">
                  <AlertTriangleIcon className="size-3.5" />
                  {error}
                </span>
              ) : (
                <span>
                  <span className="font-medium text-foreground">{actionsWithBm.length}</span> akcji
                  {search.trim() ? ` · ${displayActions.length} pasujących` : null}
                  {" · "}
                  <span className="font-medium tabular-nums text-foreground">{dateKey}</span>
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              disabled={isLoading}
              onClick={() => refetch()}
            >
              <RefreshCwIcon className={cn("size-4", isLoading && "animate-spin")} />
              <span className="ml-2">Odśwież</span>
            </Button>
            <Button
              type="button"
              size="sm"
              className="w-full sm:w-auto"
              disabled={isLoading || actionsWithBm.length === 0}
              onClick={() => setStatsOpen(true)}
            >
              <BarChart3Icon className="size-4" />
              <span className="ml-2">Statystyki dnia</span>
            </Button>
          </div>
        </header>

        <Separator className="my-6" />

        <section className="space-y-4">
          <div className="grid min-w-0 grid-cols-1 gap-4 sm:max-w-md">
            <div className="flex min-w-0 flex-col gap-1.5">
              <Label htmlFor="cas-day" className="text-xs text-muted-foreground">
                Dzień
              </Label>
              <div className="relative min-w-0">
                <CalendarDaysIcon
                  className="pointer-events-none absolute top-1/2 left-3 hidden size-4 -translate-y-1/2 text-muted-foreground sm:block"
                  aria-hidden
                />
                <Input
                  id="cas-day"
                  type="date"
                  value={dateKey}
                  onChange={(e) => setDateKey(e.target.value)}
                  className="min-w-0 pl-3 tabular-nums sm:pl-9"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">{headerDate}</p>
            </div>
          </div>

          <Input
            type="search"
            placeholder="Szukaj po akcji, sklepie, brandmasterze, ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
            autoComplete="off"
          />
        </section>

        <div className="mt-8">
          {isLoading ? (
            <LoadingSkeleton />
          ) : error ? (
            <p className="rounded-xl border border-dashed border-destructive/40 bg-destructive/5 px-4 py-8 text-center text-sm text-destructive">
              {error}
            </p>
          ) : displayActions.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
              {search.trim()
                ? "Brak akcji pasujących do wyszukiwania."
                : "Brak akcji z przypisanym brandmasterem w tym dniu."}
            </p>
          ) : (
            <ul className="space-y-2.5">
              {displayActions.map((action) => (
                <li key={getCasActionRowKey(action)}>
                  <CasActionCard action={action} onClick={() => openAction(action)} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <CasActionDetailSheet
        open={detailOpen}
        onOpenChange={handleDetailOpenChange}
        action={selectedAction}
        onStatusChange={handleStatusChange}
      />

      <CasDayStatsSheet
        open={statsOpen}
        onOpenChange={setStatsOpen}
        dateLabel={headerDate}
        actions={actionsWithBm}
      />
    </main>
  )
}