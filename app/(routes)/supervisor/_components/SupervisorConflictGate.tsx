"use client"

import { AlertTriangleIcon } from "lucide-react"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { formatTime, parseIso } from "@/lib/dates/date-utils"
import { getActionStatusPresentation } from "@/lib/action-status"
import { cn } from "@/lib/utils"

import type { SvActionRow } from "../use-sv-actions"

function peerTimeLabel(row: SvActionRow): string {
  const since = parseIso(row.action.since)
  const until = parseIso(row.action.until)
  if (!since || !until) return "—"
  return `${formatTime(since)} – ${formatTime(until)}`
}

export type SupervisorConflictGateProps = {
  peers: SvActionRow[]
  acknowledged: boolean
  onAcknowledgedChange: (value: boolean) => void
  disabled?: boolean
  /** Short context under the title (approve vs edit). */
  hint?: string
  className?: string
}

/**
 * Collision gate: lists overlapping peers (BM + hours) and requires acknowledgment
 * before Approve/Edit can proceed. When `peers` is empty, renders nothing (happy path unchanged).
 */
export function SupervisorConflictGate({
  peers,
  acknowledged,
  onAcknowledgedChange,
  disabled,
  hint = "Zatwierdzenie mimo kolizji może skutkować podwójnym bookowaniem sklepu.",
  className,
}: SupervisorConflictGateProps) {
  if (peers.length === 0) return null

  const checkboxId = "sv-conflict-gate-ack"

  return (
    <div
      role="alert"
      className={cn(
        "space-y-2.5 rounded-xl border border-amber-500/45 bg-amber-500/8 px-3 py-3 dark:bg-amber-500/10",
        className
      )}
    >
      <div className="flex gap-2">
        <AlertTriangleIcon
          className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-400"
          aria-hidden
        />
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold leading-snug text-amber-950 dark:text-amber-50">
            Kolizja z {peers.length === 1 ? "inną akcją" : `${peers.length} akcjami`}
          </p>
          <p className="text-xs leading-relaxed text-amber-900/90 dark:text-amber-100/85">{hint}</p>
        </div>
      </div>

      <ul className="space-y-1.5">
        {peers.map((peer) => {
          const status = getActionStatusPresentation(peer.action.status)
          return (
            <li
              key={peer.action.idAction}
              className="rounded-lg border border-amber-500/25 bg-background/80 px-2.5 py-2 dark:bg-background/50"
            >
              <p className="text-sm font-medium leading-snug text-foreground">
                {peer.brandmaster.name} {peer.brandmaster.surname}
              </p>
              <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                {peerTimeLabel(peer)}
                <span className="text-muted-foreground/40" aria-hidden>
                  {" · "}
                </span>
                <span>{status.labelPl}</span>
              </p>
            </li>
          )
        })}
      </ul>

      <div className="flex items-start gap-2.5 pt-0.5">
        <Checkbox
          id={checkboxId}
          checked={acknowledged}
          disabled={disabled}
          onCheckedChange={(c) => {
            if (c === "indeterminate") return
            onAcknowledgedChange(c)
          }}
          className="mt-0.5"
        />
        <Label htmlFor={checkboxId} className="cursor-pointer text-xs font-normal leading-snug text-foreground">
          Rozumiem kolizję i chcę kontynuować
        </Label>
      </div>
    </div>
  )
}
