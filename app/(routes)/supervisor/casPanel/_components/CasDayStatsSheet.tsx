"use client"

import * as React from "react"
import { BarChart3Icon, RefreshCwIcon, UsersIcon } from "lucide-react"

import { fetchSampleStats } from "@/lib/api"
import type { SampleStatsFieldCounts } from "@/lib/api"
import type { TourPlannerActionListItem } from "@/lib/api/generated/types"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { normalizeCasActionStatus } from "@/lib/cas-status"

import {
  aggregateCasDayStats,
  listCasActionsForDayStats,
  type CasDayStatsSummary,
} from "../cas-panel-utils"
import { MobileBottomSheet } from "./MobileBottomSheet"
import { CasSampleStatsSkeleton, CasSampleStatsStrip } from "./CasSampleStatsStrip"

export type CasDayStatsSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  dateLabel: string
  actions: TourPlannerActionListItem[]
}

export function CasDayStatsSheet({
  open,
  onOpenChange,
  dateLabel,
  actions,
}: CasDayStatsSheetProps) {
  const [loading, setLoading] = React.useState(false)
  const [progress, setProgress] = React.useState({ done: 0, total: 0 })
  const [summary, setSummary] = React.useState<CasDayStatsSummary | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const requestRef = React.useRef(0)

  const targets = React.useMemo(() => listCasActionsForDayStats(actions), [actions])

  React.useEffect(() => {
    if (!open) {
      setLoading(false)
      setProgress({ done: 0, total: 0 })
      setSummary(null)
      setError(null)
      return
    }

    const requestId = ++requestRef.current
    const total = targets.length

    if (total === 0) {
      setSummary({
        actionCount: 0,
        startedPeopleCount: 0,
        totals: { glo: { hilo: 0, hyperPro: 0, hiloPlus: 0 }, veloNet: 0 },
        loadedCount: 0,
        failedCount: 0,
      })
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    setSummary(null)
    setProgress({ done: 0, total })

    void (async () => {
      const rows: Array<{
        status: ReturnType<typeof normalizeCasActionStatus>
        hostessCode: string
        stats: SampleStatsFieldCounts | null
        failed: boolean
      }> = []

      for (let i = 0; i < targets.length; i += 1) {
        if (requestRef.current !== requestId) return
        const target = targets[i]!
        setProgress({ done: i, total })

        try {
          const result = await fetchSampleStats({
            hostessCode: target.hostessCode,
            currentAction: target.actionIdent,
          })
          rows.push({
            status: target.status,
            hostessCode: target.hostessCode,
            stats: result.counts.currentAction,
            failed: false,
          })
        } catch {
          rows.push({
            status: target.status,
            hostessCode: target.hostessCode,
            stats: null,
            failed: true,
          })
        }
      }

      if (requestRef.current !== requestId) return
      setProgress({ done: total, total })
      setSummary(aggregateCasDayStats(rows))
      setLoading(false)
    })().catch(() => {
      if (requestRef.current !== requestId) return
      setError("Nie udało się zebrać statystyk dnia.")
      setLoading(false)
    })
  }, [open, targets])

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
              <CasSampleStatsStrip stats={summary.totals} />
              <p className="text-center text-[11px] text-muted-foreground">
                Zsumowane wyniki z {summary.loadedCount} akcji
                {summary.failedCount > 0
                  ? ` · ${summary.failedCount} bez odpowiedzi API`
                  : null}
              </p>
            </>
          )}
        </div>
      ) : null}
    </MobileBottomSheet>
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
