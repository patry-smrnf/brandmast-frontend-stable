"use client"

import * as React from "react"
import { ArrowRightIcon, CalendarDaysIcon, ClockIcon, MapPinIcon, PenLineIcon } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { brandmastApi } from "@/lib/api"
import { cn } from "@/lib/utils"

import { formatPlDateTimeFromIso, formatTime, parseIso } from "@/lib/dates/date-utils"
import { getActionStatusPresentation } from "@/lib/action-status"
import type { SvActionLocalPatch, SvActionRow } from "../use-sv-actions"
import { EXCLUDED_BULK_APPROVE_EVENT_ID } from "../supervisor-constants"
import { SupervisorApproveSheet } from "./SupervisorApproveSheet"
import { SupervisorEditSheet } from "./SupervisorEditSheet"

export type SupervisorActionCardProps = {
  row: SvActionRow
  onApproved: () => void
  onPatched: (patch: SvActionLocalPatch) => void
  /** Nakładająca się z inną akcją w tym samym sklepie (ten sam dzień). */
  scheduleConflict?: boolean
  bulkSelectMode?: boolean
  bulkSelected?: boolean
  onBulkSelectChange?: (selected: boolean) => void
}

export function SupervisorActionCard({
  row,
  onApproved,
  onPatched,
  scheduleConflict,
  bulkSelectMode,
  bulkSelected,
  onBulkSelectChange,
}: SupervisorActionCardProps) {
  const { brandmaster, action } = row
  const sinceDate = parseIso(action.since) ?? new Date()
  const untilDate = parseIso(action.until) ?? sinceDate
  const timeLabel = `${formatTime(sinceDate)} – ${formatTime(untilDate)}`
  const [approveOpen, setApproveOpen] = React.useState(false)
  const [editOpen, setEditOpen] = React.useState(false)
  const [isCancelling, setIsCancelling] = React.useState(false)
  const bulkCheckboxId = `sv-bulk-card-${action.idAction}`

  const pres = getActionStatusPresentation(action.status)
  const canApprove = pres.supervisorCanApprove
  const isCancelRequested = action.status === "CANCEL_REQUESTED"
  const showBulkCheckbox = bulkSelectMode === true
  const isBulkApproveExcluded = action.event.idEvent === EXCLUDED_BULK_APPROVE_EVENT_ID
  const showApproveButton = !isBulkApproveExcluded && !isCancelRequested
  const showRevokeButton = isCancelRequested

  async function handleRevoke() {
    setIsCancelling(true)
    const toastId = toast.loading("Odwoływanie…")
    try {
      const res = await brandmastApi.cancelSvAction({ idAction: action.idAction })
      if (res.success === false) {
        toast.error(res.message ?? "Nie udało się odwołać akcji.", { id: toastId })
        return
      }
      toast.success("Akcja została odwołana.", { id: toastId })
      onApproved()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Nie udało się odwołać akcji.", { id: toastId })
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <article
      className={cn(
        "relative isolate overflow-hidden rounded-xl border bg-card shadow-sm transition-[border-color,box-shadow] duration-200 ease-out motion-reduce:transition-none",
        showBulkCheckbox && "pl-12",
        showBulkCheckbox && bulkSelected && "border-primary/30 shadow-[0_0_0_1px] shadow-primary/15",
        scheduleConflict
          ? "border-amber-500/55 bg-amber-500/4 dark:border-amber-400/45 dark:bg-amber-500/10"
          : "border-border/80"
      )}
    >
      {showBulkCheckbox ? (
        <label
          htmlFor={bulkCheckboxId}
          className="absolute inset-y-0 left-0 z-20 flex w-12 cursor-pointer items-center justify-center animate-sv-fade-in motion-reduce:animate-none"
        >
          <input
            id={bulkCheckboxId}
            type="checkbox"
            checked={bulkSelected === true}
            className="size-5 shrink-0 cursor-pointer accent-primary"
            aria-label={`Zaznacz akcję ${row.brandmaster.name} ${row.brandmaster.surname}`}
            onChange={(e) => {
              e.stopPropagation()
              onBulkSelectChange?.(e.target.checked)
            }}
          />
        </label>
      ) : null}

      <div
        className={cn(
          "absolute inset-y-0 left-0 w-0.5 sm:w-1",
          showBulkCheckbox ? "left-12 sm:left-12" : "left-0",
          scheduleConflict ? "bg-amber-500/70 dark:bg-amber-400/60" : "bg-primary/25"
        )}
        aria-hidden
      />

      <div className="relative px-2.5 py-2.5 pl-3 sm:px-3 sm:py-3 sm:pl-3.5">
        <div
          role="button"
          tabIndex={0}
          className="cursor-pointer rounded-md outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => setEditOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              setEditOpen(true)
            }
          }}
        >
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
              variant={pres.badgeVariant}
              className="shrink-0 px-2 py-px text-[10px] leading-tight sm:px-2.5 sm:py-0.5 sm:text-xs"
            >
              {pres.labelPl}
            </Badge>
          </div>

          <div className="mt-1 flex gap-1.5 text-[11px] leading-snug text-muted-foreground sm:mt-1.5 sm:text-xs">
            <MapPinIcon className="mt-px size-3 shrink-0 text-muted-foreground" aria-hidden />
            <span className="min-w-0 text-foreground line-clamp-2">{action.shop.address || "-"}</span>
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
                  <span className="min-w-0 truncate text-foreground/90">
                    {formatPlDateTimeFromIso(action.createdAt)}
                  </span>
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
                  <span className="min-w-0 truncate text-foreground/90">
                    {formatPlDateTimeFromIso(action.editedAt)}
                  </span>
                </span>
              </span>
            </div>
          </div>
        </div>

        {(showApproveButton || showRevokeButton) && (
          <div className="mt-2 flex justify-end">
            {showRevokeButton ? (
              <Button
                size="sm"
                variant="destructive"
                disabled={!canApprove || isCancelling}
                onClick={(e) => {
                  e.stopPropagation()
                  void handleRevoke()
                }}
                className="h-9 shrink-0 px-3 text-xs sm:h-8"
              >
                {isCancelling ? "Odwoływanie…" : "Odwolaj"}
              </Button>
            ) : (
              <Button
                size="sm"
                disabled={!canApprove}
                onClick={(e) => {
                  e.stopPropagation()
                  setApproveOpen(true)
                }}
                className="h-9 shrink-0 px-3 text-xs sm:h-8"
              >
                Approve
              </Button>
            )}
          </div>
        )}
      </div>

      <SupervisorApproveSheet
        open={approveOpen}
        onOpenChange={setApproveOpen}
        row={row}
        onAccepted={onApproved}
      />

      <SupervisorEditSheet open={editOpen} onOpenChange={setEditOpen} row={row} onPatched={onPatched} />
    </article>
  )
}
