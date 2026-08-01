import { cn } from "@/lib/utils"

/** Shared fintech-card language for Brandmaster (theme tokens only) */
export const bmCardClass =
  "overflow-hidden rounded-2xl border-0 bg-card shadow-md ring-1 ring-border/60"

export const bmCardPadHeader = "space-y-0.5 px-4 py-3.5 pb-2 sm:px-5"
export const bmCardPadContent = "px-4 pb-4 sm:px-5 sm:pb-5"

export const bmMetricTileClass =
  "rounded-2xl border-0 bg-muted/30 shadow-sm ring-1 ring-border/50"

export const bmIconBubble = (tone: "sky" | "orange" | "primary" | "teal" | "violet" | "amber") =>
  cn(
    "inline-flex size-8 shrink-0 items-center justify-center rounded-xl",
    tone === "sky" && "bg-sky-500/15 text-sky-400",
    tone === "orange" && "bg-orange-500/15 text-orange-400",
    tone === "primary" && "bg-primary/15 text-primary",
    tone === "teal" && "bg-teal-500/15 text-teal-400",
    tone === "violet" && "bg-primary/15 text-primary",
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
