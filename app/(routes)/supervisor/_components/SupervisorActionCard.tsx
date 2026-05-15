"use client"

import * as React from "react"
import { ArrowRightIcon, CalendarDaysIcon, ClockIcon, MapPinIcon, PenLineIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { formatPlDateTimeFromIso, formatTime, parseIso } from "@/lib/dates/date-utils"
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
        "relative overflow-hidden rounded-lg border bg-card shadow-sm",
        scheduleConflict
          ? "border-amber-500/55 bg-amber-500/4 dark:border-amber-400/45 dark:bg-amber-500/10"
          : "border-border/80"
      )}
    >
      <div
        className={cn(
          "absolute inset-y-0 left-0 w-0.5 sm:w-1",
          scheduleConflict ? "bg-amber-500/70 dark:bg-amber-400/60" : "bg-primary/25"
        )}
        aria-hidden
      />
      <div className="px-2.5 py-2 pl-3 sm:px-3 sm:py-2.5 sm:pl-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="flex min-w-0 flex-wrap items-center gap-1 text-xs font-semibold leading-tight text-foreground sm:gap-1.5 sm:text-sm sm:leading-snug">
              <span className="wrap-break-word">
                {brandmaster.name} {brandmaster.surname}
              </span>
              <ArrowRightIcon className="size-3 shrink-0 text-muted-foreground sm:size-3.5" aria-hidden />
              <span className="truncate font-medium text-muted-foreground">{action.shop.name}</span>
            </p>
          </div>
          <Badge
            variant={statusBadgeVariant(action.status)}
            className="shrink-0 px-2 py-px text-[10px] leading-tight sm:px-2.5 sm:py-0.5 sm:text-xs"
          >
            {statusLabel(action.status)}
          </Badge>
        </div>

        <div className="mt-1 flex gap-1.5 text-[11px] leading-snug text-muted-foreground sm:mt-1.5 sm:text-xs">
          <MapPinIcon className="mt-px size-3 shrink-0 text-muted-foreground" aria-hidden />
          <span className="min-w-0 text-foreground line-clamp-2">{action.shop.address || "—"}</span>
        </div>

        <div className="mt-1 flex items-start justify-between gap-2 sm:mt-1.5">
          <div className="min-w-0 flex-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] tabular-nums text-muted-foreground sm:gap-x-2 sm:text-[11px] sm:text-xs">
            <span className="inline-flex items-center gap-1 text-foreground">
              <ClockIcon className="size-3 shrink-0 text-muted-foreground" aria-hidden />
              {timeLabel}
            </span>
            <span className="text-muted-foreground/35 select-none" aria-hidden>
              ·
            </span>
            <span className="inline-flex max-w-full flex-wrap items-center gap-x-1.5 gap-y-0.5 rounded-md border border-border/50 bg-muted/25 px-1.5 py-px sm:py-0.5">
              <span className="inline-flex min-w-0 items-center gap-0.5">
                <CalendarDaysIcon className="size-3 shrink-0" aria-hidden />
                <span className="shrink-0 text-muted-foreground max-sm:hidden">Utworzono:</span>
                <span className="shrink-0 text-muted-foreground sm:hidden" title="Utworzono">
                  Utw.
                </span>
                <span className="min-w-0 truncate text-foreground/90">{formatPlDateTimeFromIso(action.createdAt)}</span>
              </span>
              <span className="text-muted-foreground/35 select-none" aria-hidden>
                ·
              </span>
              <span className="inline-flex min-w-0 items-center gap-0.5">
                <PenLineIcon className="size-3 shrink-0" aria-hidden />
                <span className="shrink-0 text-muted-foreground max-sm:hidden">Edytowano:</span>
                <span className="shrink-0 text-muted-foreground sm:hidden" title="Edytowano">
                  Ed.
                </span>
                <span className="min-w-0 truncate text-foreground/90">{formatPlDateTimeFromIso(action.editedAt)}</span>
              </span>
            </span>
          </div>
          <Button
            size="sm"
            disabled={!canApprove}
            onClick={() => setApproveOpen(true)}
            className="h-7 shrink-0 px-2.5 text-xs sm:h-8 sm:px-3"
          >
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
