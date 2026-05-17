"use client"

import * as React from "react"
import {
  AlertTriangleIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
  ClockIcon,
  MapPinIcon,
  RefreshCwIcon,
  WalletIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  formatHeaderDatePoland,
  nowInPoland,
  POLAND_TIMEZONE,
} from "@/lib/dates/date-utils"

import {
  formatHoursPl,
  formatMoneyPl,
  type ActionWithRoundedTime,
} from "./cas-action-utils"
import { useBrandmasterDashboard } from "./use-brandmaster-dashboard"

function DashboardSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="h-[88px] animate-pulse rounded-xl border border-border/80 bg-card"
        />
      ))}
    </div>
  )
}

function WorkTimeActionRow({ item }: { item: ActionWithRoundedTime }) {
  return (
    <div className="rounded-lg border border-border/80 bg-muted/30 px-3 py-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          {(() => {
            const primaryTitle =
              item.actionName ??
              (item.shopName !== "—" ? item.shopName : null) ??
              item.actionIdent
            const showShopSubtitle =
              item.shopName !== "—" &&
              item.actionName != null &&
              item.shopName !== item.actionName
            return (
              <>
                {primaryTitle ? (
                  <p className="truncate text-sm font-medium leading-tight">{primaryTitle}</p>
                ) : null}
                {(item.actionIdent && item.actionIdent !== primaryTitle) ||
                showShopSubtitle ? (
                  <p className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
                    {item.actionIdent && item.actionIdent !== primaryTitle ? (
                      <span className="shrink-0 rounded-md border border-border/60 bg-background/80 px-1.5 py-0.5 font-mono text-[11px] leading-none tabular-nums text-foreground/85">
                        {item.actionIdent}
                      </span>
                    ) : null}
                    {item.actionIdent &&
                    item.actionIdent !== primaryTitle &&
                    showShopSubtitle ? (
                      <span className="text-muted-foreground/45" aria-hidden>
                        ·
                      </span>
                    ) : null}
                    {showShopSubtitle ? (
                      <span className="min-w-0 truncate">{item.shopName}</span>
                    ) : null}
                  </p>
                ) : null}
              </>
            )
          })()}
          <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 tabular-nums">
              <CalendarDaysIcon className="size-3 shrink-0" aria-hidden />
              {item.dateLabel}
            </span>
            <span className="text-muted-foreground/45" aria-hidden>
              ·
            </span>
            <span className="inline-flex items-center gap-1 tabular-nums">
              <ClockIcon className="size-3 shrink-0" aria-hidden />
              {item.startLabel} – {item.stopLabel}
            </span>
          </p>
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <MapPinIcon className="mt-0.5 size-3 shrink-0" aria-hidden />
            <span className="line-clamp-2">{item.addressLabel}</span>
          </p>
        </div>
        <p className="shrink-0 pt-0.5 text-sm font-semibold tabular-nums">
          {formatHoursPl(item.roundedHours)}
        </p>
      </div>
    </div>
  )
}

