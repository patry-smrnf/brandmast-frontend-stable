"use client"

import * as React from "react"
import { ArrowRightIcon, ClockIcon, MapPinIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { formatTime, parseIso } from "../../brandmaster/actions/date-utils"
import type { SvActionRow } from "../use-sv-actions"
import { SupervisorApproveSheet } from "./SupervisorApproveSheet"

function statusBadgeVariant(
  status: string
): React.ComponentProps<typeof Badge>["variant"] {
  const u = status.toUpperCase()
  if (u === "ACCEPTED") return "success"
  if (u === "PENDING") return "warning"
  if (u === "REJECTED") return "destructive"
  if (u === "EDITABLE") return "outline"
  return "secondary"
}

function statusLabel(status: string) {
  const u = status.toUpperCase()
  if (u === "ACCEPTED") return "Zaakceptowana"
  if (u === "PENDING") return "Oczekuje"
  if (u === "REJECTED") return "Odrzucona"
  if (u === "EDITABLE") return "Do edycji"
  return status
}

export type SupervisorActionCardProps = {
  row: SvActionRow
  onApproved: () => void
  /** Nakładająca się z inną akcją w tym samym sklepie (ten sam dzień). */
  scheduleConflict?: boolean
}

export function SupervisorActionCard({ row, onApproved, scheduleConflict }: SupervisorActionCardProps) {
  const { brandmaster, action } = row
  const sinceDate = parseIso(action.since) ?? new Date()
  const untilDate = parseIso(action.until) ?? sinceDate
  const timeLabel = `${formatTime(sinceDate)} – ${formatTime(untilDate)}`
  const [approveOpen, setApproveOpen] = React.useState(false)

  const canApprove = action.status.toUpperCase() !== "ACCEPTED"

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-xl border bg-card shadow-sm",
        scheduleConflict
          ? "border-amber-500/55 bg-amber-500/4 dark:border-amber-400/45 dark:bg-amber-500/10"
          : "border-border/80"
      )}
    >
      <div
        className={cn(
          "absolute inset-y-0 left-0 w-1",
          scheduleConflict ? "bg-amber-500/70 dark:bg-amber-400/60" : "bg-primary/25"
        )}
        aria-hidden
      />
      <div className="p-4 pl-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="flex min-w-0 flex-wrap items-center gap-1.5 text-sm leading-snug">
              <span className="font-semibold text-foreground">
                {brandmaster.name} {brandmaster.surname}
              </span>
              <ArrowRightIcon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
              <span className="truncate text-muted-foreground">{action.shop.name}</span>
            </p>
          </div>
          <Badge variant={statusBadgeVariant(action.status)} className="shrink-0">
            {statusLabel(action.status)}
          </Badge>
        </div>

        <div className="mt-4 space-y-2.5 text-sm">
          <div className="flex gap-2 text-muted-foreground">
            <MapPinIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span className="min-w-0 text-foreground">{action.shop.address || "—"}</span>
          </div>
          <div className="flex gap-2 text-muted-foreground">
            <ClockIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span className="tabular-nums text-foreground">{timeLabel}</span>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button size="sm" disabled={!canApprove} onClick={() => setApproveOpen(true)}>
            Approve
          </Button>
        </div>
      </div>

      <SupervisorApproveSheet
        open={approveOpen}
        onOpenChange={setApproveOpen}
        row={row}
        onAccepted={onApproved}
      />
    </article>
  )
}
