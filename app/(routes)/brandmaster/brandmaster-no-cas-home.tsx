"use client"

import * as React from "react"
import {
  AlertTriangleIcon,
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  RefreshCwIcon,
  StoreIcon,
  UnplugIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getActionStatusPresentation } from "@/lib/action-status"
import {
  formatHeaderDatePoland,
  formatPlDateTimeFromIso,
  formatTimePoland,
  nowInPoland,
  parseIso,
  toDateKeyInPoland,
} from "@/lib/dates/date-utils"
import { cn } from "@/lib/utils"

import { useBmActions } from "./actions/use-bm-actions"
import type { BrandmasterAction } from "./actions/types"
import { BrandmasterPageSkeleton } from "./brandmaster-page-skeleton"
import {
  computeNoCasMonthStats,
  filterTodaysActions,
  formatBmHoursPl,
} from "./brandmaster-no-cas-home-utils"
import {
  bmCardClass,
  bmCardPadContent,
  bmCardPadHeader,
  bmIconBubble,
  bmMetricTileClass,
} from "./brandmaster-ui"

function TourplannerDisabledBanner() {
  return (
    <div
      role="status"
      className="mb-4 flex items-start gap-2.5 rounded-2xl border border-amber-500/45 bg-amber-500/10 px-3.5 py-3 text-sm text-foreground shadow-sm"
    >
      <UnplugIcon
        className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-400"
        aria-hidden
      />
      <span className="min-w-0 flex-1 font-medium leading-snug">
        Wyłączony tourplanner dla zespołu
      </span>
    </div>
  )
}

function TodayActionRow({ action }: { action: BrandmasterAction }) {
  const since = parseIso(action.since)
  const until = parseIso(action.until)
  const timeLabel =
    since && until
      ? `${formatTimePoland(since)}–${formatTimePoland(until)}`
      : "—"
  const statusPres = getActionStatusPresentation(action.status)

  return (
    <div className="rounded-2xl bg-muted/25 px-3 py-2.5 ring-1 ring-border/50">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-snug">
            {action.event.name || "Akcja"}
          </p>
          <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
            <StoreIcon className="size-3 shrink-0" aria-hidden />
            <span className="truncate">{action.shop.name || "—"}</span>
          </p>
        </div>
        <Badge variant={statusPres.badgeVariant} className="shrink-0">
          {statusPres.labelPl}
        </Badge>
      </div>

      <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
        <MapPinIcon className="mt-0.5 size-3 shrink-0" aria-hidden />
        <span className="min-w-0 leading-snug">{action.shop.address || "—"}</span>
      </p>

      <p className="mt-1.5 flex items-center gap-1.5 text-xs tabular-nums text-foreground">
        <ClockIcon className="size-3 shrink-0 text-muted-foreground" aria-hidden />
        {timeLabel}
      </p>

      <div className="mt-2 space-y-0.5 border-t border-border/50 pt-2 text-[11px] text-muted-foreground">
        <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
          <CalendarDaysIcon className="size-3 shrink-0" aria-hidden />
          <span>Utworzono:</span>
          <span className="tabular-nums text-foreground/90">
            {formatPlDateTimeFromIso(action.createdAt)}
          </span>
        </p>
        <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
          <span>Edytowano:</span>
          <span className="tabular-nums text-foreground/90">
            {formatPlDateTimeFromIso(action.updatedAt)}
          </span>
        </p>
      </div>
    </div>
  )
}

