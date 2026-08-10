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

export type ActionDurationSplit = {
  /** Czas w pełnych minutach (max 8 h = 480 min). */
  totalMinutes: number
  /** Pełne godziny + pół godziny (zaokrąglenie w dół do 30 min) — wypłata podstawowa. */
  baseMinutes: number
  /** Brakujące minuty do pełnej / pół godziny — wypłata w „godzinowka || TURA”. */
  remainderMinutes: number
  /** totalMinutes / 60 */
  durationHours: number
  /** baseMinutes / 60 */
  baseHours: number
  /** remainderMinutes / 60 */
  remainderHours: number
}

export type ActionWithRoundedTime = {
  action: TourPlannerActionListItem
  start: Date | null
  stop: Date | null
  /** Czas trwania (coo minuty, max 8 h). */
  durationHours: number
  /** Godziny do wypłaty podstawowej (pełne + pół, w dół). */
  baseHours: number
  /** Minuty do linii „godzinowka || TURA”. */
  remainderMinutes: number
  dateLabel: string
  startLabel: string
  stopLabel: string
  addressLabel: string
  shopName: string
  actionName: string | null
  actionIdent: string | null
}

export const HOURLY_TOUR_BONUS_LABEL = "godzinowka || TURA"

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

/** Maksymalny czas akcji liczony do godzin, wypłaty i efektywności (8 h). */
export const MAX_ACTION_DURATION_MINUTES = 8 * 60

/** Rzeczywisty czas trwania akcji w pełnych minutach (cap: MAX_ACTION_DURATION_MINUTES). */
export function getActionDurationMinutes(start: Date, stop: Date): number {
  const ms = stop.getTime() - start.getTime()
  if (ms <= 0) return 0
  return Math.min(Math.floor(ms / 60_000), MAX_ACTION_DURATION_MINUTES)
}

/** Czas trwania akcji w godzinach (co do minuty, max 8 h, bez zaokrągleń rozliczeniowych). */
export function getActionDurationHours(start: Date, stop: Date): number {
  return getActionDurationMinutes(start, stop) / 60
}

const EMPTY_DURATION_SPLIT: ActionDurationSplit = {
  totalMinutes: 0,
  baseMinutes: 0,
  remainderMinutes: 0,
  durationHours: 0,
  baseHours: 0,
  remainderHours: 0,
}

/**
 * Podział czasu na wypłatę (czas akcji limitujemy do max 8 h):
 * - baza: pełne godziny + pół godziny (floor do 30 min),
 * - reszta minut: linia „godzinowka || TURA”.
 *
 * Np. 3 h 38 min → baza 3 h 30 min, reszta 8 min.
 * Np. 10 h → liczone jako 8 h.
 */
export function splitActionDurationForPayout(start: Date, stop: Date): ActionDurationSplit {
  const totalMinutes = getActionDurationMinutes(start, stop)
  if (totalMinutes <= 0) return EMPTY_DURATION_SPLIT

  const baseMinutes = Math.floor(totalMinutes / 30) * 30
  const remainderMinutes = totalMinutes - baseMinutes

  return {
    totalMinutes,
    baseMinutes,
    remainderMinutes,
    durationHours: totalMinutes / 60,
    baseHours: baseMinutes / 60,
    remainderHours: remainderMinutes / 60,
  }
}

export function splitActionDurationFromMinutes(totalMinutes: number): ActionDurationSplit {
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) return EMPTY_DURATION_SPLIT
  const mins = Math.min(Math.floor(totalMinutes), MAX_ACTION_DURATION_MINUTES)
  const baseMinutes = Math.floor(mins / 30) * 30
  const remainderMinutes = mins - baseMinutes
  return {
    totalMinutes: mins,
    baseMinutes,
    remainderMinutes,
    durationHours: mins / 60,
    baseHours: baseMinutes / 60,
    remainderHours: remainderMinutes / 60,
  }
}

/** Kwota za minuty przy stawce godzinowej (np. 8 min × 45 zł/h = 6 zł). */
export function computeHourlyPay(minutes: number, hourlyRate: number): number {
  if (!Number.isFinite(minutes) || minutes <= 0 || !Number.isFinite(hourlyRate)) return 0
  return (minutes * hourlyRate) / 60
}

/** Rzeczywisty czas: „3 h 38 min”, „45 min”, „2 h”. */
export function formatHoursPl(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) return "0 h"
  const totalMinutes = Math.round(hours * 60)
  if (totalMinutes <= 0) return "0 h"
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h} h`
  return `${h} h ${m} min`
}

export function formatMoneyPl(amount: number): string {
  if (!Number.isFinite(amount) || amount === 0) return "0,00 zł"
  return `${amount.toLocaleString("pl-PL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} zł`
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
    const hours = item.durationHours
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

    const split = splitActionDurationForPayout(start, stop)
    if (split.durationHours <= 0) continue

    mapped.push({
      action,
      start,
      stop,
      durationHours: split.durationHours,
      baseHours: split.baseHours,
      remainderMinutes: split.remainderMinutes,
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
