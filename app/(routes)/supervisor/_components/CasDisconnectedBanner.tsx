"use client"

import { UnplugIcon } from "lucide-react"

export function CasDisconnectedBanner() {
  return (
    <div
      role="status"
      className="mb-4 flex items-start gap-2.5 rounded-2xl border border-amber-500/45 bg-amber-500/10 px-3.5 py-3 text-sm text-foreground shadow-sm"
    >
      <UnplugIcon
        className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-400"
        aria-hidden
      />
      <span className="min-w-0 flex-1 font-medium leading-snug">
        CAS jest wyłączony dla zespołu
      </span>
    </div>
  )
}
