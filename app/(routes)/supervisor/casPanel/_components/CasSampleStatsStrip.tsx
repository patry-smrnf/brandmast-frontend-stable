"use client"

import type { SampleStatsFieldCounts } from "@/lib/api"
import { cn } from "@/lib/utils"

const STRIP_CLASS =
  "flex items-stretch divide-x divide-primary/15 overflow-hidden rounded-md border border-primary/20 bg-primary/5"

export function getCasSampleMetrics(stats: SampleStatsFieldCounts) {
  return [
    { label: "Hilo", value: stats.glo.hilo },
    { label: "Hilo+", value: stats.glo.hiloPlus },
    { label: "Hyper Pro", value: stats.glo.hyperPro },
    { label: "Velo", value: stats.veloNet },
  ] as const
}

export function CasSampleStatsSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className={cn(STRIP_CLASS, "h-[4.25rem] animate-pulse border-border/50 bg-muted/40")}>
      {Array.from({ length: columns }).map((_, i) => (
        <div
          key={i}
          className={cn("min-w-0 flex-1 bg-muted/70", i > 0 && "border-l border-border/40")}
        />
      ))}
    </div>
  )
}

export function CasSampleStatsStrip({ stats }: { stats: SampleStatsFieldCounts }) {
  const metrics = getCasSampleMetrics(stats)

  return (
    <div className={STRIP_CLASS} role="group" aria-label="Wyniki próbek">
      {metrics.map(({ label, value }) => (
        <div
          key={label}
          className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1.5 py-2 sm:px-2"
        >
          <span className="truncate text-[10px] font-medium text-muted-foreground">{label}</span>
          <span className="text-sm font-semibold tabular-nums leading-none">{value}</span>
        </div>
      ))}
    </div>
  )
}
