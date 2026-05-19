export const POLAND_TIMEZONE = "Europe/Warsaw"

/** Bieżący moment (do porównań); etykiety czasu formatuj w {@link POLAND_TIMEZONE}. */
export function nowInPoland(): Date {
  return new Date()
}

/** Klucz daty YYYY-MM-DD wg kalendarza w Polsce. */
export function toDateKeyInPoland(d: Date = nowInPoland()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: POLAND_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d)
}

export function parseIso(iso: string) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d
}

export function toDateKey(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function toMonthKey(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  return `${y}-${m}`
}

export function startOfDay(d: Date) {
  const c = new Date(d)
  c.setHours(0, 0, 0, 0)
  return c
}

export function addDays(d: Date, days: number) {
  const c = new Date(d)
  c.setDate(c.getDate() + days)
  return c
}

export function formatHeaderDate(d: Date) {
  const day = new Intl.DateTimeFormat("pl-PL", { day: "2-digit" }).format(d)
  const rest = new Intl.DateTimeFormat("pl-PL", {
    weekday: "long",
    month: "long",
    year: "numeric",
  }).format(d)
  return { day, rest }
}

export function formatHeaderDatePoland(d: Date = nowInPoland()) {
  const day = new Intl.DateTimeFormat("pl-PL", {
    timeZone: POLAND_TIMEZONE,
    day: "2-digit",
  }).format(d)
  const rest = new Intl.DateTimeFormat("pl-PL", {
    timeZone: POLAND_TIMEZONE,
    weekday: "long",
    month: "long",
    year: "numeric",
  }).format(d)
  return { day, rest }
}

/** Krótka data, np. 17.05.2026 (strefa PL). */
export function formatPlDatePoland(d: Date) {
  return new Intl.DateTimeFormat("pl-PL", {
    timeZone: POLAND_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d)
}

export function formatTime(d: Date) {
  return new Intl.DateTimeFormat("pl-PL", { hour: "2-digit", minute: "2-digit" }).format(d)
}

/** Godzina w strefie Polski (Europe/Warsaw). */
export function formatTimePoland(d: Date) {
  return new Intl.DateTimeFormat("pl-PL", {
    timeZone: POLAND_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
  }).format(d)
}

const WALL_CLOCK_RE =
  /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?$/

/**
 * Parsuje napis bez offsetu (np. z CAS/PHP) jako czas ścienny w podanej strefie.
 */
export function parseWallClockInTimeZone(
  dateTimeStr: string,
  timeZone: string = POLAND_TIMEZONE,
): Date | null {
  const trimmed = dateTimeStr.trim()
  const match = WALL_CLOCK_RE.exec(trimmed)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const hour = Number(match[4])
  const minute = Number(match[5])
  const second = Number(match[6] ?? "0")

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })

  let guessMs = Date.UTC(year, month - 1, day, hour, minute, second)

  for (let i = 0; i < 4; i++) {
    const parts = Object.fromEntries(
      formatter.formatToParts(new Date(guessMs)).map((p) => [p.type, p.value]),
    ) as Record<string, string>

    const py = Number(parts.year)
    const pmo = Number(parts.month)
    const pd = Number(parts.day)
    const ph = Number(parts.hour)
    const pmi = Number(parts.minute)
    const ps = Number(parts.second)

    if (py === year && pmo === month && pd === day && ph === hour && pmi === minute && ps === second) {
      return new Date(guessMs)
    }

    guessMs += Date.UTC(year, month - 1, day, hour, minute, second) - Date.UTC(py, pmo - 1, pd, ph, pmi, ps)
  }

  return new Date(guessMs)
}

/** Data i godzina w locale pl-PL, w lokalnej strefie przeglądarki (jak {@link formatTime}). */
export function formatPlDateTime(d: Date) {
  return new Intl.DateTimeFormat("pl-PL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d)
}

/** Data i godzina w strefie Polski (Europe/Warsaw). */
export function formatPlDateTimePoland(d: Date) {
  return new Intl.DateTimeFormat("pl-PL", {
    timeZone: POLAND_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d)
}

export function formatPlDateTimeFromIso(iso: string) {
  const s = iso.trim()
  if (!s) return "-"
  const d = parseIso(s)
  if (!d) return "-"
  return formatPlDateTime(d)
}
