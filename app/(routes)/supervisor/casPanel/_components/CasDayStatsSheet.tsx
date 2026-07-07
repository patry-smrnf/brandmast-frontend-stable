"use client"

import * as React from "react"
import { BarChart3Icon, ClockIcon, RefreshCwIcon, UsersIcon } from "lucide-react"

import { fetchSampleStats } from "@/lib/api"
import type { TourPlannerActionListItem } from "@/lib/api/generated/types"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { formatHoursPl } from "@/app/(routes)/brandmaster/cas-action-utils"

import {
  aggregateCasDayStats,
  buildCasBrandmasterDayStats,
  listCasActionsForDayStats,
  type CasBrandmasterDayStats,
  type CasDayStatsRow,
  type CasDayStatsSummary,
} from "../cas-panel-utils"
import {
  computeSampleStatsEfficiency,
  formatEfficiency,
  getCasActionDurationHours,
} from "../cas-efficiency"
import { MobileBottomSheet } from "./MobileBottomSheet"
import {
  CasEfficiencyStrip,
  CasSampleStatsSkeleton,
  CasSampleStatsStrip,
} from "./CasSampleStatsStrip"

export type CasDayStatsSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  dateLabel: string
  actions: TourPlannerActionListItem[]
}

type DayStatsTab = "summary" | "perBrandmaster"

