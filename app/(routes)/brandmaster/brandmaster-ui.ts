import { cn } from "@/lib/utils"

/** Shared fintech-card language for Brandmaster (theme tokens only) */
export const bmCardClass =
  "overflow-hidden rounded-2xl border-0 bg-card shadow-md ring-1 ring-border/60"

export const bmCardPadHeader = "space-y-0.5 px-4 py-3.5 pb-2 sm:px-5"
export const bmCardPadContent = "px-4 pb-4 sm:px-5 sm:pb-5"

export const bmMetricTileClass =
  "rounded-2xl border-0 bg-muted/30 shadow-sm ring-1 ring-border/50"

/**
 * Icon bubbles on the Brandmast purple chart scale.
 * Legacy tone names map onto primary / chart / accent -no sky/orange/teal accents.
 * `amber` stays for warning-adjacent UI (Awaryjne).
 */
export type BmIconTone = "sky" | "orange" | "primary" | "teal" | "violet" | "amber"

export const bmIconBubble = (tone: BmIconTone) =>
  cn(
    "inline-flex size-8 shrink-0 items-center justify-center rounded-xl",
    tone === "primary" && "bg-primary/15 text-primary",
    tone === "violet" && "bg-accent text-accent-foreground",
    tone === "sky" && "bg-chart-3/20 text-chart-3",
    tone === "orange" && "bg-chart-2/20 text-chart-2",
    tone === "teal" && "bg-chart-5/25 text-chart-5",
    tone === "amber" && "bg-amber-500/15 text-amber-400",
  )

export const bmSegmentedTrack =
  "grid grid-cols-2 gap-1 rounded-2xl bg-muted/40 p-1 ring-1 ring-border/50"

export const bmSegmentedTab = (active: boolean) =>
  cn(
    "inline-flex min-h-9 items-center justify-center rounded-xl px-2 py-1.5 text-xs font-medium transition-colors sm:text-sm",
    active
      ? "bg-primary text-primary-foreground shadow-sm"
      : "bg-transparent text-muted-foreground hover:text-foreground",
  )
