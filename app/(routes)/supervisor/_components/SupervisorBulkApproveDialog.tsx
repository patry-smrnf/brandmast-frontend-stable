"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { AlertCircleIcon, CheckCircle2Icon, Loader2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { brandmastApi } from "@/lib/api"
import { cn } from "@/lib/utils"
import { formatTime, parseIso } from "@/lib/dates/date-utils"

import {
  sanitizeActionTitle,
  splitActionIntoMaxFourHourSegments,
} from "../split-action-segments"
import type { SvActionRow } from "../use-sv-actions"

function segmentDurationLabel(sinceIso: string, untilIso: string): string {
  const a = parseIso(sinceIso)?.getTime() ?? 0
  const b = parseIso(untilIso)?.getTime() ?? 0
  const h = Math.max(0, (b - a) / (60 * 60 * 1000))
  if (h < 1) return `${Math.round((b - a) / (60 * 1000))} min`
  const rounded = Math.round(h * 10) / 10
  return `${rounded} h`
}

function formatSegmentRange(sinceIso: string, untilIso: string): string {
  const s = parseIso(sinceIso)
  const e = parseIso(untilIso)
  if (!s || !e) return `${sinceIso} – ${untilIso}`
  return `${formatTime(s)} – ${formatTime(e)}`
}

type BulkPhase = "running" | "error" | "done"

async function approveSingleAction(row: SvActionRow): Promise<void> {
  const segments = splitActionIntoMaxFourHourSegments(row.action.since, row.action.until)
  if (segments.length === 0) {
    throw new Error("Nie udało się podzielić przedziału czasu akcji.")
  }

  const base = sanitizeActionTitle(row.action.event.name ?? "") || "Akcja"
  const n = segments.length

  for (let i = 0; i < n; i++) {
    const seg = segments[i]!
    const partTitle = `[${i + 1}/${n}] ${base}`
    const res = await brandmastApi.approveSvAction({
      idAction: row.action.idAction,
      since: seg.since,
      until: seg.until,
      title: partTitle,
      isActive: true,
    })
    if (res.success === false) {
      throw new Error(res.message ?? `Nie udało się zapisać części ${i + 1}/${n}.`)
    }
  }
}

export type SupervisorBulkApproveDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  rows: SvActionRow[]
  /** Always called after a finished run (success or partial/error) so the list refetches. */
  onComplete: () => void
}

