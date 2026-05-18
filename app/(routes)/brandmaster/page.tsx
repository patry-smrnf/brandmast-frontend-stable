"use client"

import * as React from "react"
import {
  AlertTriangleIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
  ClockIcon,
  MapPinIcon,
  RefreshCwIcon,
} from "lucide-react"

import { fetchSampleStats } from "@/lib/api"
import type { SampleStatsFieldCounts } from "@/lib/api"

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

import { BrandmasterPageSkeleton } from "./brandmaster-page-skeleton"
import {
  EfficiencyCard,
  GloSamplesCard,
  PayoutCard,
} from "./brandmaster-summary-sections"
import { formatHoursPl, type ActionWithRoundedTime } from "./cas-action-utils"
import { useBrandmasterDashboard } from "./use-brandmaster-dashboard"

function getActionSampleMetrics(stats: SampleStatsFieldCounts) {
  return [
    { label: "Hilo", value: stats.glo.hilo },
    { label: "Hilo+", value: stats.glo.hiloPlus },
    { label: "Velo", value: stats.veloNet },
  ] as const
}

function getActionRowKey(item: ActionWithRoundedTime): string {
  return (
    item.actionIdent ??
    item.action.uuid ??
    `${item.startLabel}-${item.stopLabel}-${item.shopName}`
  )
}

function ActionSampleStatsSkeleton() {
  return (
    <div className="flex h-7 animate-pulse overflow-hidden rounded-md border border-border/50 bg-muted/40">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className={cn("min-w-0 flex-1 bg-muted/70", i > 0 && "border-l border-border/40")}
        />
      ))}
    </div>
  )
}

function ActionSampleStatsPanel({ stats }: { stats: SampleStatsFieldCounts }) {
  const metrics = getActionSampleMetrics(stats)

  return (
    <div
      className="flex items-stretch divide-x divide-primary/15 overflow-hidden rounded-md border border-primary/20 bg-primary/5"
      role="group"
      aria-label="Wyniki akcji"
    >
      {metrics.map(({ label, value }) => (
        <div
          key={label}
          className="flex min-w-0 flex-1 items-baseline justify-center gap-1 px-1.5 py-1.5 sm:gap-1.5 sm:px-2"
        >
          <span className="truncate text-[10px] font-medium text-muted-foreground">{label}</span>
          <span className="shrink-0 text-sm font-semibold tabular-nums leading-none">{value}</span>
        </div>
      ))}
    </div>
  )
}