export function BrandmasterNoCasHome() {
  const todayKey = React.useMemo(() => toDateKeyInPoland(nowInPoland()), [])
  const monthKey = todayKey.slice(0, 7)
  const headerDate = React.useMemo(() => formatHeaderDatePoland(nowInPoland()), [])
  const monthLabel = React.useMemo(() => {
    const now = nowInPoland()
    return new Intl.DateTimeFormat("pl-PL", {
      timeZone: "Europe/Warsaw",
      month: "long",
      year: "numeric",
    }).format(now)
  }, [])

  const { data, isLoading, error, refetch } = useBmActions(monthKey)

  const todaysActions = React.useMemo(
    () => filterTodaysActions(data.actions, todayKey),
    [data.actions, todayKey],
  )

  const stats = React.useMemo(
    () => computeNoCasMonthStats(data.actions, todayKey),
    [data.actions, todayKey],
  )

  const isInitialLoading = isLoading && data.actions.length === 0 && !error
  const isRefreshing = isLoading && !isInitialLoading

  return (
    <main className="flex-1 bg-background">
      <div className="mx-auto w-full max-w-lg px-3 py-5 sm:max-w-xl sm:px-4 sm:py-6">
        <TourplannerDisabledBanner />

        {isInitialLoading ? (
          <BrandmasterPageSkeleton />
        ) : (
          <>
            <header className="min-w-0 pr-11">
              <p className="text-xs font-medium text-muted-foreground">Panel home</p>
              <h1 className="mt-0.5 truncate text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Podsumowanie
              </h1>
              <div className="mt-2 flex items-baseline gap-2.5">
                <span
                  className="text-3xl font-semibold tabular-nums leading-none text-foreground sm:text-4xl"
                  suppressHydrationWarning
                >
                  {headerDate.day}
                </span>
                <span
                  className="min-w-0 truncate text-sm font-medium capitalize text-muted-foreground"
                  suppressHydrationWarning
                >
                  {headerDate.rest}
                </span>
              </div>
            </header>

            <div className="mb-4 mt-5 flex">
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 rounded-xl border-primary/40 px-3.5 text-primary hover:bg-primary/5 hover:text-primary"
                onClick={() => refetch()}
                disabled={isRefreshing}
              >
                <RefreshCwIcon className={cn("size-3.5", isRefreshing && "animate-spin")} />
                Odśwież dane
              </Button>
            </div>

            {error ? (
              <div className="mb-3 flex items-start gap-2 rounded-2xl bg-destructive/8 px-3 py-2.5 text-sm text-destructive ring-1 ring-destructive/30">
                <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>{error}</span>
              </div>
            ) : null}

            <div className="space-y-3.5">
              <Card
                className={cn(bmCardClass, "bg-linear-to-br from-primary/10 via-card to-card")}
              >
                <CardHeader className={cn(bmCardPadHeader, "space-y-1")}>
                  <CardDescription className="text-xs">
                    {todaysActions.length > 1 ? "Dzisiejsze akcje" : "Dzisiejsza akcja"}
                  </CardDescription>
                  <CardTitle className="text-base font-semibold leading-snug">
                    {todaysActions.length === 0
                      ? "Brak akcji na dziś"
                      : todaysActions.length === 1
                        ? todaysActions[0]!.event.name || "Akcja"
                        : `${todaysActions.length} akcje dziś`}
                  </CardTitle>
                </CardHeader>
                <CardContent className={cn("space-y-2.5", bmCardPadContent)}>
                  {todaysActions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Nie masz zaplanowanych akcji na dzisiejszy dzień.
                    </p>
                  ) : (
                    todaysActions.map((action) => (
                      <TodayActionRow key={action.idAction} action={action} />
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className={bmCardClass}>
                <CardHeader className={cn(bmCardPadHeader, "space-y-1")}>
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <span className={bmIconBubble("primary")}>
                      <ClockIcon className="size-3.5" aria-hidden />
                    </span>
                    Statystyki miesiąca
                  </CardTitle>
                  <CardDescription className="text-xs capitalize" suppressHydrationWarning>
                    {monthLabel}
                  </CardDescription>
                </CardHeader>
                <CardContent className={bmCardPadContent}>
                  <div className="grid grid-cols-3 gap-2">
                    <div className={cn(bmMetricTileClass, "px-2.5 py-3 text-center")}>
                      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        Akcje
                      </p>
                      <p className="mt-1 text-lg font-semibold tabular-nums leading-none">
                        {stats.actionCount}
                      </p>
                    </div>
                    <div className={cn(bmMetricTileClass, "px-2.5 py-3 text-center")}>
                      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        Łącznie
                      </p>
                      <p className="mt-1 text-lg font-semibold tabular-nums leading-none">
                        {formatBmHoursPl(stats.totalHours)}
                      </p>
                    </div>
                    <div className={cn(bmMetricTileClass, "px-2.5 py-3 text-center")}>
                      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        Od dziś
                      </p>
                      <p className="mt-1 text-lg font-semibold tabular-nums leading-none">
                        {formatBmHoursPl(stats.fromTodayHours)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