export function SupervisorBulkApproveDialog({
  open,
  onOpenChange,
  rows,
  onComplete,
}: SupervisorBulkApproveDialogProps) {
  const [portalTarget, setPortalTarget] = React.useState<HTMLElement | null>(null)
  const [entered, setEntered] = React.useState(false)
  const [phase, setPhase] = React.useState<BulkPhase>("running")
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [completedCount, setCompletedCount] = React.useState(0)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const runIdRef = React.useRef(0)
  const completedCountRef = React.useRef(0)
  const onCompleteRef = React.useRef(onComplete)
  onCompleteRef.current = onComplete
  const rowsRef = React.useRef(rows)
  rowsRef.current = rows

  const rowsKey = React.useMemo(
    () => rows.map((r) => r.action.idAction).join(","),
    [rows]
  )

  const total = rows.length
  const currentRow =
    (phase === "running" || phase === "error") && currentIndex < total ? rows[currentIndex] : null

  const currentSegments = React.useMemo(() => {
    if (!currentRow) return []
    return splitActionIntoMaxFourHourSegments(currentRow.action.since, currentRow.action.until)
  }, [currentRow])

  const runFrom = React.useCallback(async (fromIndex: number) => {
    const runId = ++runIdRef.current
    const list = rowsRef.current
    setPhase("running")
    setErrorMessage(null)

    for (let i = fromIndex; i < list.length; i++) {
      if (runIdRef.current !== runId) return
      setCurrentIndex(i)
      try {
        await approveSingleAction(list[i]!)
        if (runIdRef.current !== runId) return
        const nextCompleted = i + 1
        completedCountRef.current = nextCompleted
        setCompletedCount(nextCompleted)
      } catch (e) {
        if (runIdRef.current !== runId) return
        setErrorMessage(e instanceof Error ? e.message : "Nie udało się zaakceptować akcji.")
        setPhase("error")
        // Refetch even on partial failure so UI is not stale; retry must not resend completed.
        onCompleteRef.current()
        return
      }
    }
    if (runIdRef.current !== runId) return
    setPhase("done")
    onCompleteRef.current()
  }, [])

  React.useLayoutEffect(() => {
    setPortalTarget(document.body)
  }, [])

  React.useLayoutEffect(() => {
    if (!open) {
      setEntered(false)
      return
    }
    const id = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(id)
  }, [open])

  React.useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  React.useEffect(() => {
    if (!open || rows.length === 0) return

    completedCountRef.current = 0
    setCompletedCount(0)
    setCurrentIndex(0)
    setErrorMessage(null)
    void runFrom(0)

    return () => {
      runIdRef.current++
    }
  }, [open, rowsKey, rows.length, runFrom])

  function handleClose() {
    runIdRef.current++
    onOpenChange(false)
  }

  function handleContinueRemaining() {
    // Resume from the failed index — already-completed actions are not resent.
    void runFrom(currentIndex)
  }

  if (!open || !portalTarget) return null

  const progressRatio = total > 0 ? completedCount / total : 0
  const progressPct = Math.round(progressRatio * 100)
  const progressLabel = `${completedCount} / ${total}`
  const remainingCount = Math.max(0, total - completedCount)

  const title =
    phase === "done"
      ? "Podsumowanie"
      : phase === "error"
        ? completedCount > 0
          ? "Częściowo dodano"
          : "Błąd dodawania"
        : "Dodawanie do TP"

  const subtitle =
    phase === "done"
      ? `Dodano ${completedCount} ${completedCount === 1 ? "akcję" : completedCount < 5 ? "akcje" : "akcji"}.`
      : phase === "error"
        ? completedCount > 0
          ? `Dodano ${completedCount} z ${total} przed błędem. Już wysłane nie będą ponawiane.`
          : "Proces przerwany — szczegóły poniżej."
        : total > 0
          ? `Akcja ${Math.min(currentIndex + 1, total)} z ${total}`
          : "Brak akcji do dodania."

  return createPortal(
    <div className="fixed inset-0 z-60 flex flex-col justify-end sm:justify-center" aria-hidden={false}>
      <div
        className={cn(
          "absolute inset-0 bg-black/50 transition-opacity duration-200 max-sm:backdrop-blur-none sm:bg-black/45 sm:backdrop-blur-[1px]",
          entered ? "opacity-100" : "opacity-0"
        )}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-approve-title"
        className={cn(
          "relative z-61 flex max-h-[min(94dvh,820px)] w-full flex-col rounded-t-2xl border border-border bg-card shadow-[0_-12px_40px_rgba(0,0,0,0.18)] transition-transform duration-300 ease-out motion-reduce:transition-none",
          "sm:mx-auto sm:mb-4 sm:max-h-[min(88vh,720px)] sm:max-w-md sm:rounded-2xl sm:shadow-xl",
          entered ? "translate-y-0 animate-sv-enter-up motion-reduce:animate-none" : "translate-y-full"
        )}
      >
        <div className="flex shrink-0 justify-center pt-2.5 pb-1 sm:hidden" aria-hidden>
          <div className="h-1 w-10 rounded-full bg-muted-foreground/35" />
        </div>

        <div className="flex shrink-0 items-start gap-3 border-b border-border/60 px-4 py-3 sm:px-5">
          <div className="min-w-0 flex-1">
            <h2 id="bulk-approve-title" className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
              {title}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">{subtitle}</p>
          </div>
          {phase === "running" ? (
            <Loader2Icon className="size-5 shrink-0 animate-spin text-primary" aria-hidden />
          ) : phase === "done" ? (
            <CheckCircle2Icon className="size-5 shrink-0 text-primary animate-sv-fade-in motion-reduce:animate-none" aria-hidden />
          ) : (
            <AlertCircleIcon className="size-5 shrink-0 text-destructive animate-sv-fade-in motion-reduce:animate-none" aria-hidden />
          )}
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 sm:px-5 sm:py-4">
            {phase === "error" && errorMessage ? (
              <div
                role="alert"
                className="animate-sv-content-in mb-3 flex gap-2.5 rounded-xl border border-destructive/35 bg-destructive/8 px-3 py-3 text-sm text-destructive motion-reduce:animate-none"
              >
                <AlertCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
                <div className="min-w-0 space-y-1">
                  <p>
                    Błąd przy akcji {currentIndex + 1}/{total}
                    {currentRow
                      ? ` (${currentRow.brandmaster.name} ${currentRow.brandmaster.surname})`
                      : ""}
                    .
                  </p>
                  <p>{errorMessage}</p>
                  {completedCount > 0 ? (
                    <p className="text-destructive/90">
                      Lista została odświeżona. Dokończenie wyśle tylko pozostałe {remainingCount}{" "}
                      {remainingCount === 1 ? "akcję" : "akcji"} — bez ponawiania już dodanych.
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            {phase === "done" ? (
              <div className="animate-sv-content-in flex gap-2.5 rounded-xl border border-primary/35 bg-primary/5 px-3 py-3 text-sm text-foreground motion-reduce:animate-none">
                <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <p>
                  Wszystkie zaznaczone akcje ({completedCount}) trafiły do tourplannera z aktywnymi
                  podakcjami.
                </p>
              </div>
            ) : null}

            {currentRow ? (
              <div
                key={currentRow.action.idAction}
                className="animate-sv-content-in space-y-3 rounded-xl border border-border/80 bg-muted/20 px-3 py-3 motion-reduce:animate-none"
              >
                <div className="space-y-1">
                  <p className="text-sm font-semibold leading-snug text-foreground">
                    {currentRow.brandmaster.name} {currentRow.brandmaster.surname}
                  </p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {currentRow.action.shop.address || "—"}
                  </p>
                  <p className="text-xs font-medium text-foreground">{currentRow.action.event.name}</p>
                </div>

                {currentSegments.length === 0 ? (
                  <p className="text-sm text-destructive">Nie udało się podzielić przedziału czasu.</p>
                ) : (
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      Podakcje
                    </p>
                    <ul className="space-y-1.5">
                      {currentSegments.map((seg, i) => (
                        <li
                          key={`${seg.since}-${seg.until}-${i}`}
                          className="rounded-lg border border-border/60 bg-background/80 px-2.5 py-2"
                        >
                          <p className="text-sm font-medium tabular-nums text-foreground">
                            {formatSegmentRange(seg.since, seg.until)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {segmentDurationLabel(seg.since, seg.until)} · {i + 1}/{currentSegments.length}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <div className="shrink-0 border-t border-border/60 bg-card px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5 sm:pb-4">
            <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Postęp</span>
              <span className="tabular-nums font-medium text-foreground">{progressLabel}</span>
            </div>
            <div
              className="h-2.5 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progressPct}
              aria-label="Postęp dodawania akcji"
            >
              <div
                className={cn(
                  "h-full w-full origin-left rounded-full transition-transform duration-300 ease-out motion-reduce:transition-none",
                  phase === "error" ? "bg-destructive" : "bg-primary"
                )}
                style={{ transform: `scaleX(${progressRatio})` }}
              />
            </div>

            {(phase === "done" || phase === "error") && (
              <div className="mt-3 flex flex-col gap-2 sm:flex-row-reverse">
                {phase === "error" && remainingCount > 0 ? (
                  <Button type="button" className="h-11 w-full sm:h-9" onClick={handleContinueRemaining}>
                    Dokończ pozostałe ({remainingCount})
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant={phase === "error" && remainingCount > 0 ? "outline" : "default"}
                  className="h-11 w-full sm:h-9"
                  onClick={handleClose}
                >
                  Zamknij
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    portalTarget
  )
}