export default function BrandmasterPage() {
  const [workTimeExpanded, setWorkTimeExpanded] = React.useState(false)
  const headerDate = React.useMemo(() => formatHeaderDatePoland(nowInPoland()), [])

  const {
    isLoading,
    isRefreshing,
    error,
    refetch,
    currentAction,
    currentActionTitle,
    currentActionStartLabel,
    currentActionRoundedHoursLabel,
    currentActionPointLabel,
    monthActions,
    totalRoundedHours,
    predictedPayout,
    hourlyRate,
  } = useBrandmasterDashboard()

  const monthLabel = React.useMemo(() => {
    return new Intl.DateTimeFormat("pl-PL", {
      timeZone: POLAND_TIMEZONE,
      month: "long",
      year: "numeric",
    }).format(nowInPoland())
  }, [])

  return (
    <main className="flex-1 bg-background">
      <div className="mx-auto w-full max-w-lg px-3 py-4 sm:max-w-xl sm:px-4 sm:py-5">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Panel Brandmastera</p>
            <h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl">
              Podsumowanie
            </h1>
            <div className="mt-1.5 flex items-baseline gap-2.5">
              <span
                className="text-3xl font-semibold tabular-nums leading-none sm:text-4xl"
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
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 shrink-0 px-2.5"
            onClick={() => refetch()}
            disabled={isRefreshing}
          >
            <RefreshCwIcon className={cn("size-3.5", isRefreshing && "animate-spin")} />
            <span className="sr-only sm:not-sr-only sm:ml-1.5">Odśwież</span>
          </Button>
        </header>

        <Separator className="my-4" />

        {error ? (
          <div className="mb-3 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
            <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>{error}</span>
          </div>
        ) : null}

        {isLoading ? (
          <DashboardSkeleton />
        ) : (
          <div className="space-y-3">
            {currentAction ? (
              <Card className="border-primary/30 bg-primary/5 shadow-sm">
                <CardHeader className="space-y-1 px-3.5 py-3 pb-2 sm:px-4">
                  <CardDescription className="text-xs">Aktualna akcja</CardDescription>
                  <CardTitle className="text-base font-semibold leading-snug">
                    {currentActionTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 px-3.5 pb-3.5 sm:px-4 sm:pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="flex min-w-0 items-center gap-2 text-sm">
                      <ClockIcon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                      <span className="tabular-nums">
                        Start:{" "}
                        <span className="font-medium text-foreground">
                          {currentActionStartLabel}
                        </span>
                      </span>
                    </p>
                    {currentActionRoundedHoursLabel ? (
                      <p className="shrink-0 text-sm font-semibold tabular-nums">
                        {currentActionRoundedHoursLabel}
                      </p>
                    ) : null}
                  </div>
                  {currentActionPointLabel ? (
                    <p className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPinIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                      <span className="min-w-0 leading-snug">{currentActionPointLabel}</span>
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}

            <Card className="shadow-sm">
              <CardHeader className="space-y-0.5 px-3.5 py-3 pb-2 sm:px-4">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <WalletIcon className="size-3.5 text-muted-foreground" aria-hidden />
                  Przewidywalna wypłata
                </CardTitle>
                <CardDescription className="text-xs" suppressHydrationWarning>
                  {hourlyRate} zł × {formatHoursPl(totalRoundedHours)} · {monthLabel}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3.5 pb-3.5 sm:px-4 sm:pb-4">
                <p className="text-2xl font-semibold tabular-nums leading-none sm:text-3xl">
                  {formatMoneyPl(predictedPayout)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Szacunek na podstawie zaokrąglonego czasu pracy w miesiącu
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden shadow-sm">
              <button
                type="button"
                className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                onClick={() => setWorkTimeExpanded((v) => !v)}
                aria-expanded={workTimeExpanded}
              >
                <CardHeader className="space-y-0.5 px-3.5 py-3 pb-2 sm:px-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                        <ClockIcon className="size-3.5 text-muted-foreground" aria-hidden />
                        Czas pracy
                      </CardTitle>
                      <CardDescription className="text-xs" suppressHydrationWarning>
                        {monthActions.length}{" "}
                        {monthActions.length === 1
                          ? "akcja"
                          : monthActions.length > 1 && monthActions.length < 5
                            ? "akcje"
                            : "akcji"}{" "}
                        · {monthLabel}
                      </CardDescription>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 pt-0.5">
                      <span className="text-lg font-semibold tabular-nums leading-none">
                        {formatHoursPl(totalRoundedHours)}
                      </span>
                      <ChevronDownIcon
                        className={cn(
                          "size-4 text-muted-foreground transition-transform",
                          workTimeExpanded && "rotate-180",
                        )}
                        aria-hidden
                      />
                    </div>
                  </div>
                </CardHeader>
              </button>

              {workTimeExpanded ? (
                <CardContent className="space-y-2 border-t border-border/80 px-3.5 pb-3.5 pt-2 sm:px-4 sm:pb-4">
                  {monthActions.length === 0 ? (
                    <p className="py-2 text-center text-xs text-muted-foreground">
                      Brak zakończonych akcji w tym miesiącu.
                    </p>
                  ) : (
                    monthActions.map((item) => (
                      <WorkTimeActionRow
                        key={
                          item.action.uuid ??
                          `${item.startLabel}-${item.stopLabel}-${item.shopName}`
                        }
                        item={item}
                      />
                    ))
                  )}
                </CardContent>
              ) : (
                <CardContent className="px-3.5 pb-3 pt-0 sm:px-4">
                  <p className="text-xs text-muted-foreground">
                    Kliknij, aby zobaczyć listę akcji z zaokrąglonym czasem.
                  </p>
                </CardContent>
              )}
            </Card>
          </div>
        )}
      </div>
    </main>
  )
}
