"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { brandmastApi } from "@/lib/api"
import { cn } from "@/lib/utils"

import { formatTime, parseIso } from "@/lib/dates/date-utils"
import { sanitizeActionTitle, splitActionIntoMaxFourHourSegments } from "../split-action-segments"
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

export type SupervisorApproveSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  row: SvActionRow
  onAccepted: () => void
}

export function SupervisorApproveSheet({ open, onOpenChange, row, onAccepted }: SupervisorApproveSheetProps) {
  const segments = React.useMemo(
    () => splitActionIntoMaxFourHourSegments(row.action.since, row.action.until),
    [row.action.since, row.action.until]
  )

  const [title, setTitle] = React.useState("")
  const [selected, setSelected] = React.useState<Set<number>>(() => new Set())
  const [entered, setEntered] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [portalTarget, setPortalTarget] = React.useState<HTMLElement | null>(null)

  React.useLayoutEffect(() => {
    setPortalTarget(document.body)
  }, [])

  React.useLayoutEffect(() => {
    if (!open) {
      setEntered(false)
      return
    }
    setTitle((row.action.event.name ?? "").trim())
    setSelected(new Set(segments.map((_, i) => i)))
    const id = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(id)
  }, [open, row.action.idAction, row.action.event.name, segments])

  React.useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => document.getElementById("sv-approve-action-title")?.focus(), 80)
    return () => window.clearTimeout(t)
  }, [open])

  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) onOpenChange(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, isSubmitting, onOpenChange])

  React.useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  function toggleSegment(index: number, checked: boolean | "indeterminate") {
    if (checked === "indeterminate") return
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(index)
      else next.delete(index)
      return next
    })
  }

  async function handleConfirm() {
    const sortedIdx = [...selected].sort((a, b) => a - b)
    const chosen = sortedIdx.map((i) => segments[i]).filter(Boolean)
    if (chosen.length === 0) {
      toast.error("Zaznacz co najmniej jedną podakcję.")
      return
    }

    const base = sanitizeActionTitle(title) || sanitizeActionTitle(row.action.event.name ?? "") || "Akcja"

    setIsSubmitting(true)
    const toastId = toast.loading("Akceptowanie…")
    try {
      const n = chosen.length
      // Kolejne wywołania — backend musi obsłużyć każdą część (np. osobne rekordy lub aktualizacja slotu).
      for (let part = 0; part < n; part++) {
        const seg = chosen[part]!
        const partTitle = `${base} (${part + 1}/${n})`
        const res = await brandmastApi.updateSvAction({
          idAction: row.action.idAction,
          idShop: row.action.idShop,
          since: seg.since,
          until: seg.until,
          status: "ACCEPTED",
          title: partTitle,
        })
        if (res.success === false) {
          toast.error(res.message ?? `Nie udało się zapisać części ${part + 1}/${n}.`, { id: toastId })
          return
        }
      }
      toast.success(n > 1 ? `Zaakceptowano ${n} podakcji.` : "Akcja zaakceptowana.", { id: toastId })
      onOpenChange(false)
      onAccepted()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Nie udało się zaakceptować.", { id: toastId })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!open || !portalTarget) return null

  return createPortal(
    <div className="fixed inset-0 z-60 flex flex-col justify-end sm:justify-center" aria-hidden={false}>
      <button
        type="button"
        className={cn(
          "absolute inset-0 bg-black/45 backdrop-blur-[1px] transition-opacity duration-300",
          entered ? "opacity-100" : "opacity-0"
        )}
        aria-label="Zamknij"
        onClick={() => !isSubmitting && onOpenChange(false)}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="approve-sheet-title"
        aria-describedby="approve-sheet-desc"
        className={cn(
          "relative z-61 flex max-h-[min(92dvh,820px)] w-full flex-col rounded-t-2xl border border-border bg-card shadow-[0_-12px_40px_rgba(0,0,0,0.14)] transition-transform duration-300 ease-out motion-reduce:transition-none",
          "sm:mx-auto sm:mb-4 sm:max-h-[min(88vh,720px)] sm:max-w-lg sm:rounded-2xl sm:shadow-xl",
          entered ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="flex shrink-0 justify-center pt-3 pb-1 sm:hidden" aria-hidden>
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 sm:px-6 sm:pb-6 sm:pt-4">
          <div>
            <h2 id="approve-sheet-title" className="text-lg font-semibold tracking-tight text-foreground">
              Akceptuj akcję
            </h2>
            <p id="approve-sheet-desc" className="mt-1 text-sm text-muted-foreground">
              Akcja zostanie zapisana jako podakcje (maks. 4 h każda). Po zatwierdzeniu każda wybrana część otrzyma
              numer w tytule: <span className="font-medium text-foreground">„… (1/N)”</span>.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sv-approve-action-title">Tytuł akcji</Label>
            <Input
              id="sv-approve-action-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={row.action.event.name || "Np. degustacja produktów"}
              maxLength={200}
              autoComplete="off"
              disabled={isSubmitting}
            />
          </div>

          {segments.length === 0 ? (
            <p className="text-sm text-destructive">Nie udało się podzielić przedziału czasu — sprawdź daty akcji.</p>
          ) : (
            <fieldset className="min-w-0 space-y-2">
              <legend className="text-sm font-medium text-foreground">Podakcje (max 4 h)</legend>
              <ul className="space-y-2">
                {segments.map((seg, i) => {
                  const checked = selected.has(i)
                  return (
                    <li key={`${seg.since}-${seg.until}-${i}`}>
                      <div
                        className={cn(
                          "flex gap-3 rounded-xl border border-border/80 bg-muted/20 px-3 py-3 transition-colors",
                          checked ? "border-primary/35 bg-primary/5" : "opacity-90"
                        )}
                      >
                        <div className="pt-0.5">
                          <Checkbox
                            id={`approve-seg-${row.action.idAction}-${i}`}
                            checked={checked}
                            disabled={isSubmitting}
                            onCheckedChange={(c) => toggleSegment(i, c)}
                            aria-label={`Podakcja ${i + 1}: ${formatSegmentRange(seg.since, seg.until)}`}
                          />
                        </div>
                        <Label
                          htmlFor={`approve-seg-${row.action.idAction}-${i}`}
                          className="min-w-0 flex-1 cursor-pointer space-y-0.5 font-normal leading-snug"
                        >
                          <span className="block text-sm font-medium tabular-nums text-foreground">
                            {formatSegmentRange(seg.since, seg.until)}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            Czas trwania: {segmentDurationLabel(seg.since, seg.until)} · część {i + 1} z{" "}
                            {segments.length}
                          </span>
                        </Label>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </fieldset>
          )}

          <div className="mt-auto flex shrink-0 flex-col-reverse gap-2 border-t border-border/60 pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => onOpenChange(false)}>
              Anuluj
            </Button>
            <Button
              type="button"
              disabled={isSubmitting || segments.length === 0 || selected.size === 0}
              onClick={() => void handleConfirm()}
            >
              {isSubmitting ? "Zapisywanie…" : "Zatwierdź"}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    portalTarget
  )
}
