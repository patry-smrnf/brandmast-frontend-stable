"use client"

import * as React from "react"
import { Suspense } from "react"
import dynamic from "next/dynamic"
import { useRouter, useSearchParams } from "next/navigation"
import { CalendarDaysIcon, CheckIcon, ChevronLeftIcon, MapPinIcon, TimerIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { pl } from "react-day-picker/locale"
import { brandmastApi } from "@/lib/api"
import { cn } from "@/lib/utils"

import { parseIso, startOfDay, toDateKey, toMonthKey } from "../actions/date-utils"
import type { BrandmasterAction } from "../actions/types"
import type { ActionDetails, ShopResponse } from "@/lib/api/generated/types"

import type { EditorShopMapMarker } from "./shops-map"

const EditorShopsMap = dynamic(
  () => import("./shops-map").then((m) => m.EditorShopsMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[220px] h-[min(52dvh,380px)] w-full items-center justify-center rounded-xl border border-border bg-muted text-sm text-muted-foreground sm:h-[min(48vh,420px)]">
        Ładowanie mapy…
      </div>
    ),
  }
)

type Step = 1 | 2 | 3;

function parseActionId(raw: string | null): number | null {
  if (!raw) return null
  const n = Number(raw)
  if (!Number.isFinite(n)) return null
  const i = Math.trunc(n)
  if (i <= 0) return null
  return i
}

function parseEditorMonthToBackendMonth(raw: string | null): string | null {
  const s = (raw ?? "").trim()
  if (!s) return null

  // URL param format requirement: YY-MM (described as YY-MONTH).
  const yy = /^(\d{2})-(\d{2})$/.exec(s)
  if (yy) {
    const mm = Number(yy[2])
    if (mm < 1 || mm > 12) return null
    return `20${yy[1]}-${yy[2]}`
  }

  // Allow direct backend format too (YYYY-MM).
  const yyyy = /^(\d{4})-(\d{2})$/.exec(s)
  if (yyyy) {
    const mm = Number(yyyy[2])
    if (mm < 1 || mm > 12) return null
    return `${yyyy[1]}-${yyyy[2]}`
  }

  return null
}

/** Query `day` for new actions only: `YYYY-MM-DD` (same as `toDateKey`). Not sent to the API. */
function parseEditorDayParam(raw: string | null): Date | null {
  const s = (raw ?? "").trim()
  if (!s) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null
  const dt = new Date(y, mo - 1, d)
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null
  return dt
}

function createInitialSelectedDates(searchParams: { get: (k: string) => string | null }) {
  if (parseActionId(searchParams.get("idAction")) != null) {
    return [new Date()] as Date[]
  }
  const fromDay = parseEditorDayParam(searchParams.get("day"))
  return fromDay ? [startOfDay(fromDay)] : [new Date()]
}

