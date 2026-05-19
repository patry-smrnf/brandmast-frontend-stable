"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { isAxiosError } from "axios"
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  Loader2Icon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { brandmastApi } from "@/lib/api"
import type {
  Event,
  ShopAddRequest,
  ShopResponse,
  TourPlannerPointListItem,
} from "@/lib/api/generated/types"
import {
  casPointMatchesQuery,
  formatCasPointAddress,
  getCasPointKey,
} from "@/lib/shops/cas-point-utils"
import { buildExistingShopTpIdSet } from "@/lib/shops/shop-utils"
import { cn } from "@/lib/utils"

function readApiError(err: unknown): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined
    return data?.message ?? err.message ?? "Błąd sieci."
  }
  if (err instanceof Error) return err.message
  return "Nieznany błąd."
}

export type AddShopsSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingShops: ShopResponse[]
  onShopsAdded?: () => void
}

type CasPointRow = {
  point: TourPlannerPointListItem
  key: string
  alreadyAdded: boolean
}

function buildShopAddRequest(point: TourPlannerPointListItem, idEvent: number): ShopAddRequest {
  const addr = point.address
  return {
    tpUuid: point.uuid?.trim(),
    tpIdent: point.ident?.trim(),
    name: point.name?.trim(),
    street_address: addr?.streetAddress?.trim(),
    cityName: addr?.cityName?.trim(),
    geoLat: addr?.geoLat?.trim(),
    geoLng: addr?.geoLng?.trim(),
    idEvent,
  }
}

function shopAddLabel(point: TourPlannerPointListItem, index: number) {
  return point.name?.trim() || point.ident?.trim() || `sklep ${index + 1}`
}

/** Jedno żądanie POST /api/shop/sv/add na każdy wybrany punkt. */
async function addShopsViaApi(
  event: Event,
  points: TourPlannerPointListItem[],
): Promise<{ ok: boolean; message?: string }> {
  const idEvent = event.id
  if (idEvent == null) {
    return { ok: false, message: "Brak identyfikatora eventu." }
  }

  const total = points.length
  for (let i = 0; i < total; i++) {
    const point = points[i]!
    const body = buildShopAddRequest(point, idEvent)
    if (!body.tpUuid) {
      return {
        ok: false,
        message: `${shopAddLabel(point, i)}: brak UUID Tourplannera.`,
      }
    }

    const res = await brandmastApi.addShop(body)
    if (res.success === false) {
      const label = shopAddLabel(point, i)
      const suffix = total > 1 ? ` (${i + 1}/${total})` : ""
      return {
        ok: false,
        message: res.message ?? `Nie udało się dodać: ${label}${suffix}.`,
      }
    }
  }

  return { ok: true }
}

