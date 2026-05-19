"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { CalendarDaysIcon, MapPinIcon, TimerIcon, UserIcon } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { brandmastApi } from "@/lib/api"
import type { ShopResponse } from "@/lib/api/generated/types"
import { cn } from "@/lib/utils"

import { formatTime, parseIso, toDateKey } from "@/lib/dates/date-utils"
import { getActionStatusPresentation } from "@/lib/action-status"
import {
  buildShopLabel,
  combineDateTimeToIso,
  formatDatePL,
  getShopEventName,
  normalizeTime,
  shopMatchesQuery,
} from "@/app/(routes)/brandmaster/editor/editor-utils"
import type { SvActionLocalPatch, SvActionRow } from "../use-sv-actions"

function dateToLooseTimeInput(d: Date): string {
  const h = d.getHours()
  const m = d.getMinutes()
  const s = d.getSeconds()
  if (m === 0 && s === 0) return String(h)
  if (s === 0) return `${h}:${String(m).padStart(2, "0")}`
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export type SupervisorEditSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  row: SvActionRow
  onPatched: (patch: SvActionLocalPatch) => void
}

export function SupervisorEditSheet({ open, onOpenChange, row, onPatched }: SupervisorEditSheetProps) {
  const { brandmaster, action } = row
  const pres = getActionStatusPresentation(action.status)
  const isEditableStatus = action.status === "EDITABLE"

  const actionDate = React.useMemo(() => parseIso(action.since) ?? new Date(), [action.since])
  const untilDate = React.useMemo(() => parseIso(action.until) ?? actionDate, [action.until, actionDate])

  const [shopQuery, setShopQuery] = React.useState("")
  const [shops, setShops] = React.useState<ShopResponse[]>([])
  const [shopsLoading, setShopsLoading] = React.useState(false)
  const [showShopSuggestions, setShowShopSuggestions] = React.useState(false)
  const hideShopSuggestionsTimeoutRef = React.useRef<number | null>(null)

  const [selectedShop, setSelectedShop] = React.useState<ShopResponse | null>(null)

  const [startTime, setStartTime] = React.useState("")
  const [endTime, setEndTime] = React.useState("")

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
    const sinceD = parseIso(action.since)
    const untilD = parseIso(action.until)
    setStartTime(sinceD ? dateToLooseTimeInput(sinceD) : "")
    setEndTime(untilD ? dateToLooseTimeInput(untilD) : "")
    setShopQuery([action.shop.address, action.shop.name].filter(Boolean).join(" • "))
    setSelectedShop(null)
    setShowShopSuggestions(false)
    const id = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(id)
  }, [open, action.idAction, action.since, action.until, action.shop.address, action.shop.name])

  React.useEffect(() => {
    if (!open) return
    let cancelled = false
    async function load() {
      setShopsLoading(true)
      try {
        const res = await brandmastApi.fetchShops()
        if (cancelled) return
        if (res.success === false) {
          toast.error(res.message ?? "Nie udało się pobrać sklepów.")
          setShops([])
          return
        }
        const list = res.data ?? []
        setShops(list)
        const match = list.find((s) => (s.id ?? 0) === action.idShop) ?? null
        if (match) {
          setSelectedShop(match)
          setShopQuery(buildShopLabel(match))
        }
      } catch (e) {
        if (!cancelled) {
          toast.error(e instanceof Error ? e.message : "Nie udało się pobrać sklepów.")
          setShops([])
        }
      } finally {
        if (!cancelled) setShopsLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [open, action.idShop])

  React.useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => document.getElementById("sv-edit-shop-query")?.focus(), 80)
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

  const filteredShops = React.useMemo(() => shops.filter((s) => shopMatchesQuery(s, shopQuery)), [shops, shopQuery])

  const startNorm = React.useMemo(() => normalizeTime(startTime), [startTime])
  const endNorm = React.useMemo(() => normalizeTime(endTime), [endTime])

  const timesValid =
    startNorm.ok &&
    endNorm.ok &&
    (() => {
      const sinceIso = combineDateTimeToIso(actionDate, startNorm.value)
      const untilIso = combineDateTimeToIso(actionDate, endNorm.value)
      const a = parseIso(sinceIso)?.getTime() ?? 0
      const b = parseIso(untilIso)?.getTime() ?? 0
      return b > a
    })()

  const idShopSelected = selectedShop?.id ?? 0
  const canSubmit =
    isEditableStatus &&
    !isSubmitting &&
    idShopSelected > 0 &&
    startNorm.ok &&
    endNorm.ok &&
    timesValid

  async function handleSave() {
    if (!canSubmit || !startNorm.ok || !endNorm.ok) return
    const sinceIso = combineDateTimeToIso(actionDate, startNorm.value)
    const untilIso = combineDateTimeToIso(actionDate, endNorm.value)
    const idShop = selectedShop!.id ?? 0

    setIsSubmitting(true)
    const toastId = toast.loading("Zapisywanie…")
    try {
      const res = await brandmastApi.updateSvAction({
        idAction: action.idAction,
        idShop,
        since: sinceIso,
        until: untilIso,
      })
      if (res.success === false) {
        toast.error(res.message ?? "Nie udało się zapisać zmian.", { id: toastId })
        return
      }
      toast.success("Zapisano zmiany.", { id: toastId })
      const editedAt = new Date().toISOString()
      onPatched({
        idAction: action.idAction,
        idShop,
        since: sinceIso,
        until: untilIso,
        shop: {
          name: selectedShop!.name ?? "",
          address: selectedShop!.location?.address ?? "",
        },
        editedAt,
      })
      onOpenChange(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Nie udało się zapisać zmian.", { id: toastId })
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
        aria-labelledby="sv-edit-sheet-title"
        className={cn(
          "relative z-61 flex max-h-[min(90dvh,680px)] w-full flex-col rounded-t-2xl border border-border bg-card text-card-foreground shadow-[0_-8px_32px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out motion-reduce:transition-none",
          "sm:mx-auto sm:mb-4 sm:max-h-[min(85vh,640px)] sm:max-w-md sm:rounded-2xl sm:shadow-lg",
          entered ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="flex shrink-0 justify-center pt-2 pb-0.5 sm:hidden" aria-hidden>
          <div className="h-1 w-9 rounded-full bg-muted-foreground/25" />
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1 sm:px-4 sm:pb-4 sm:pt-2.5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-0.5">
              <h2 id="sv-edit-sheet-title" className="text-base font-semibold tracking-tight text-foreground">
                Szczegóły akcji
              </h2>
              <p className="text-xs leading-snug text-muted-foreground">
                {isEditableStatus
                  ? "Lokalizacja i godziny bez zmiany dnia."
                  : "Podgląd. Pełna edycja przy statusie EDITABLE."}
              </p>
            </div>
            <Badge
              variant={pres.badgeVariant}
              className="shrink-0 px-2 py-px text-[10px] font-medium leading-tight sm:text-xs"
            >
              {pres.labelPl}
            </Badge>
          </div>

          <Card className="shadow-xs ring-1 ring-border/50">
            <CardContent className="space-y-2 p-2.5 sm:p-3">
              <div className="flex items-center gap-2">
                <UserIcon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                <span className="text-sm font-semibold leading-tight text-foreground">
                  {brandmaster.name} {brandmaster.surname}
                </span>
              </div>
              <Separator className="bg-border/70" />
              <div className="space-y-1.5 text-xs leading-snug">
                <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-2">
                  <span className="shrink-0 text-muted-foreground">Event</span>
                  <span className="min-w-0 font-medium text-foreground sm:text-end">
                    {action.event.name?.trim() || "-"}
                  </span>
                </div>
                {!isEditableStatus ? (
                  <>
                    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
                      <span className="shrink-0 text-muted-foreground">Sklep</span>
                      <span className="min-w-0 text-end sm:max-w-[70%]">
                        <span className="font-medium text-foreground">{action.shop.name?.trim() || "-"}</span>
                        {action.shop.address ? (
                          <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground sm:mt-0 sm:inline">
                            <span className="text-muted-foreground/50 sm:mx-1" aria-hidden>
                              ·
                            </span>
                            {action.shop.address}
                          </span>
                        ) : null}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                      <span className="shrink-0 text-muted-foreground">Godziny</span>
                      <span className="inline-flex items-center gap-1 tabular-nums font-medium text-foreground sm:justify-end">
                        <TimerIcon className="size-3 shrink-0 text-muted-foreground" aria-hidden />
                        {formatTime(actionDate)} – {formatTime(untilDate)}
                      </span>
                    </div>
                  </>
                ) : null}
                <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                  <span className="shrink-0 text-muted-foreground">Data</span>
                  <span className="inline-flex flex-wrap items-center gap-x-1 gap-y-0.5 tabular-nums text-foreground sm:justify-end">
                    <CalendarDaysIcon className="size-3 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="font-medium">{toDateKey(actionDate)}</span>
                    <span className="hidden text-[11px] font-normal text-muted-foreground sm:inline">
                      ({formatDatePL(actionDate)})
                    </span>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {isEditableStatus ? (
            <>
              <div className="relative z-30 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <MapPinIcon className="size-3.5 shrink-0 opacity-80" aria-hidden />
                  <Label htmlFor="sv-edit-shop-query" className="text-xs font-medium text-muted-foreground">
                    Adres / sklep / event
                  </Label>
                </div>
                <div className="relative">
                  <Input
                    id="sv-edit-shop-query"
                    className="h-9 text-sm"
                    placeholder={shopsLoading ? "Ładowanie…" : "Szukaj…"}
                    value={shopQuery}
                    disabled={isSubmitting}
                    onFocus={() => {
                      if (hideShopSuggestionsTimeoutRef.current) {
                        window.clearTimeout(hideShopSuggestionsTimeoutRef.current)
                        hideShopSuggestionsTimeoutRef.current = null
                      }
                      setShowShopSuggestions(true)
                    }}
                    onBlur={() => {
                      hideShopSuggestionsTimeoutRef.current = window.setTimeout(() => {
                        setShowShopSuggestions(false)
                      }, 120)
                    }}
                    onChange={(e) => {
                      setShopQuery(e.target.value)
                      setShowShopSuggestions(true)
                    }}
                  />

                  {showShopSuggestions ? (
                    <div
                      className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-md"
                      onMouseDown={(e) => {
                        e.preventDefault()
                      }}
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-border/60 px-2 py-1.5 text-[11px] text-muted-foreground">
                        <span>Sugestie</span>
                        <span className="tabular-nums">
                          {shopsLoading ? "…" : `${filteredShops.length}`}
                        </span>
                      </div>
                      <div className="max-h-[min(36vh,240px)] overflow-auto p-1.5">
                        {shopsLoading ? (
                          <div className="rounded-md border border-dashed border-border/80 bg-muted/30 px-2 py-3 text-center text-xs text-muted-foreground">
                            Ładowanie…
                          </div>
                        ) : filteredShops.length ? (
                          <div className="space-y-1">
                            {filteredShops.map((s) => {
                              const isSelected = (selectedShop?.id ?? 0) === (s.id ?? 0)
                              return (
                                <button
                                  key={String(s.id ?? buildShopLabel(s))}
                                  type="button"
                                  onClick={() => {
                                    setSelectedShop(s)
                                    setShopQuery(buildShopLabel(s))
                                    setShowShopSuggestions(false)
                                  }}
                                  className={cn(
                                    "w-full rounded-lg border border-transparent bg-card px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted/80",
                                    isSelected ? "border-accent/60 bg-accent/50" : null
                                  )}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      <div className="truncate font-medium leading-snug text-foreground">
                                        {buildShopLabel(s)}
                                      </div>
                                      <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0 text-[11px] text-muted-foreground">
                                        {s.name ? <span>{s.name}</span> : null}
                                        {getShopEventName(s) ? <span>{getShopEventName(s)}</span> : null}
                                      </div>
                                    </div>
                                    <span className="shrink-0 tabular-nums text-[10px] text-muted-foreground">
                                      {s.id ?? "-"}
                                    </span>
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        ) : (
                          <div className="rounded-md px-2 py-3 text-center text-xs text-muted-foreground">
                            Brak wyników.
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              {selectedShop ? (
                <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted/20 px-2 py-1.5">
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Wybrano
                    </div>
                    <div className="truncate text-xs font-medium leading-snug text-foreground">
                      {buildShopLabel(selectedShop)}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 shrink-0 px-2 text-xs"
                    disabled={isSubmitting}
                    onClick={() => {
                      setSelectedShop(null)
                      setShopQuery("")
                    }}
                  >
                    Zmień
                  </Button>
                </div>
              ) : null}

              <fieldset disabled={isSubmitting} className="min-w-0 space-y-2 rounded-lg border border-border/70 bg-muted/10 p-2.5">
                <legend className="sr-only">Godziny akcji</legend>
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <TimerIcon className="size-3.5 shrink-0 opacity-80" aria-hidden />
                  <span>Godziny</span>
                  <span className="font-normal text-[11px] text-muted-foreground/80">(ten sam dzień)</span>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="sv-edit-start" className="text-xs">
                      Od
                    </Label>
                    <div className="relative">
                      <TimerIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="sv-edit-start"
                        type="text"
                        autoComplete="off"
                        spellCheck={false}
                        placeholder="8 lub 8:30"
                        className="h-9 pl-9 text-sm"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                      />
                    </div>
                    {startTime ? (
                      <p className="text-[11px] leading-snug text-muted-foreground">
                        {startNorm.ok ? `→ ${startNorm.value}` : startNorm.reason}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="sv-edit-end" className="text-xs">
                      Do
                    </Label>
                    <div className="relative">
                      <TimerIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="sv-edit-end"
                        type="text"
                        autoComplete="off"
                        spellCheck={false}
                        placeholder="18 lub 18:45"
                        className="h-9 pl-9 text-sm"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                      />
                    </div>
                    {endTime ? (
                      <p className="text-[11px] leading-snug text-muted-foreground">
                        {endNorm.ok ? `→ ${endNorm.value}` : endNorm.reason}
                      </p>
                    ) : null}
                  </div>
                </div>
                {startNorm.ok && endNorm.ok && !timesValid ? (
                  <p className="text-[11px] text-destructive">Koniec musi być po rozpoczęciu.</p>
                ) : null}
              </fieldset>
            </>
          ) : null}

          <div className="mt-auto space-y-2 pt-1">
            <Separator className="bg-border/70" />
            <div className="flex flex-col-reverse gap-1.5 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
            >
              Zamknij
            </Button>
            {isEditableStatus ? (
              <Button
                type="button"
                size="sm"
                className="w-full sm:w-auto"
                disabled={!canSubmit}
                onClick={() => void handleSave()}
              >
                {isSubmitting ? "Zapisywanie…" : "Zapisz"}
              </Button>
            ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>,
    portalTarget
  )
}
