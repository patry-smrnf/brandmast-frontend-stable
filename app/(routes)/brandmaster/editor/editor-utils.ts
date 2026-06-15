import { brandmastApi } from "@/lib/api"
import type { ActionDetails, ShopResponse } from "@/lib/api/generated/types"
import { normalizeActionStatus } from "@/lib/action-status"

import { startOfDay, toMonthKey } from "@/lib/dates/date-utils"
import type { BrandmasterAction } from "../actions/types"

import type { EditorShopMapMarker } from "./shops-map"

export type EditorStep = 1 | 2 | 3

export function parseActionId(raw: string | null): number | null {
  if (!raw) return null
  const n = Number(raw)
  if (!Number.isFinite(n)) return null
  const i = Math.trunc(n)
  if (i <= 0) return null
  return i
}

export function parseEditorMonthToBackendMonth(raw: string | null): string | null {
  const s = (raw ?? "").trim()
  if (!s) return null

  const yy = /^(\d{2})-(\d{2})$/.exec(s)
  if (yy) {
    const mm = Number(yy[2])
    if (mm < 1 || mm > 12) return null
    return `20${yy[1]}-${yy[2]}`
  }

  const yyyy = /^(\d{4})-(\d{2})$/.exec(s)
  if (yyyy) {
    const mm = Number(yyyy[2])
    if (mm < 1 || mm > 12) return null
    return `${yyyy[1]}-${yyyy[2]}`
  }

  return null
}

/** Query `day` for new actions only: `YYYY-MM-DD`. Not sent to the API. */
export function parseEditorDayParam(raw: string | null): Date | null {
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

export function createInitialSelectedDates(searchParams: { get: (k: string) => string | null }) {
  if (parseActionId(searchParams.get("idAction")) != null) {
    return [new Date()] as Date[]
  }
  const fromDay = parseEditorDayParam(searchParams.get("day"))
  return fromDay ? [startOfDay(fromDay)] : [new Date()]
}

export function resolveInitialCalendarMonth(searchParams: { get: (k: string) => string | null }) {
  const monthFromUrl = parseEditorMonthToBackendMonth(searchParams.get("month"))
  if (monthFromUrl) {
    const [y, m] = monthFromUrl.split("-").map(Number)
    return new Date(y, m - 1, 1)
  }
  const initial = createInitialSelectedDates(searchParams)
  const d = initial[0] ?? new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

export function normalizeTime(raw: string): { ok: true; value: string } | { ok: false; reason: string } {
  const t = raw.trim()
  if (!t) return { ok: false, reason: "Godzina jest wymagana." }

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
    /^(\d{1,2})\.(\d{2})(?:\.(\d{2}))?$/.exec(t)
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

export function combineDateTimeToIso(date: Date, timeHHMMSS: string) {
  const [h, m, s] = timeHHMMSS.split(":").map((x) => Number(x))
  const d = new Date(date)
  d.setHours(h ?? 0, m ?? 0, s ?? 0, 0)
  return d.toISOString()
}

export function formatDatePL(d: Date) {
  return new Intl.DateTimeFormat("pl-PL", { weekday: "short", day: "2-digit", month: "long" }).format(d)
}

export function getShopAddress(s: ShopResponse) {
  return s.location?.address ?? ""
}

export function getShopEventName(s: ShopResponse) {
  return s.event?.name ?? ""
}

export function getShopEventId(s: ShopResponse) {
  return s.event?.id ?? 0
}

export type ShopEventFilterOption = {
  id: number
  name: string
  count: number
}

export function buildShopEventFilterOptions(shops: ShopResponse[]): ShopEventFilterOption[] {
  const byId = new Map<number, { name: string; count: number }>()

  for (const s of shops) {
    const id = getShopEventId(s)
    if (!id) continue
    const name = getShopEventName(s).trim() || `Event #${id}`
    const prev = byId.get(id)
    if (prev) {
      prev.count++
    } else {
      byId.set(id, { name, count: 1 })
    }
  }

  return Array.from(byId.entries())
    .map(([id, { name, count }]) => ({ id, name, count }))
    .sort((a, b) => a.name.localeCompare(b.name, "pl"))
}

export function filterShopsByEventId(shops: ShopResponse[], eventId: number | null) {
  if (eventId == null) return shops
  return shops.filter((s) => getShopEventId(s) === eventId)
}

export function buildShopLabel(s: ShopResponse) {
  const address = getShopAddress(s)
  const eventName = getShopEventName(s)
  return [address, eventName].filter(Boolean).join(" • ")
}

export function shopMatchesQuery(s: ShopResponse, q: string) {
  const query = q.trim().toLowerCase()
  if (!query) return true
  const hay = [
    s.name ?? "",
    getShopEventName(s),
    getShopAddress(s),
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

export function buildShopMapMarkersAndStats(shops: ShopResponse[]): {
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

export async function fetchActionsForEditor(month: string | null) {
  if (month) {
    const res = await brandmastApi.fetchBmActions({ month })
    return res.data?.actions ?? []
  }

  try {
    const res = await brandmastApi.fetchBmActions()
    return res.data?.actions ?? []
  } catch {
    const m = toMonthKey(new Date())
    const res = await brandmastApi.fetchBmActions({ month: m })
    return res.data?.actions ?? []
  }
}

export function coerceAction(a: ActionDetails | undefined): BrandmasterAction | null {
  if (!a) return null
  return {
    idAction: a.idAction ?? 0,
    status: normalizeActionStatus(a.status),
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
