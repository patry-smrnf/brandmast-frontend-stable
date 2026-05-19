"use client"

import * as React from "react"
import { BanIcon, CalendarRangeIcon, ClockIcon, UserIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

import {
  formatHoursPl,
  type BrandmasterStatRow,
  sumTeamStats,
} from "../brandmaster-stats-utils"

export type BrandmastersStatsViewProps = {
  stats: BrandmasterStatRow[]
  fromDayLabel: string
  emptyMessage?: string
}

function StatMetric({
  icon: Icon,
  label,
  value,
  valueClassName,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1 rounded-lg border border-border/80 bg-muted/30 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="size-3 shrink-0" aria-hidden />
        {label}
      </div>
      <p className={cn("text-lg font-semibold tabular-nums leading-none", valueClassName)}>{value}</p>
    </div>
  )
}

function StatCard({ row, fromDayLabel }: { row: BrandmasterStatRow; fromDayLabel: string }) {
  const fullName = [row.name.trim(), row.surname.trim()].filter(Boolean).join(" ")
  const title = fullName || `Brandmaster #${row.idBrandmaster}`
  const hasCancelled = row.cancelledCount > 0

  return (
    <article className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
      <div className="flex items-start gap-2.5 border-b border-border/60 px-3 py-3">
        <UserIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold leading-tight">{title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">ID {row.idBrandmaster}</p>
        </div>
        {hasCancelled ? (
          <Badge variant="destructive" className="shrink-0 text-[10px] font-normal">
            Odwołania
          </Badge>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3">
        <StatMetric
          icon={BanIcon}
          label="Odwołane"
          value={String(row.cancelledCount)}
          valueClassName={hasCancelled ? "text-destructive" : "text-foreground"}
        />
        <StatMetric
          icon={ClockIcon}
          label="Godziny w mies."
          value={formatHoursPl(row.totalHours)}
        />
        <div className="col-span-2 sm:col-span-1">
          <StatMetric
            icon={CalendarRangeIcon}
            label={`Od ${fromDayLabel}`}
            value={formatHoursPl(row.hoursFromDay)}
          />
        </div>
      </div>
    </article>
  )
}

export function BrandmastersStatsView({
  stats,
  fromDayLabel,
  emptyMessage,
}: BrandmastersStatsViewProps) {
  const team = React.useMemo(() => sumTeamStats(stats), [stats])

  if (stats.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
        {emptyMessage ?? "Brak danych statystycznych."}
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <section
        className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-muted/40 p-3 shadow-xs sm:grid-cols-3 sm:gap-3 sm:p-4"
        aria-label="Podsumowanie zespołu"
      >
        <StatMetric
          icon={BanIcon}
          label="Odwołane łącznie"
          value={String(team.cancelledCount)}
          valueClassName={team.cancelledCount > 0 ? "text-destructive" : undefined}
        />
        <StatMetric
          icon={ClockIcon}
          label="Godziny w mies."
          value={formatHoursPl(team.totalHours)}
        />
        <div className="col-span-2 sm:col-span-1">
          <StatMetric
            icon={CalendarRangeIcon}
            label={`Od ${fromDayLabel}`}
            value={formatHoursPl(team.hoursFromDay)}
          />
        </div>
      </section>

      <ul className="space-y-2.5">
        {stats.map((row) => (
          <li key={row.idBrandmaster}>
            <StatCard row={row} fromDayLabel={fromDayLabel} />
          </li>
        ))}
      </ul>
    </div>
  )
}