function normalizeTime(raw: string): { ok: true; value: string } | { ok: false; reason: string } {
  const t = raw.trim()
  if (!t) return { ok: false, reason: "Godzina jest wymagana." }

  // Same hour only (1–2 digits): treat as HH:00:00
  const hourOnly = /^(\d{1,2})$/.exec(t)
  if (hourOnly) {
    const hh = Number(hourOnly[1])
    if (hh < 0 || hh > 23) return { ok: false, reason: "Godzina musi być 00–23." }
    return {
      ok: true,
      value: `${String(hh).padStart(2, "0")}:00:00`,
    }
  }

  const m =
    /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(t) ??
    /^(\d{1,2})\.(\d{2})(?:\.(\d{2}))?$/.exec(t) // fallback for mobile keyboards
  if (!m) return { ok: false, reason: "Użyj formatu HH, HH:MM lub HH:MM:SS." }

  const hh = Number(m[1])
  const mm = Number(m[2])
  const ss = Number(m[3] ?? "0")
  if (hh < 0 || hh > 23) return { ok: false, reason: "Godzina musi być 00–23." }
  if (mm < 0 || mm > 59) return { ok: false, reason: "Minuty muszą być 00–59." }
  if (ss < 0 || ss > 59) return { ok: false, reason: "Sekundy muszą być 00–59." }

  const value = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(
    2,
    "0"
  )}`
  return { ok: true, value }
}

function combineDateTimeToIso(date: Date, timeHHMMSS: string) {
  const [h, m, s] = timeHHMMSS.split(":").map((x) => Number(x))
  const d = new Date(date)
  d.setHours(h ?? 0, m ?? 0, s ?? 0, 0)
  return d.toISOString()
}

function formatDatePL(d: Date) {
  return new Intl.DateTimeFormat("pl-PL", { weekday: "short", day: "2-digit", month: "long" }).format(d)
}

function getShopAddress(s: ShopResponse) {
  return s.location?.address ?? ""
}

function getShopEventName(s: ShopResponse) {
  return s.event?.name ?? ""
}

function buildShopLabel(s: ShopResponse) {
  const address = getShopAddress(s)
  const name = s.name ?? ""
  const eventName = getShopEventName(s)

  // address • name • eventName (skip empties)
  return [address, eventName].filter(Boolean).join(" • ")
}

function shopMatchesQuery(s: ShopResponse, q: string) {
  const query = q.trim().toLowerCase()
  if (!query) return true
  const hay = [
    s.name ?? "",
    getShopEventName(s),
    getShopAddress(s),
    // also allow searching by "event + name" combos
    `${s.name ?? ""} ${getShopEventName(s)}`.trim(),
  ]
    .join(" | ")
    .toLowerCase()
  return hay.includes(query)
}

function parseGeoNumber(raw: string | undefined | null): number | null {
  if (raw == null) return null
  const s = String(raw).trim()
  if (!s) return null
  const n = Number(s.replace(",", "."))
  return Number.isFinite(n) ? n : null
}

function buildShopMapMarkersAndStats(shops: ShopResponse[]): {
  markers: EditorShopMapMarker[]
  stats: {
    total: number
    onMap: number
    missingOrInvalid: number
    zeroZero: number
    notOnMap: number
  }
} {
  const markers: EditorShopMapMarker[] = []
  let missingOrInvalid = 0
  let zeroZero = 0

  for (const s of shops) {
    const id = s.id ?? 0
    const lat = parseGeoNumber(s.location?.geoLat)
    const lng = parseGeoNumber(s.location?.geoLng)

    if (lat == null || lng == null) {
      missingOrInvalid++
      continue
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      missingOrInvalid++
      continue
    }
    if (Math.abs(lat) < 1e-6 && Math.abs(lng) < 1e-6) {
      zeroZero++
      continue
    }

    markers.push({ id, lat, lng, label: buildShopLabel(s) })
  }

  return {
    markers,
    stats: {
      total: shops.length,
      onMap: markers.length,
      missingOrInvalid,
      zeroZero,
      notOnMap: missingOrInvalid + zeroZero,
    },
  }
}

async function fetchActionsForEditor(month: string | null) {
  // If month is known, always fetch that month (so editor finds the action reliably).
  if (month) {
    const res = await brandmastApi.fetchBmActions({ month })
    return res.data?.actions ?? []
  }

  // Prefer no-month fetch (backend may return all); fallback to current month if needed.
  try {
    const res = await brandmastApi.fetchBmActions()
    return res.data?.actions ?? []
  } catch {
    const m = toMonthKey(new Date())
    const res = await brandmastApi.fetchBmActions({ month: m })
    return res.data?.actions ?? []
  }
}

function coerceAction(a: ActionDetails | undefined): BrandmasterAction | null {
  if (!a) return null
  return {
    idAction: a.idAction ?? 0,
    status: (a.status === "ACCEPTED" || a.status === "PENDING" || a.status === "REJECTED"
      ? a.status
      : "PENDING") as BrandmasterAction["status"],
    since: a.since ?? "",
    until: a.until ?? "",
    createdAt: a.createdAt ?? "",
    updatedAt: a.updatedAt ?? "",
    shop: {
      idShop: a.shop?.idShop ?? 0,
      name: a.shop?.name ?? "",
      address: a.shop?.address ?? "",
      geoLat: a.shop?.geoLat ?? null,
      geoLng: a.shop?.geoLng ?? null,
      tpShopId: a.shop?.tpShopId ?? "",
      tpIdent: a.shop?.tpIdent ?? "",
    },
    event: {
      idEvent: a.event?.idEvent ?? 0,
      name: a.event?.name ?? "",
      tpEventId: a.event?.tpEventId ?? "",
    },
  }
}

export default function BrandmasterEditorPage() {
  return (
    <Suspense fallback={<div className="flex flex-1 items-center justify-center">Ładowanie…</div>}>
      <BrandmasterEditorInner />
    </Suspense>
  )
}

function BrandmasterEditorInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const idAction = React.useMemo(() => parseActionId(searchParams.get("idAction")), [searchParams])
  const backendMonth = React.useMemo(
    () => parseEditorMonthToBackendMonth(searchParams.get("month")),
    [searchParams]
  )
  const isEditMode = idAction !== null

  const [isMounted, setIsMounted] = React.useState(false)
  React.useEffect(() => {
    const t = setTimeout(() => setIsMounted(true), 0)
    return () => clearTimeout(t)
  }, [])

  const [step, setStep] = React.useState<Step>(1)

  const [startTime, setStartTime] = React.useState("")
  const [endTime, setEndTime] = React.useState("")

  const [allowMultiDates, setAllowMultiDates] = React.useState(false)
  const [selectedDates, setSelectedDates] = React.useState<Date[]>(() => createInitialSelectedDates(searchParams))

  const [shopQuery, setShopQuery] = React.useState("")
  const [shops, setShops] = React.useState<ShopResponse[]>([])
  const [shopsLoading, setShopsLoading] = React.useState(false)
  const [selectedShop, setSelectedShop] = React.useState<ShopResponse | null>(null)
  const [showShopSuggestions, setShowShopSuggestions] = React.useState(false)
  const hideShopSuggestionsTimeoutRef = React.useRef<number | null>(null)

  const [editingAction, setEditingAction] = React.useState<BrandmasterAction | null>(null)
  const [loadingEditData, setLoadingEditData] = React.useState(false)

  const startNorm = React.useMemo(() => normalizeTime(startTime), [startTime])
  const endNorm = React.useMemo(() => normalizeTime(endTime), [endTime])

  const canGoNextStep1 = React.useMemo(() => {
    if (!startNorm.ok || !endNorm.ok) return false
    if (!selectedDates.length) return false
    return true
  }, [startNorm.ok, endNorm.ok, selectedDates.length])

  const canGoNextStep2 = React.useMemo(() => {
    return !!selectedShop
  }, [selectedShop])

  const isMultiDatesEffective = allowMultiDates && !isEditMode

  // Avoid SSR/CSR attribute mismatch (e.g. `disabled`) by stabilizing the
  // first client render to match server HTML, then enabling interactivity post-mount.
  const nextDisabledStep1 = !isMounted ? false : !canGoNextStep1
  const nextDisabledStep2 = !isMounted ? false : !canGoNextStep2

  React.useEffect(() => {
    if (!isEditMode) return
    if (!idAction) return

    let cancelled = false
    async function run() {
      setLoadingEditData(true)
      try {
        const actions = await fetchActionsForEditor(backendMonth)
        if (cancelled) return

        const found = actions.find((a) => (a.idAction ?? 0) === idAction)
        const coerced = coerceAction(found)
        if (!coerced) {
          toast.error("Nie znaleziono akcji do edycji.")
          return
        }

        setEditingAction(coerced)
        setAllowMultiDates(false)

        const since = parseIso(coerced.since)
        const until = parseIso(coerced.until)
        if (since) {
          setSelectedDates([since])
          const hh = String(since.getHours()).padStart(2, "0")
          const mm = String(since.getMinutes()).padStart(2, "0")
          const ss = String(since.getSeconds()).padStart(2, "0")
          setStartTime(`${hh}:${mm}:${ss}`)
        }
        if (until) {
          const hh = String(until.getHours()).padStart(2, "0")
          const mm = String(until.getMinutes()).padStart(2, "0")
          const ss = String(until.getSeconds()).padStart(2, "0")
          setEndTime(`${hh}:${mm}:${ss}`)
        }

        // Pre-fill location from action response (address + idShop) even before shops list loads.
        if (coerced.shop.idShop) {
          const prefilledShop: ShopResponse = {
            id: coerced.shop.idShop,
            name: coerced.shop.name,
            location: { address: coerced.shop.address },
            event: { name: coerced.event.name },
          }
          setSelectedShop(prefilledShop)
          setShopQuery(buildShopLabel(prefilledShop))
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Nie udało się pobrać akcji.")
      } finally {
        if (cancelled) return
        setLoadingEditData(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [idAction, isEditMode, backendMonth])

  React.useEffect(() => {
    if (step !== 2) return
    if (shops.length) return

    let cancelled = false
    async function run() {
      setShopsLoading(true)
      try {
        const res = await brandmastApi.fetchShops()
        if (cancelled) return
        setShops(res.data ?? [])

        // If we are in edit mode, try to match selected shop with the fetched list (so we have full fields).
        if (selectedShop?.id) {
          const matched = (res.data ?? []).find((s) => (s.id ?? 0) === (selectedShop.id ?? 0))
          if (matched) setSelectedShop(matched)
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Nie udało się pobrać listy lokalizacji.")
      } finally {
        if (cancelled) return
        setShopsLoading(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [step, shops.length, selectedShop?.id])

  const filteredShops = React.useMemo(() => {
    const list = shops.filter((s) => shopMatchesQuery(s, shopQuery))
    // stable-ish ordering: exact matches first, then by address/name
    const q = shopQuery.trim().toLowerCase()
    if (!q) return list.slice(0, 30)

    return list
      .map((s) => {
        const label = buildShopLabel(s).toLowerCase()
        const score =
          label.startsWith(q) ? 0 : label.includes(` ${q}`) ? 1 : label.includes(q) ? 2 : 3
        return { s, score, label }
      })
      .sort((a, b) => a.score - b.score || a.label.localeCompare(b.label, "pl"))
      .slice(0, 30)
      .map((x) => x.s)
  }, [shops, shopQuery])

  const shopMapBundle = React.useMemo(() => buildShopMapMarkersAndStats(shops), [shops])

  const onShopMapMarkerSelect = React.useCallback(
    (id: number) => {
      const s = shops.find((x) => (x.id ?? 0) === id)
      if (!s) return
      setSelectedShop(s)
      setShopQuery(buildShopLabel(s))
      setShowShopSuggestions(false)
    },
    [shops]
  )

  function goBack() {
    if (step === 1) {
      router.back()
      return
    }
    setStep((s) => (s === 1 ? 1 : ((s - 1) as Step)))
  }

  function stepTitle(s: Step) {
    if (s === 1) return "Wybierz datę"
    if (s === 2) return "Wybierz lokalizację"
    return "Podsumowanie"
  }

  async function onSubmit() {
    const n1 = normalizeTime(startTime)
    const n2 = normalizeTime(endTime)
    if (!n1.ok) return toast.error(n1.reason)
    if (!n2.ok) return toast.error(n2.reason)
    if (!selectedShop?.id) return toast.error("Wybierz lokalizację.")
    if (!selectedDates.length) return toast.error("Wybierz co najmniej jedną datę.")

    const uniqueDates = Array.from(
      new Map(selectedDates.map((d) => [toDateKey(d), d] as const)).values()
    ).sort((a, b) => a.getTime() - b.getTime())

    const sinceByDate = uniqueDates.map((d) => combineDateTimeToIso(d, n1.value))
    const untilByDate = uniqueDates.map((d) => combineDateTimeToIso(d, n2.value))

    const isEditing = isEditMode && editingAction?.idAction

    toast.loading(isEditing ? "Zapisywanie zmian…" : "Tworzenie akcji…", { id: "bm-editor-submit" })

    try {
      if (isEditing) {
        await brandmastApi.updateAction({
          idAction: editingAction!.idAction,
          idShop: Number(selectedShop.id),
          since: sinceByDate[0],
          until: untilByDate[0],
          status: editingAction!.status,
        })
      } else {
        // Create N actions (one per date).
        await Promise.all(
          sinceByDate.map((since, idx) =>
            brandmastApi.addBMAction({
              idShop: Number(selectedShop.id),
              since,
              until: untilByDate[idx],
            })
          )
        )
      }

      toast.success(isEditing ? "Zapisano zmiany." : "Utworzono akcję/akcje.", {
        id: "bm-editor-submit",
      })
      router.push("/brandmaster/actions")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Nie udało się zapisać.", {
        id: "bm-editor-submit",
      })
    }
  }

  return (
    <main className="flex flex-1 flex-col bg-background pb-24">
      <div className="mx-auto w-full max-w-5xl px-4 py-6">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">
              {isEditMode ? (
                <span className="inline-flex items-center gap-2">
                  <span className="rounded-full bg-accent px-2 py-0.5 font-medium text-foreground">
                    Edycja
                  </span>
                  <span className="tabular-nums">idAction: {idAction}</span>
                </span>
              ) : (
                <span className="rounded-full bg-accent px-2 py-0.5 font-medium text-foreground">
                  Nowa akcja
                </span>
              )}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="text-lg font-semibold tracking-tight">{stepTitle(step)}</div>
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              Krok <span className="tabular-nums">{step}</span> / 3
              {loadingEditData ? <span className="ml-2">• Ładowanie danych…</span> : null}
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={goBack}>
            <ChevronLeftIcon className="size-3.5" />
            Wstecz
          </Button>
        </header>

        <Separator className="my-5" />

        {step === 1 ? (
          <Card className="overflow-hidden">
            <CardHeader className="space-y-1">
              <CardTitle className="inline-flex items-center gap-2">
                <CalendarDaysIcon className="size-5 text-muted-foreground" />
                Data i godziny
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="startTime">Rozpoczęcie</Label>
                  <div className="relative">
                    <TimerIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="startTime"
                      type="text"
                      autoComplete="off"
                      spellCheck={false}
                      placeholder="np. 8 lub 8:30"
                      className="pl-10"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>
                  {startTime ? (
                    <div className="text-xs text-muted-foreground">
                      {startNorm.ok ? `Zapiszę jako: ${startNorm.value}` : startNorm.reason}
                    </div>
                  ) : null}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="endTime">Koniec</Label>
                  <div className="relative">
                    <TimerIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="endTime"
                      type="text"
                      autoComplete="off"
                      spellCheck={false}
                      placeholder="np. 18 lub 18:45"
                      className="pl-10"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                  {endTime ? (
                    <div className="text-xs text-muted-foreground">
                      {endNorm.ok ? `Zapiszę jako: ${endNorm.value}` : endNorm.reason}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-medium">Wybierz datę</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {isMultiDatesEffective
                      ? "Tryb multi: możesz wybrać kilka dni."
                      : "Tryb single: wybierasz jeden dzień."}
                  </div>
                </div>

                <label
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm",
                    isEditMode ? "opacity-60" : null
                  )}
                >
                  <Checkbox
                    checked={allowMultiDates}
                    disabled={isEditMode}
                    onCheckedChange={(v: boolean | "indeterminate") => setAllowMultiDates(Boolean(v))}
                  />
                  Wybierz wiele dat
                </label>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="rounded-xl border border-border bg-card p-2 shadow-sm">
                  <div className="flex justify-center">
                    {isMultiDatesEffective ? (
                      <Calendar
                        mode="multiple"
                        locale={pl}
                        weekStartsOn={1}
                        defaultMonth={selectedDates[0] ?? new Date()}
                        selected={selectedDates}
                        onSelect={(val) => setSelectedDates(val ?? [])}
                      />
                    ) : (
                      <Calendar
                        mode="single"
                        locale={pl}
                        weekStartsOn={1}
                        defaultMonth={selectedDates[0] ?? new Date()}
                        selected={selectedDates[0]}
                        onSelect={(val) => setSelectedDates(val ? [val] : [])}
                      />
                    )}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                    <div className="text-sm font-medium">Wybrane daty</div>
                    <div className="mt-2 space-y-2">
                      {selectedDates.length ? (
                        selectedDates
                          .slice()
                          .sort((a, b) => a.getTime() - b.getTime())
                          .slice(0, 6)
                          .map((d) => (
                            <div
                              key={toDateKey(d)}
                              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2"
                            >
                              <div className="min-w-0 truncate text-sm">{formatDatePL(d)}</div>
                              <div className="text-xs text-muted-foreground tabular-nums">
                                {toDateKey(d)}
                              </div>
                            </div>
                          ))
                      ) : (
                        <div className="text-sm text-muted-foreground">Nie wybrano daty.</div>
                      )}
                      {selectedDates.length > 6 ? (
                        <div className="text-xs text-muted-foreground">
                          +{selectedDates.length - 6} kolejne…
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <Button
                  className="shadow-sm"
                  disabled={nextDisabledStep1}
                  onClick={() => setStep(2)}
                >
                  Dalej
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : step === 2 ? (
          <Card className="overflow-visible">
            <CardHeader className="space-y-1">
              <CardTitle className="inline-flex items-center gap-2">
                <MapPinIcon className="size-5 text-muted-foreground" />
                Lokalizacja
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative z-0 isolate space-y-2">

                {!shopsLoading && shopMapBundle.stats.total > 0 ? (
                  <div className="flex flex-col gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
                    <div className="tabular-nums">
                      <span className="font-medium text-foreground">Na mapie:</span>{" "}
                      {shopMapBundle.stats.onMap}
                      <span className="text-muted-foreground"> / {shopMapBundle.stats.total}</span>
                    </div>
                    <div className="tabular-nums sm:text-right">
                      <span className="font-medium text-foreground">Poza mapą</span>{" "}
                      <span className="text-muted-foreground">(brak danych lub 0,0):</span>{" "}
                      {shopMapBundle.stats.notOnMap}
                    </div>
                    {shopMapBundle.stats.notOnMap > 0 ? (
                      <div className="w-full border-t border-border pt-2 text-[11px] sm:border-t-0 sm:border-l sm:pl-3 sm:pt-0">
                        <span className="text-muted-foreground">Rozkład:</span> brak / błąd:{" "}
                        {shopMapBundle.stats.missingOrInvalid}
                        <span className="mx-1.5 text-border">·</span>
                        współrzędne 0,0: {shopMapBundle.stats.zeroZero}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {!shopsLoading && shopMapBundle.stats.total === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Brak sklepów z serwera — mapa pokazuje domyślny widok (Polska), punkty pojawią się po
                    załadowaniu listy.
                  </p>
                ) : null}

                <EditorShopsMap
                  markers={shopMapBundle.markers}
                  selectedShopId={selectedShop?.id ?? null}
                  onMarkerSelect={onShopMapMarkerSelect}
                  isLoading={shopsLoading}
                />
              </div>

              <div className="relative z-30 space-y-2">
                <Label htmlFor="shopQuery">Adres / nazwa / event</Label>
                <div className="relative">
                  <Input
                    id="shopQuery"
                    placeholder={shopsLoading ? "Ładowanie lokalizacji…" : "Zacznij pisać…"}
                    value={shopQuery}
                    onFocus={() => {
                      if (hideShopSuggestionsTimeoutRef.current) {
                        window.clearTimeout(hideShopSuggestionsTimeoutRef.current)
                        hideShopSuggestionsTimeoutRef.current = null
                      }
                      setShowShopSuggestions(true)
                    }}
                    onBlur={() => {
                      // Delay so clicking a suggestion doesn't immediately close the list before onClick.
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
                      className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-lg"
                      onMouseDown={(e) => {
                        // Keep focus while interacting with the panel
                        e.preventDefault()
                      }}
                    >
                      <div className="flex items-center justify-between gap-3 px-3 py-2 text-xs text-muted-foreground">
                        <span>Sugestie</span>
                        <span>{shopsLoading ? "Ładowanie…" : `${filteredShops.length} wyników`}</span>
                      </div>
                      <div className="max-h-[320px] overflow-auto p-2">
                        {shopsLoading ? (
                          <div className="rounded-lg border border-border bg-card p-3 text-sm text-muted-foreground">
                            Ładowanie…
                          </div>
                        ) : filteredShops.length ? (
                          <div className="space-y-2">
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
                                    "w-full rounded-xl border border-border bg-card px-3 py-2 text-left shadow-sm transition-colors hover:bg-muted",
                                    isSelected ? "border-accent bg-accent/70" : null
                                  )}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <div className="truncate text-sm font-medium">{buildShopLabel(s)}</div>
                                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                        {s.name ? <span>name: {s.name}</span> : null}
                                        {getShopEventName(s) ? (
                                          <span>Event: {getShopEventName(s)}</span>
                                        ) : null}
                                      </div>
                                    </div>
                                    <div className="shrink-0 text-xs text-muted-foreground tabular-nums">
                                      {s.id ?? "—"}
                                    </div>
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        ) : (
                          <div className="rounded-lg border border-border bg-card p-3 text-sm text-muted-foreground">
                            Brak wyników.
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              {selectedShop ? (
                <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <div className="text-xs text-muted-foreground">Wybrano</div>
                  <div className="mt-1 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{buildShopLabel(selectedShop)}</div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setSelectedShop(null)}>
                      Zmień
                    </Button>
                  </div>
                </div>
              ) : null}

              {/* Suggestions are shown while editing the field (focus) */}

              <div className="flex items-center justify-end gap-3">
                <Button
                  className="shadow-sm"
                  disabled={nextDisabledStep2}
                  onClick={() => setStep(3)}
                >
                  Dalej
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <CardHeader className="space-y-1">
              <CardTitle className="inline-flex items-center gap-2">
                <CheckIcon className="size-5 text-muted-foreground" />
                Podsumowanie
              </CardTitle>
              <CardDescription>Sprawdź dane przed {isEditMode ? "zapisem" : "utworzeniem"}.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 gap-3">
                <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <div className="text-xs text-muted-foreground">Daty</div>
                  <div className="mt-2 space-y-2">
                    {selectedDates
                      .slice()
                      .sort((a, b) => a.getTime() - b.getTime())
                      .map((d) => (
                        <div
                          key={toDateKey(d)}
                          className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2"
                        >
                          <div className="min-w-0 truncate text-sm">{formatDatePL(d)}</div>
                          <div className="text-xs text-muted-foreground tabular-nums">
                            {toDateKey(d)}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <div className="text-xs text-muted-foreground">Godziny</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                    <span className="rounded-lg border border-border bg-background px-3 py-2 tabular-nums">
                      {startNorm.ok ? startNorm.value : startTime}
                    </span>
                    <span className="text-muted-foreground">→</span>
                    <span className="rounded-lg border border-border bg-background px-3 py-2 tabular-nums">
                      {endNorm.ok ? endNorm.value : endTime}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <div className="text-xs text-muted-foreground">Sklep</div>
                  <div className="mt-2">
                    {selectedShop ? (
                      <>
                        <div className="text-sm font-medium">{buildShopLabel(selectedShop)}</div>
                        <div className="mt-1 text-xs text-muted-foreground tabular-nums">
                          idShop: {selectedShop.id ?? "—"}
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-muted-foreground">Nie wybrano.</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <Button className="shadow-sm" onClick={onSubmit}>
                  {isEditMode ? "Zapisz" : "Stwórz"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}