export function AddShopsSheet({
  open,
  onOpenChange,
  existingShops,
  onShopsAdded,
}: AddShopsSheetProps) {
  const [entered, setEntered] = React.useState(false)
  const [portalTarget, setPortalTarget] = React.useState<HTMLElement | null>(null)

  const [events, setEvents] = React.useState<Event[]>([])
  const [eventsLoading, setEventsLoading] = React.useState(false)
  const [eventsError, setEventsError] = React.useState<string | null>(null)

  const [selectedEventId, setSelectedEventId] = React.useState<number | null>(null)
  const [casPoints, setCasPoints] = React.useState<TourPlannerPointListItem[]>([])
  const [pointsLoading, setPointsLoading] = React.useState(false)
  const [pointsError, setPointsError] = React.useState<string | null>(null)

  const [search, setSearch] = React.useState("")
  const [selectedKeys, setSelectedKeys] = React.useState<Set<string>>(() => new Set())
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const existingTpIds = React.useMemo(
    () => buildExistingShopTpIdSet(existingShops),
    [existingShops],
  )

  const selectedEvent = React.useMemo(
    () => events.find((e) => e.id === selectedEventId) ?? null,
    [events, selectedEventId],
  )

  const rows = React.useMemo((): CasPointRow[] => {
    return casPoints.map((point, index) => {
      const key = getCasPointKey(point, index)
      const uuid = point.uuid?.trim() ?? ""
      return {
        point,
        key,
        alreadyAdded: Boolean(uuid && existingTpIds.has(uuid)),
      }
    })
  }, [casPoints, existingTpIds])

  const filteredRows = React.useMemo(
    () => rows.filter((r) => casPointMatchesQuery(r.point, search)),
    [rows, search],
  )

  const addableRows = React.useMemo(
    () => filteredRows.filter((r) => !r.alreadyAdded),
    [filteredRows],
  )

  const selectedAddableCount = React.useMemo(() => {
    let n = 0
    for (const r of rows) {
      if (!r.alreadyAdded && selectedKeys.has(r.key)) n++
    }
    return n
  }, [rows, selectedKeys])

  const stats = React.useMemo(() => {
    const total = rows.length
    const added = rows.filter((r) => r.alreadyAdded).length
    return { total, added, toAdd: total - added }
  }, [rows])

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

  const loadEvents = React.useCallback(async () => {
    setEventsLoading(true)
    setEventsError(null)
    try {
      const res = await brandmastApi.fetchEvents()
      if (res.success === false) {
        setEventsError(res.message ?? "Nie udało się pobrać eventów.")
        setEvents([])
        return
      }
      const list = (res.data ?? []).filter((e) => e.id != null)
      setEvents(list)
      if (list.length === 1) {
        setSelectedEventId(list[0]!.id!)
      }
    } catch (e) {
      setEventsError(readApiError(e))
      setEvents([])
    } finally {
      setEventsLoading(false)
    }
  }, [])

  const loadPoints = React.useCallback(async (eventId: number) => {
    setPointsLoading(true)
    setPointsError(null)
    setCasPoints([])
    setSelectedKeys(new Set())
    try {
      const res = await brandmastApi.fetchSVPoints({ idEvent: eventId })
      if (res.success === false) {
        setPointsError(res.message ?? "Nie udało się pobrać sklepów z CAS.")
        return
      }
      setCasPoints(res.data ?? [])
    } catch (e) {
      setPointsError(readApiError(e))
    } finally {
      setPointsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    if (!open) return
    setSearch("")
    setSelectedEventId(null)
    setCasPoints([])
    setPointsError(null)
    setSelectedKeys(new Set())
    void loadEvents()
  }, [open, loadEvents])

  React.useEffect(() => {
    if (!open || selectedEventId == null) return
    void loadPoints(selectedEventId)
  }, [open, selectedEventId, loadPoints])

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

  function selectEvent(eventId: number) {
    if (isSubmitting || eventId === selectedEventId) return
    setSelectedEventId(eventId)
  }

  function togglePoint(key: string, checked: boolean | "indeterminate") {
    if (checked === "indeterminate") return
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      if (checked) next.add(key)
      else next.delete(key)
      return next
    })
  }

  function selectAllAddable() {
    setSelectedKeys(new Set(addableRows.map((r) => r.key)))
  }

  function clearSelection() {
    setSelectedKeys(new Set())
  }

  async function handleConfirm() {
    if (!selectedEvent || selectedAddableCount === 0) {
      toast.error("Zaznacz co najmniej jeden sklep do dodania.")
      return
    }

    const pointsToAdd = rows
      .filter((r) => !r.alreadyAdded && selectedKeys.has(r.key))
      .map((r) => r.point)

    setIsSubmitting(true)
    const toastId = toast.loading(`Dodawanie (${pointsToAdd.length})…`)
    try {
      const result = await addShopsViaApi(selectedEvent, pointsToAdd)
      if (!result.ok) {
        toast.error(result.message ?? "Nie udało się dodać sklepów.", { id: toastId })
        return
      }
      toast.success(
        pointsToAdd.length > 1
          ? `Dodano ${pointsToAdd.length} sklepów.`
          : "Sklep dodany.",
        { id: toastId },
      )
      onOpenChange(false)
      onShopsAdded?.()
    } catch (e) {
      toast.error(readApiError(e), { id: toastId })
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
          entered ? "opacity-100" : "opacity-0",
        )}
        aria-label="Zamknij"
        onClick={() => !isSubmitting && onOpenChange(false)}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-shops-sheet-title"
        className={cn(
          "relative z-61 flex max-h-[min(92dvh,820px)] w-full flex-col rounded-t-2xl border border-border bg-card shadow-[0_-12px_40px_rgba(0,0,0,0.14)] transition-transform duration-300 ease-out motion-reduce:transition-none",
          "sm:mx-auto sm:mb-4 sm:max-h-[min(88vh,720px)] sm:max-w-lg sm:rounded-2xl sm:shadow-xl",
          entered ? "translate-y-0" : "translate-y-full",
        )}
      >
        <div className="flex shrink-0 justify-center pt-3 pb-1 sm:hidden" aria-hidden>
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 sm:px-6 sm:pb-6 sm:pt-4">
          <div className="shrink-0 space-y-1">
            <h2 id="add-shops-sheet-title" className="text-lg font-semibold tracking-tight text-foreground">
              Dodaj sklepy
            </h2>
            <p className="text-sm text-muted-foreground">
              Wybierz event, następnie zaznacz sklepy z CAS, których jeszcze nie ma w zespole.
            </p>
          </div>

          <div className="shrink-0 space-y-2">
            <p className="text-xs font-medium text-foreground">Event</p>
            {eventsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2Icon className="size-4 animate-spin" />
                Ładowanie eventów…
              </div>
            ) : eventsError ? (
              <div className="space-y-2">
                <p className="flex items-start gap-2 text-sm text-destructive">
                  <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
                  {eventsError}
                </p>
                <Button type="button" variant="outline" size="sm" onClick={() => void loadEvents()}>
                  <RefreshCwIcon className="size-3.5" />
                  <span className="ml-1.5">Ponów</span>
                </Button>
              </div>
            ) : events.length === 0 ? (
              <p className="text-sm text-muted-foreground">Brak dostępnych eventów.</p>
            ) : (
              <div
                className="flex max-h-28 flex-col gap-1 overflow-y-auto overscroll-contain rounded-xl border border-border/80 bg-muted/20 p-1"
                role="listbox"
                aria-label="Lista eventów"
              >
                {events.map((ev) => {
                  const active = ev.id === selectedEventId
                  return (
                    <button
                      key={ev.id}
                      type="button"
                      role="option"
                      aria-selected={active}
                      disabled={isSubmitting}
                      onClick={() => selectEvent(ev.id!)}
                      className={cn(
                        "rounded-lg px-3 py-2 text-left text-sm transition-colors",
                        active
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-foreground hover:bg-background/80",
                      )}
                    >
                      <span className="block truncate font-medium">{ev.name?.trim() || "Event bez nazwy"}</span>
                      {ev.ident ? (
                        <span
                          className={cn(
                            "mt-0.5 block truncate font-mono text-[10px]",
                            active ? "text-primary-foreground/80" : "text-muted-foreground",
                          )}
                        >
                          {ev.ident}
                        </span>
                      ) : null}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {selectedEventId != null ? (
            <div className="flex min-h-0 flex-1 flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5 text-[10px]">
                  <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-800 dark:text-emerald-200">
                    Do dodania: {stats.toAdd}
                  </span>
                  <span className="rounded-md border border-border bg-muted/50 px-2 py-0.5 font-medium text-muted-foreground">
                    Już w zespole: {stats.added}
                  </span>
                </div>
                {stats.total > 0 ? (
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      disabled={isSubmitting || addableRows.length === 0}
                      onClick={selectAllAddable}
                    >
                      Wszystkie
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      disabled={isSubmitting || selectedKeys.size === 0}
                      onClick={clearSelection}
                    >
                      Wyczyść
                    </Button>
                  </div>
                ) : null}
              </div>

              <div className="relative shrink-0">
                <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Szukaj sklepu…"
                  className="h-9 pl-8 text-sm"
                  autoComplete="off"
                  disabled={isSubmitting || pointsLoading}
                />
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-xl border border-border/80">
                {pointsLoading ? (
                  <div className="flex items-center justify-center gap-2 px-3 py-8 text-sm text-muted-foreground">
                    <Loader2Icon className="size-4 animate-spin" />
                    Ładowanie sklepów…
                  </div>
                ) : pointsError ? (
                  <div className="space-y-2 p-3">
                    <p className="flex items-start gap-2 text-sm text-destructive">
                      <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
                      {pointsError}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => selectedEventId != null && void loadPoints(selectedEventId)}
                    >
                      <RefreshCwIcon className="size-3.5" />
                      <span className="ml-1.5">Ponów</span>
                    </Button>
                  </div>
                ) : filteredRows.length === 0 ? (
                  <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                    {search.trim() ? "Brak sklepów pasujących do wyszukiwania." : "Brak sklepów dla tego eventu."}
                  </p>
                ) : (
                  <ul className="divide-y divide-border/60">
                    {filteredRows.map((row) => (
                      <CasPointListItem
                        key={row.key}
                        row={row}
                        checked={selectedKeys.has(row.key)}
                        disabled={isSubmitting || row.alreadyAdded}
                        onCheckedChange={(c) => togglePoint(row.key, c)}
                      />
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            !eventsLoading &&
            events.length > 0 && (
              <p className="text-sm text-muted-foreground">Wybierz event, aby zobaczyć sklepy.</p>
            )
          )}

          <div className="mt-auto flex shrink-0 flex-col-reverse gap-2 border-t border-border/60 pt-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => onOpenChange(false)}>
              Anuluj
            </Button>
            <Button
              type="button"
              disabled={
                isSubmitting ||
                selectedEventId == null ||
                pointsLoading ||
                selectedAddableCount === 0
              }
              onClick={() => void handleConfirm()}
            >
              {isSubmitting ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  <span className="ml-2">Dodawanie…</span>
                </>
              ) : (
                <>
                  <PlusIcon className="size-4" />
                  <span className="ml-2">
                    Dodaj wybrane
                    {selectedAddableCount > 0 ? ` (${selectedAddableCount})` : ""}
                  </span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    portalTarget,
  )
}

type CasPointListItemProps = {
  row: CasPointRow
  checked: boolean
  disabled: boolean
  onCheckedChange: (checked: boolean | "indeterminate") => void
}

function CasPointListItem({ row, checked, disabled, onCheckedChange }: CasPointListItemProps) {
  const { point, alreadyAdded } = row
  const title = point.name?.trim() || point.ident?.trim() || "Sklep bez nazwy"
  const address = formatCasPointAddress(point)
  const tpId = point.uuid?.trim()

  return (
    <li>
      <div
        className={cn(
          "flex gap-2.5 px-3 py-2.5 transition-colors",
          alreadyAdded
            ? "bg-muted/40"
            : checked
              ? "bg-primary/5"
              : "bg-background",
        )}
      >
        <div className="pt-0.5">
          {alreadyAdded ? (
            <CheckCircle2Icon
              className="size-5 text-muted-foreground"
              aria-label="Już w zespole"
            />
          ) : (
            <Checkbox
              checked={checked}
              disabled={disabled}
              onCheckedChange={onCheckedChange}
              aria-label={`Dodaj: ${title}`}
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p
              className={cn(
                "min-w-0 truncate text-sm leading-tight font-medium",
                alreadyAdded ? "text-muted-foreground" : "text-foreground",
              )}
            >
              {title}
            </p>
            {alreadyAdded ? (
              <span className="shrink-0 rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                W zespole
              </span>
            ) : (
              <span className="shrink-0 rounded-md border border-emerald-500/35 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-800 dark:text-emerald-200">
                Nowy
              </span>
            )}
          </div>
          {address ? (
            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{address}</p>
          ) : null}
          {tpId ? (
            <p className="mt-0.5 font-mono text-[10px] text-muted-foreground/80">TP: {tpId}</p>
          ) : null}
        </div>
      </div>
    </li>
  )
}
