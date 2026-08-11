"use client"

import { ListChecksIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { isCasConnected } from "@/lib/config"
import { cn } from "@/lib/utils"

export type SupervisorBulkToolbarProps = {
  enabled: boolean
  selectedCount: number
  eligibleCount: number
  isBusy?: boolean
  onEnabledChange: (checked: boolean | "indeterminate") => void
  onStart: () => void
}

export function SupervisorBulkToolbar({
  enabled,
  selectedCount,
  eligibleCount,
  isBusy = false,
  onEnabledChange,
  onStart,
}: SupervisorBulkToolbarProps) {
  const canStart = enabled && selectedCount > 0 && !isBusy
  const casConnected = isCasConnected()

  return (
    <>
      <div className="animate-sv-fade-in rounded-xl border border-border/80 bg-muted/25 p-3">
        <label
          htmlFor="sv-bulk-approve-toggle"
          className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg active:bg-muted/40"
        >
          <Checkbox
            id="sv-bulk-approve-toggle"
            checked={enabled}
            disabled={isBusy}
            onCheckedChange={onEnabledChange}
            aria-label="Akceptuj wiele"
            className="size-5 shrink-0"
          />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium leading-tight text-foreground">
              Akceptuj wiele
            </span>
            <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
              {enabled
                ? casConnected
                  ? "Zaznacz akcje na liście i dodaj je do TourPlannera."
                  : "Zaznacz akcje na liście i zaakceptuj je."
                : "Włącz, aby zaznaczać wiele akcji naraz."}
            </span>
          </span>
        </label>
      </div>

      {enabled ? (
        <div
          className={cn(
            "fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 px-3",
            "sm:static sm:inset-auto sm:px-0 sm:pt-2",
          )}
        >
          <div
            className={cn(
              "overflow-hidden rounded-2xl border border-border/90 bg-card/95 shadow-lg backdrop-blur-sm",
              "animate-sv-enter-up sm:animate-none sm:rounded-xl sm:border-border/80 sm:bg-muted/20 sm:shadow-none sm:backdrop-blur-none",
            )}
          >
            <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground sm:flex-1">
                <ListChecksIcon className="size-3.5 shrink-0 text-primary" aria-hidden />
                <span className="tabular-nums">
                  <span className="font-semibold text-foreground">{selectedCount}</span>
                  {" / "}
                  {eligibleCount} zaznaczonych
                </span>
              </div>
              <Button
                type="button"
                disabled={!canStart}
                onClick={onStart}
                className="h-11 w-full shrink-0 text-sm font-medium sm:h-9 sm:w-auto sm:min-w-[9.5rem]"
              >
                {isBusy
                  ? "Akceptowanie…"
                  : casConnected
                    ? "Dodaj do TP"
                    : "Akceptuj"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