function WorkTimeActionRow({
  item,
  expanded,
  statsLoading,
  stats,
  statsError,
  onToggle,
}: {
  item: ActionWithRoundedTime
  expanded: boolean
  statsLoading: boolean
  stats: SampleStatsFieldCounts | null
  statsError: string | null
  onToggle: () => void
}) {
  const showPanel = expanded

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border bg-muted/30 transition-colors",
        expanded ? "border-primary/40 ring-1 ring-primary/15" : "border-border/80",
      )}
    >
      <button
        type="button"
        className="w-full px-3 py-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        onClick={onToggle}
        aria-expanded={expanded}
      >
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
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out",
          showPanel ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="border-t border-border/60 px-3 py-1.5">
            {statsLoading ? (
              <ActionSampleStatsSkeleton />
            ) : statsError ? (
              <p className="text-[11px] leading-snug text-destructive">{statsError}</p>
            ) : stats ? (
              <ActionSampleStatsPanel stats={stats} />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BrandmasterPage() {
  const [workTimeExpanded, setWorkTimeExpanded] = React.useState(false)
  const [payoutExpanded, setPayoutExpanded] = React.useState(false)
  const [selectedActionKey, setSelectedActionKey] = React.useState<string | null>(null)
  const [actionStatsLoading, setActionStatsLoading] = React.useState(false)
  const [actionStats, setActionStats] = React.useState<SampleStatsFieldCounts | null>(null)
  const [actionStatsError, setActionStatsError] = React.useState<string | null>(null)
  const actionStatsRequestRef = React.useRef(0)
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
    basePayout,
    predictedPayout,
    bonusBreakdown,
    hourlyRate,
    sampleStatsCounts,
    hostessCode,
  } = useBrandmasterDashboard()

  const handleActionToggle = React.useCallback(
    (item: ActionWithRoundedTime) => {
      const key = getActionRowKey(item)

      if (selectedActionKey === key) {
        actionStatsRequestRef.current += 1
        setSelectedActionKey(null)
        setActionStats(null)
        setActionStatsError(null)
        setActionStatsLoading(false)
        return
      }

      setSelectedActionKey(key)
      setActionStats(null)
      setActionStatsError(null)

      const ident = item.actionIdent?.trim()
      if (!ident) {
        setActionStatsError("Brak identyfikatora akcji.")
        return
      }

      if (!hostessCode) {
        setActionStatsError("Brak loginu hostessy w konfiguracji.")
        return
      }

      const requestId = ++actionStatsRequestRef.current
      setActionStatsLoading(true)

      void (async () => {
        try {
          const result = await fetchSampleStats({
            hostessCode,
            currentAction: ident,
          })
          if (actionStatsRequestRef.current !== requestId) return
          setActionStats(result.counts.currentAction)
        } catch (e) {
          if (actionStatsRequestRef.current !== requestId) return
          setActionStatsError(
            e instanceof Error ? e.message : "Nie udało się pobrać wyników akcji.",
          )
        } finally {
          if (actionStatsRequestRef.current === requestId) {
            setActionStatsLoading(false)
          }
        }
      })()
    },
    [hostessCode, selectedActionKey],
  )

  const currentMonth = sampleStatsCounts?.currentMonth

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
        {isLoading ? (
          <BrandmasterPageSkeleton />
        ) : (
          <>
            <header className="min-w-0 pr-11">
          <p className="text-xs text-muted-foreground">Panel home</p>
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
        </header>

        <Separator className="my-4" />

        <div className="mb-3 flex">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 px-3"
            onClick={() => refetch()}
            disabled={isRefreshing}
          >
            <RefreshCwIcon className={cn("size-3.5", isRefreshing && "animate-spin")} />
            Odśwież dane
          </Button>
        </div>

        {error ? (
          <div className="mb-3 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
            <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>{error}</span>
          </div>
        ) : null}

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

            <PayoutCard
              basePayout={basePayout}
              bonusBreakdown={bonusBreakdown}
              predictedPayout={predictedPayout}
              hourlyRate={hourlyRate}
              totalRoundedHours={totalRoundedHours}
              monthLabel={monthLabel}
              expanded={payoutExpanded}
              onToggle={() => setPayoutExpanded((v) => !v)}
            />

            {bonusBreakdown ? (
              <EfficiencyCard bonus={bonusBreakdown} monthLabel={monthLabel} />
            ) : null}

            {currentMonth ? (
              <GloSamplesCard
                glo={currentMonth.glo}
                veloNet={currentMonth.veloNet}
                monthLabel={monthLabel}
              />
            ) : null}

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
                        {totalRoundedHours / 4}{" "}
                        {totalRoundedHours / 4 === 1
                          ? "akcja"
                          : totalRoundedHours / 4 > 1 && totalRoundedHours / 4< 5
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
                    monthActions.map((item) => {
                      const rowKey = getActionRowKey(item)
                      const isSelected = selectedActionKey === rowKey
                      return (
                        <WorkTimeActionRow
                          key={rowKey}
                          item={item}
                          expanded={isSelected}
                          statsLoading={isSelected && actionStatsLoading}
                          stats={isSelected ? actionStats : null}
                          statsError={isSelected ? actionStatsError : null}
                          onToggle={() => handleActionToggle(item)}
                        />
                      )
                    })
                  )}
                </CardContent>
              ) : (
                <CardContent className="px-3.5 pb-3 pt-0 sm:px-4">
                  <p className="text-xs text-muted-foreground">
                    Kliknij, aby zobaczyć listę akcji. Wybierz akcję, aby zobaczyć wyniki Hilo,
                    Hilo+ i Velo.
                  </p>
                </CardContent>
              )}
            </Card>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
