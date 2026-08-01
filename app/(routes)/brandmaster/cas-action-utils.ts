import {
  formatPlDatePoland,
  formatTimePoland,
  parseIso,
  parseWallClockInTimeZone,
  POLAND_TIMEZONE,
  toDateKey,
} from "@/lib/dates/date-utils"
import type {
  CasAddressCreate,
  CasDatetimeBlock,
  SampleStatsFieldCounts,
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

export function getPreviousMonthDateRange(reference: Date) {
  const y = reference.getFullYear()
  const m = reference.getMonth()
  const since = toDateKey(new Date(y, m - 1, 1))
  const until = toDateKey(new Date(y, m, 0))
  return { since, until }
}

const HAS_OFFSET_RE = /([Zz]|[+-]\d{2}(?::?\d{2})?)$/

export function parseCasDatetime(block?: CasDatetimeBlock): Date | null {
  const raw = block?.date?.trim()
  if (!raw) return null

  if (HAS_OFFSET_RE.test(raw)) {
    const d = new Date(raw)
    return Number.isNaN(d.getTime()) ? null : d
  }

  const tz = block?.timezone?.trim() || POLAND_TIMEZONE
  const wallClock = parseWallClockInTimeZone(raw, tz)
  if (wallClock) return wallClock

  const normalized = raw.includes("T") ? raw : raw.replace(" ", "T")
  const d = new Date(normalized)
  return Number.isNaN(d.getTime()) ? null : d
}

export function formatCasAddress(address?: CasAddressCreate): string {
  if (!address) return "-"
  const street = [address.streetAddress, address.streetNumber].filter(Boolean).join(" ")
  const city = [address.postalCode, address.cityName].filter(Boolean).join(" ")
  return [street, city].filter(Boolean).join(", ") || "-"
}

export function formatCasTime(block?: CasDatetimeBlock): string {
  const d = parseCasDatetime(block)
  if (!d) return "-"
  return formatTimePoland(d)
}

/** Dopłata za niepełną godzinę (minuty ponad pełne godziny). */
const PARTIAL_HOUR_NO_EXTRA_MAX_MINUTES = 14
const PARTIAL_HOUR_HALF_EXTRA_MAX_MINUTES = 44

/**
 * Godziny rozliczeniowe: pełne godziny + niepełna końcówka w krokach co 15 min (0 / 30 / 60 min).
 * Np. 1 h 46 min → 2 h, 2 h 14 min → 2 h, 2 h 28 min → 2,5 h, 2 h 59 min lub 3 h → 3 h.
 */
/** Rzeczywisty czas trwania akcji w godzinach (bez zaokrąglenia rozliczeniowego). */
export function getActionDurationHours(start: Date, stop: Date): number {
  const ms = stop.getTime() - start.getTime()
  if (ms <= 0) return 0
  return ms / 3_600_000
}

export function roundActionDurationHours(start: Date, stop: Date): number {
  const ms = stop.getTime() - start.getTime()
  if (ms <= 0) return 0

  const totalMinutes = Math.floor(ms / 60_000)
  const fullHours = Math.floor(totalMinutes / 60)
  const partialMinutes = totalMinutes % 60

  let billedMinutes = fullHours * 60
  if (partialMinutes > PARTIAL_HOUR_NO_EXTRA_MAX_MINUTES) {
    if (partialMinutes <= PARTIAL_HOUR_HALF_EXTRA_MAX_MINUTES) {
      billedMinutes += 30
    } else {
      billedMinutes += 60
    }
  }

  return billedMinutes / 60
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

export const BRANDMASTER_EVENT_SZKOLENIE_UUID = "9b98715f-a000-11ee-aeba-065ed9e1cfca"
export const BRANDMASTER_EVENT_SZKOLENIE_IDENT = "event-Szkolenie"
export const BRANDMASTER_EVENT_VELO_UUID = "f69f2dfc-8855-11ed-bb12-065ed9e1cfca"
export const BRANDMASTER_EVENT_VELO_IDENT = "event-Velo"

function matchesBrandmasterEvent(
  action: TourPlannerActionListItem,
  uuid: string,
  ident: string,
): boolean {
  const event = action.event
  if (!event) return false
  const eventUuid = event.uuid?.trim()
  const eventIdent = event.ident?.trim()
  return eventUuid === uuid || eventIdent === ident
}

export function isSzkolenieAction(action: TourPlannerActionListItem): boolean {
  return matchesBrandmasterEvent(
    action,
    BRANDMASTER_EVENT_SZKOLENIE_UUID,
    BRANDMASTER_EVENT_SZKOLENIE_IDENT,
  )
}

export function isVeloEventAction(action: TourPlannerActionListItem): boolean {
  return matchesBrandmasterEvent(
    action,
    BRANDMASTER_EVENT_VELO_UUID,
    BRANDMASTER_EVENT_VELO_IDENT,
  )
}

/** Akcje Szkolenie i Velo nie wchodzą w liczenie pustych godzin. */
export function isExcludedFromEmptyHoursCalculation(item: ActionWithRoundedTime): boolean {
  return isSzkolenieAction(item.action) || isVeloEventAction(item.action)
}

export function computeEfficiencyHoursFromActions(actions: ActionWithRoundedTime[]): {
  glo: number
  velo: number
} {
  let gloHours = 0
  let veloHours = 0

  for (const item of actions) {
    const hours = item.roundedHours
    if (isSzkolenieAction(item.action)) continue
    veloHours += hours
    if (!isVeloEventAction(item.action)) {
      gloHours += hours
    }
  }

  return { glo: gloHours, velo: veloHours }
}

export function getActionRowKey(item: ActionWithRoundedTime): string {
  return (
    item.actionIdent ??
    item.action.uuid ??
    `${item.startLabel}-${item.stopLabel}-${item.shopName}`
  )
}

/** Akcja bez wyników Hilo, Hilo+ i Hyper Pro. */
export function isEmptyActionSampleStats(stats: SampleStatsFieldCounts): boolean {
  return stats.glo.hilo === 0 && stats.glo.hiloPlus === 0 && stats.glo.hyperPro === 0
}

export function mapFinishedActionsWithRoundedTime(
  items: TourPlannerActionListItem[],
): ActionWithRoundedTime[] {
  const mapped: ActionWithRoundedTime[] = []

  for (const action of items) {
    const start =
      parseCasDatetime(action.history?.start) ?? (action.since ? parseIso(action.since) : null)
    const stop =
      parseCasDatetime(action.history?.stop) ?? (action.until ? parseIso(action.until) : null)
    if (!start || !stop) continue

    const roundedHours = roundActionDurationHours(start, stop)
    if (roundedHours <= 0) continue

    mapped.push({
      action,
      start,
      stop,
      roundedHours,
      dateLabel: formatPlDatePoland(start),
      startLabel: formatTimePoland(start),
      stopLabel: formatTimePoland(stop),
      addressLabel: formatCasAddress(action.point?.address),
      shopName: action.point?.name?.trim() || "-",
      actionName: action.name?.trim() || null,
      actionIdent: action.ident?.trim() || null,
    })
  }

  mapped.sort((a, b) => (b.start?.getTime() ?? 0) - (a.start?.getTime() ?? 0))
  return mapped
}

/** Fallback gdy brak history - since/until z poziomu akcji. */
export function parseActionFallbackStart(item: TourPlannerActionListItem): Date | null {
  return parseCasDatetime(item.history?.start) ?? (item.since ? parseIso(item.since) : null)
}

export function getCasActionTitle(item: TourPlannerActionListItem): string {
  return item.name?.trim() || item.event?.name?.trim() || item.ident?.trim() || "Akcja rozpoczeta"
}

/** Ident najnowszej akcji po dacie startu w podanej liście. */
export function resolveLastActionIdent(
  started: TourPlannerActionListItem[],
  finished: TourPlannerActionListItem[],
): string {
  let bestIdent = ""
  let bestTime = 0

  for (const action of [...started, ...finished]) {
    const ident = action.ident?.trim()
    if (!ident) continue
    const start = parseActionFallbackStart(action)
    if (!start) continue
    const time = start.getTime()
    if (time >= bestTime) {
      bestTime = time
      bestIdent = ident
    }
  }

  return bestIdent
}

/** Ident akcji do POST /sample/stats -aktywna (started) albo ostatnia zakończona. */
export function resolveSampleStatsActionIdent(
  started: TourPlannerActionListItem[],
  finished: TourPlannerActionListItem[],
): string {
  if (started.length > 0) {
    return resolveLastActionIdent(started, [])
  }
  return resolveLastActionIdent([], finished)
}
