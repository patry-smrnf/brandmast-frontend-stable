import * as React from "react"

import { cn } from "@/lib/utils"

const TEMPORAL_INPUT_TYPES = new Set([
  "date",
  "time",
  "datetime-local",
  "month",
  "week",
])

function isTemporalInputType(type?: string) {
  return type != null && TEMPORAL_INPUT_TYPES.has(type)
}

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  const temporal = isTemporalInputType(type)

  return (
    <input
      data-slot="input"
      type={type}
      className={cn(
        "h-9 w-full max-w-full min-w-0 rounded-lg border border-input bg-background px-3 py-1 text-base shadow-xs transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
        temporal ? "box-border overflow-hidden" : "block",
        className
      )}
      {...props}
    />
  )
}

export { Input }