export function CasDayStatsSheet({
  open,
  onOpenChange,
  dateLabel,
  actions,
}: CasDayStatsSheetProps) {
  const [loading, setLoading] = React.useState(false)
  const [progress, setProgress] = React.useState({ done: 0, total: 0 })
  const [rows, setRows] = React.useState<CasDayStatsRow[] | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [tab, setTab] = React.useState<DayStatsTab>("summary")
  const requestRef = React.useRef(0)

  const targets = React.useMemo(() => listCasActionsForDayStats(actions), [actions])

  React.useEffect(() => {
    if (!open) {
      setLoading(false)
      setProgress({ done: 0, total: 0 })
      setRows(null)
      setError(null)
      setTab("summary")
      return
    }

    const requestId = ++requestRef.current
    const total = targets.length
    // Snapshot czasu przy otwarciu — spójny czas trwania dla akcji "started".
    const now = new Date()

    if (total === 0) {
      setRows([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    setRows(null)
    setProgress({ done: 0, total })

    void (async () => {
      const collected: CasDayStatsRow[] = []

      for (let i = 0; i < targets.length; i += 1) {
        if (requestRef.current !== requestId) return
        const target = targets[i]!
        setProgress({ done: i, total })

        const durationHours = getCasActionDurationHours(target.action, now) ?? 0

        try {
          const result = await fetchSampleStats({
            hostessCode: target.hostessCode,
            currentAction: target.actionIdent,
          })
          collected.push({
            action: target.action,
            status: target.status,
            hostessCode: target.hostessCode,
            durationHours,
            stats: result.counts.currentAction,
            failed: false,
          })
        } catch {
          collected.push({
            action: target.action,
            status: target.status,
            hostessCode: target.hostessCode,
            durationHours,
            stats: null,
            failed: true,
          })
        }
      }

      if (requestRef.current !== requestId) return
      setProgress({ done: total, total })
      setRows(collected)
      setLoading(false)
    })().catch(() => {
      if (requestRef.current !== requestId) return
      setError("Nie udało się zebrać statystyk dnia.")
      setLoading(false)
    })
  }, [open, targets])

  const summary = React.useMemo<CasDayStatsSummary | null>(
    () => (rows ? aggregateCasDayStats(rows) : null),
    [rows],
  )
  const brandmasterStats = React.useMemo<CasBrandmasterDayStats[]>(
    () => (rows ? buildCasBrandmasterDayStats(rows) : []),
    [rows],
  )

  const progressPct =
    progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0

  return (
    <MobileBottomSheet
      open={open}
      onOpenChange={onOpenChange}
      titleId="cas-day-stats-title"
      title="Statystyki dnia"
      description={`Podsumowanie sprzedaży · ${dateLabel}`}
      dismissible={!loading}
      footer={
        <div className="space-y-2">
          <Separator className="bg-border/70" />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            disabled={loading}
            onClick={() => onOpenChange(false)}
          >
            Zamknij
          </Button>
        </div>
      }
    >
      {loading ? (
        <div className="space-y-3 rounded-xl border border-border/70 bg-muted/20 p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCwIcon className="size-4 animate-spin" aria-hidden />
            Ładowanie statystyk…
            <span className="ml-auto tabular-nums text-foreground">
              {progress.done}/{progress.total}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <CasSampleStatsSkeleton />
        </div>
      ) : error ? (
        <p className="rounded-xl border border-dashed border-destructive/40 bg-destructive/5 px-4 py-6 text-center text-sm text-destructive">
          {error}
        </p>
      ) : summary ? (
        <div className="space-y-4">
          <TabSwitch value={tab} onChange={setTab} />

          {tab === "summary" ? (
            <SummaryTab summary={summary} />
          ) : (
            <PerBrandmasterTab rows={brandmasterStats} />
          )}
        </div>
      ) : null}
    </MobileBottomSheet>
  )
}

function TabSwitch({
  value,
  onChange,
}: {
  value: DayStatsTab
  onChange: (tab: DayStatsTab) => void
}) {
  const tabs: Array<{ id: DayStatsTab; label: string }> = [
    { id: "summary", label: "Podsumowanie" },
    { id: "perBrandmaster", label: "Poszczególna efektywność" },
  ]

  return (
    <div
      role="tablist"
      aria-label="Widok statystyk"
      className="grid grid-cols-2 gap-1 rounded-xl border border-border/70 bg-muted/30 p-1"
    >
      {tabs.map((t) => {
        const active = value === t.id
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={cn(
              "rounded-lg px-2 py-2 text-xs font-medium transition-colors sm:text-sm",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}

function SummaryTab({ summary }: { summary: CasDayStatsSummary }) {
  const efficiency = React.useMemo(
    () => computeSampleStatsEfficiency(summary.totals, summary.totalHours),
    [summary.totals, summary.totalHours],
  )

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <StatTile
          icon={<BarChart3Icon className="size-4" />}
          label="Akcje (started/finished)"
          value={String(summary.actionCount)}
        />
        <StatTile
          icon={<UsersIcon className="size-4" />}
          label="Osoby (started)"
          value={String(summary.startedPeopleCount)}
        />
      </div>

      {summary.actionCount === 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          Brak akcji started/finished z kompletnymi danymi do statystyk.
        </p>
      ) : (
        <>
          <StatTile
            icon={<ClockIcon className="size-4" />}
            label="Łączny czas przepracowany"
            value={formatHoursPl(summary.totalHours)}
          />

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Wyniki zespołu</p>
            <CasSampleStatsStrip stats={summary.totals} />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Efektywność zespołu</p>
            <CasEfficiencyStrip efficiency={efficiency} />
          </div>

          <p className="text-center text-[11px] text-muted-foreground">
            Zsumowane wyniki z {summary.loadedCount} akcji
            {summary.failedCount > 0 ? ` · ${summary.failedCount} bez odpowiedzi API` : null}
          </p>
        </>
      )}
    </div>
  )
}

function PerBrandmasterTab({ rows }: { rows: CasBrandmasterDayStats[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        Brak brandmasterów z akcjami started/finished.
      </p>
    )
  }

  return (
    <ul className="divide-y divide-border/50 overflow-hidden rounded-xl border border-border/60 bg-card">
      {rows.map((row) => (
        <BrandmasterEfficiencyRow key={row.hostessCode} row={row} />
      ))}
    </ul>
  )
}

function BrandmasterEfficiencyRow({ row }: { row: CasBrandmasterDayStats }) {
  const efficiency = computeSampleStatsEfficiency(row.totals, row.durationHours)

  return (
    <li
      className={cn(
        "flex items-center gap-2.5 px-3 py-2.5 transition-colors",
        row.hasStarted && "bg-sky-500/6",
      )}
    >
      <span className="relative flex size-2 shrink-0" aria-hidden>
        {row.hasStarted ? (
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-sky-500/60" />
        ) : null}
        <span
          className={cn(
            "relative inline-flex size-2 rounded-full",
            row.hasStarted ? "bg-sky-500" : "bg-muted-foreground/25",
          )}
        />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-tight">{row.name}</p>
        <p className="truncate text-[11px] tabular-nums text-muted-foreground">
          {formatHoursPl(row.durationHours)} · {row.actionCount}{" "}
          {row.actionCount === 1 ? "akcja" : "akcje"}
          {row.failedCount > 0 ? (
            <span className="text-amber-600"> · {row.failedCount} bez wyników</span>
          ) : null}
        </p>
      </div>

      <div className="flex shrink-0 items-center divide-x divide-border/50">
        <EfficiencyMetric label="GLO" value={formatEfficiency(efficiency.glo)} />
        <EfficiencyMetric label="VELO" value={formatEfficiency(efficiency.velo)} />
      </div>
    </li>
  )
}

function EfficiencyMetric({ label, value }: { label: string; value: string }) {
  const empty = value === "-"
  return (
    <div className="flex min-w-[3.25rem] flex-col items-end px-2.5 first:pl-0 last:pr-0">
      <span
        className={cn(
          "text-sm font-semibold tabular-nums leading-none tracking-tight",
          empty ? "text-muted-foreground/50" : "text-foreground",
        )}
      >
        {value}
      </span>
      <span className="mt-1 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </div>
  )
}

function StatTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border border-border/80 bg-card px-3 py-3 shadow-xs">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-2xl font-semibold tabular-nums leading-none">{value}</p>
    </div>
  )
}
