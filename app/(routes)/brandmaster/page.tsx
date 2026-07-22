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

import { fetchSampleStats, getApiErrorMessage } from "@/lib/api"
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

import { BrandmasterScheduledNotice } from "./BrandmasterScheduledNotice"
import { BrandmasterPageSkeleton } from "./brandmaster-page-skeleton"
import {
  EfficiencyCard,
  GloSamplesCard,
  PayoutCard,
  StanyCard,
} from "./brandmaster-summary-sections"
import { formatHoursPl, getActionRowKey, type ActionWithRoundedTime } from "./cas-action-utils"
import {
  type BrandmasterMonthPeriod,
  useBrandmasterDashboard,
} from "./use-brandmaster-dashboard"
import { useEmptyWorkHours } from "./use-empty-work-hours"

function BrandmasterMonthSwitcher({
  period,
  onChange,
}: {
  period: BrandmasterMonthPeriod
  onChange: (period: BrandmasterMonthPeriod) => void
}) {
  return (
    <div
      className="grid grid-cols-2 gap-1 rounded-xl border border-border/80 bg-muted/40 p-1"
      role="tablist"
      aria-label="Okres rozliczeniowy"
    >
      <button
        type="button"
        role="tab"
        aria-selected={period === "current"}
        className={cn(
          "inline-flex min-h-9 items-center justify-center rounded-lg px-2 py-1.5 text-xs font-medium transition-colors sm:text-sm",
          period === "current"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
        onClick={() => onChange("current")}
      >
        Aktualny
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={period === "previous"}
        className={cn(
          "inline-flex min-h-9 items-center justify-center rounded-lg px-2 py-1.5 text-xs font-medium transition-colors sm:text-sm",
          period === "previous"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
        onClick={() => onChange("previous")}
      >
        Poprzedni
      </button>
    </div>
  )
}

function getActionSampleMetrics(stats: SampleStatsFieldCounts) {
  return [
    { label: "Hilo", value: stats.glo.hilo },
    { label: "Hilo+", value: stats.glo.hiloPlus },
    { label: "Hyper Pro", value: stats.glo.hyperPro },
    { label: "Velo", value: stats.veloNet },
  ] as const
}

function ActionSampleStatsSkeleton() {
  return (
    <div className="flex h-7 animate-pulse overflow-hidden rounded-md border border-border/50 bg-muted/40">
      {Array.from({ length: 4 }).map((_, i) => (
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
  isEmpty,
  statsLoading,
  stats,
  statsError,
  onToggle,
}: {
  item: ActionWithRoundedTime
  expanded: boolean
  isEmpty: boolean
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
        isEmpty
          ? "border-destructive/50 bg-destructive/8 ring-1 ring-destructive/20"
          : expanded
            ? "border-primary/40 ring-1 ring-primary/15"
            : "border-border/80",
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
              (item.shopName !== "-" ? item.shopName : null) ??
              item.actionIdent
            const showShopSubtitle =
              item.shopName !== "-" &&
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
          {formatHoursPl(item.durationHours)}
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
  const [monthPeriod, setMonthPeriod] = React.useState<BrandmasterMonthPeriod>("current")
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
    currentActionStats,
    monthActions,
    totalDurationHours,
    totalBaseHours,
    totalRemainderMinutes,
    basePayout,
    hourlyTourPayout,
    bonusBreakdown,
    hourlyRate,
    monthSalesStats,
    awaryjneSummary,
    hasOneTwoOne,
    mojstanItems,
    oneTwoOneLoading,
    hostessCode,
  } = useBrandmasterDashboard(monthPeriod)

  const {
    calculated: emptyHoursCalculated,
    loading: emptyHoursLoading,
    error: emptyHoursError,
    emptyActionKeys,
    statsByActionKey,
    emptyHours,
    calculate: calculateEmptyHours,
    reset: resetEmptyWorkHours,
  } = useEmptyWorkHours(monthActions, hostessCode)

  React.useEffect(() => {
    actionStatsRequestRef.current += 1
    setSelectedActionKey(null)
    setActionStats(null)
    setActionStatsError(null)
    setActionStatsLoading(false)
    resetEmptyWorkHours()
  }, [monthPeriod, resetEmptyWorkHours])

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
      setActionStatsError(null)

      const cachedStats = statsByActionKey.get(key)
      if (cachedStats) {
        actionStatsRequestRef.current += 1
        setActionStats(cachedStats)
        setActionStatsLoading(false)
        return
      }

      setActionStats(null)

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
            getApiErrorMessage(e, "Nie udało się pobrać wyników akcji."),
          )
        } finally {
          if (actionStatsRequestRef.current === requestId) {
            setActionStatsLoading(false)
          }
        }
      })()
    },
    [hostessCode, selectedActionKey, statsByActionKey],
  )

  const monthLabel = React.useMemo(() => {
    const now = nowInPoland()
    const labelDate =
      monthPeriod === "previous"
        ? new Date(now.getFullYear(), now.getMonth() - 1, 1)
        : now
    return new Intl.DateTimeFormat("pl-PL", {
      timeZone: POLAND_TIMEZONE,
      month: "long",
      year: "numeric",
    }).format(labelDate)
  }, [monthPeriod])

  return (
    <main className="flex-1 bg-background">
      <div className="mx-auto w-full max-w-lg px-3 py-4 sm:max-w-xl sm:px-4 sm:py-5">
        <BrandmasterScheduledNotice />
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

        <div className="mb-3">
          <BrandmasterMonthSwitcher period={monthPeriod} onChange={setMonthPeriod} />
        </div>

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
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <p className="flex min-w-0 items-center gap-2 text-sm">
                      <ClockIcon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                      <span className="tabular-nums">
                        Start:{" "}
                        <span className="font-medium text-foreground">
                          {currentActionStartLabel}
                        </span>
                      </span>
                    </p>
                    <div className="flex min-w-0 items-stretch gap-2 sm:max-w-[min(100%,20rem)] sm:shrink-0">
                      {currentActionStats ? (
                        <div className="min-w-0 flex-1">
                          <ActionSampleStatsPanel stats={currentActionStats} />
                        </div>
                      ) : null}
                      {currentActionRoundedHoursLabel ? (
                        <p className="flex shrink-0 items-center self-center text-sm font-semibold tabular-nums">
                          {currentActionRoundedHoursLabel}
                        </p>
                      ) : null}
                    </div>
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
              hourlyTourPayout={hourlyTourPayout}
              totalRemainderMinutes={totalRemainderMinutes}
              bonusBreakdown={bonusBreakdown}
              hourlyRate={hourlyRate}
              totalDurationHours={totalDurationHours}
              totalBaseHours={totalBaseHours}
              monthLabel={monthLabel}
              includeExtras={monthPeriod === "current"}
              expanded={payoutExpanded}
              onToggle={() => setPayoutExpanded((v) => !v)}
            />

            {bonusBreakdown ? (
              <EfficiencyCard bonus={bonusBreakdown} monthLabel={monthLabel} />
            ) : null}

            {monthSalesStats ? (
              <GloSamplesCard
                glo={monthSalesStats.glo}
                veloNet={monthSalesStats.veloNet}
                monthLabel={monthLabel}
                awaryjne={awaryjneSummary}
                hasOneTwoOne={hasOneTwoOne}
                oneTwoOneLoading={oneTwoOneLoading}
              />
            ) : null}

            <StanyCard
              hasOneTwoOne={hasOneTwoOne}
              items={mojstanItems}
              loading={oneTwoOneLoading}
            />

            <Card className="overflow-hidden shadow-sm">
              <CardHeader className="space-y-2 px-3.5 py-3 pb-2 sm:px-4">
                <button
                  type="button"
                  className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  onClick={() => setWorkTimeExpanded((v) => !v)}
                  aria-expanded={workTimeExpanded}
                >
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
                      {emptyHoursCalculated ? (
                        <p className="mt-1.5 text-xs text-destructive">
                          Puste godziny:{" "}
                          <span className="font-semibold tabular-nums">
                            {formatHoursPl(emptyHours)}
                          </span>
                          {emptyActionKeys.size > 0 ? (
                            <span className="text-destructive/80">
                              {" "}
                              · {emptyActionKeys.size}{" "}
                              {emptyActionKeys.size === 1
                                ? "akcja pusta"
                                : emptyActionKeys.size > 1 && emptyActionKeys.size < 5
                                  ? "akcje puste"
                                  : "akcji pustych"}
                            </span>
                          ) : null}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-2 pt-0.5">
                      <span className="text-lg font-semibold tabular-nums leading-none">
                        {formatHoursPl(totalDurationHours)}
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
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs"
                    onClick={() => calculateEmptyHours()}
                    disabled={
                      emptyHoursCalculated ||
                      emptyHoursLoading ||
                      monthActions.length === 0 ||
                      !hostessCode
                    }
                  >
                    {emptyHoursLoading ? (
                      <>
                        <RefreshCwIcon className="mr-1.5 size-3 animate-spin" aria-hidden />
                        Liczenie…
                      </>
                    ) : (
                      "Policz puste godziny"
                    )}
                  </Button>
                  {emptyHoursError ? (
                    <p className="text-[11px] leading-snug text-destructive">{emptyHoursError}</p>
                  ) : null}
                </div>
              </CardHeader>

              {workTimeExpanded ? (
                <CardContent className="space-y-2 border-t border-border/80 px-3.5 pb-3.5 pt-2 sm:px-4 sm:pb-4">
                  {monthActions.length === 0 ? (
                    <p className="py-2 text-center text-xs text-muted-foreground">
                      {monthPeriod === "previous"
                        ? "Brak zakończonych akcji w poprzednim miesiącu."
                        : "Brak zakończonych akcji w tym miesiącu."}
                    </p>
                  ) : (
                    monthActions.map((item) => {
                      const rowKey = getActionRowKey(item)
                      const isSelected = selectedActionKey === rowKey
                      const isEmpty =
                        emptyHoursCalculated && emptyActionKeys.has(rowKey)
                      return (
                        <WorkTimeActionRow
                          key={rowKey}
                          item={item}
                          expanded={isSelected}
                          isEmpty={isEmpty}
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
                    Hilo+, Hyper Pro i Velo.
                    {emptyHoursCalculated && emptyActionKeys.size > 0
                      ? " Puste akcje są podświetlone na czerwono."
                      : null}
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
