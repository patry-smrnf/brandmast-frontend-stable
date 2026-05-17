import { formatPlDatePoland, formatTime, parseIso, toDateKey } from "@/lib/dates/date-utils"
import type {
  CasAddressCreate,
  CasDatetimeBlock,
  TourPlannerActionListItem,
} from "@/lib/api"

export type ActionWithRoundedTime = {
  action: TourPlannerActionListItem
  start: Date | null
  stop: Date | null
  roundedHours: number
  dateLabel: string
  startLabel: string
  stopLabel: string
  addressLabel: string
  shopName: string
  actionName: string | null
  actionIdent: string | null
}

export function getMonthDateRange(reference: Date) {
  const y = reference.getFullYear()
  const m = reference.getMonth()
  const since = toDateKey(new Date(y, m, 1))
  const until = toDateKey(new Date(y, m + 1, 0))
  return { since, until }
}

export function parseCasDatetime(block?: CasDatetimeBlock): Date | null {
  const raw = block?.date?.trim()
  if (!raw) return null
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? null : d
}

export function formatCasAddress(address?: CasAddressCreate): string {
  if (!address) return "—"
  const street = [address.streetAddress, address.streetNumber].filter(Boolean).join(" ")
  const city = [address.postalCode, address.cityName].filter(Boolean).join(" ")
  return [street, city].filter(Boolean).join(", ") || "—"
}

export function formatCasTime(block?: CasDatetimeBlock): string {
  const d = parseCasDatetime(block)
  if (!d) return "—"
  return formatTime(d)
}

/** Zaokrąglenie do najbliższej 0,5 h, minimum 1 h (np. 48 min → 1 h, 1h20 → 1,5 h). */
export function roundActionDurationHours(start: Date, stop: Date): number {
  const ms = stop.getTime() - start.getTime()
  if (ms <= 0) return 0
  const hours = ms / 3_600_000
  const nearestHalf = Math.round(hours * 2) / 2
  return Math.max(1, nearestHalf)
}

export function formatHoursPl(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) return "0 h"
  const rounded = Math.round(hours * 10) / 10
  const n = Number.isInteger(rounded) ? String(rounded) : String(rounded).replace(".", ",")
  return `${n} h`
}

export function formatMoneyPl(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return "0 zł"
  return `${Math.round(amount).toLocaleString("pl-PL")} zł`
}

export function mapFinishedActionsWithRoundedTime(
  items: TourPlannerActionListItem[],
): ActionWithRoundedTime[] {
  const mapped: ActionWithRoundedTime[] = []

  for (const action of items) {
    const start = parseCasDatetime(action.history?.start)
    const stop = parseCasDatetime(action.history?.stop)
    if (!start || !stop) continue

    const roundedHours = roundActionDurationHours(start, stop)
    if (roundedHours <= 0) continue

    mapped.push({
      action,
      start,
      stop,
      roundedHours,
      dateLabel: formatPlDatePoland(start),
      startLabel: formatCasTime(action.history?.start),
      stopLabel: formatCasTime(action.history?.stop),
      addressLabel: formatCasAddress(action.point?.address),
      shopName: action.point?.name?.trim() || "—",
      actionName: action.name?.trim() || null,
      actionIdent: action.ident?.trim() || null,
    })
  }

  mapped.sort((a, b) => (b.start?.getTime() ?? 0) - (a.start?.getTime() ?? 0))
  return mapped
}

/** Fallback gdy brak history — since/until z poziomu akcji. */
export function parseActionFallbackStart(item: TourPlannerActionListItem): Date | null {
  return parseCasDatetime(item.history?.start) ?? (item.since ? parseIso(item.since) : null)
}

export function getCasActionTitle(item: TourPlannerActionListItem): string {
  return item.name?.trim() || item.event?.name?.trim() || item.ident?.trim() || "Akcja w toku"
}
