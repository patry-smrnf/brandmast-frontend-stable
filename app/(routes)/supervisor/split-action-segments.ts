import { parseIso } from "../brandmaster/actions/date-utils"

/** Maksymalna długość jednej podakcji (4 godziny). */
export const MAX_SUBACTION_DURATION_MS = 4 * 60 * 60 * 1000

export type ActionTimeSegment = {
  since: string
  until: string
}

/**
 * Dzieli przedział [since, until] na kolejne sloty o długości co najwyżej 4h (ostatni może być krótszy).
 * Używa znaczników czasu UTC z `Date` — ISO wysyłane do API są spójne z `toISOString()`.
 */
export function splitActionIntoMaxFourHourSegments(
  sinceIso: string,
  untilIso: string
): ActionTimeSegment[] {
  const start = parseIso(sinceIso)
  const end = parseIso(untilIso)
  if (!start || !end) return []
  let t0 = start.getTime()
  const t1 = end.getTime()
  if (t1 <= t0) {
    return [{ since: sinceIso, until: untilIso }]
  }

  const out: ActionTimeSegment[] = []
  let cur = t0
  while (cur < t1) {
    const segEnd = Math.min(cur + MAX_SUBACTION_DURATION_MS, t1)
    out.push({
      since: new Date(cur).toISOString(),
      until: new Date(segEnd).toISOString(),
    })
    cur = segEnd
  }
  return out
}

const CTRL_RE = /[\u0000-\u001F\u007F]/g

/** Obcina i usuwa znaki kontrolne z tytułu przed wysłaniem do API. */
export function sanitizeActionTitle(raw: string, maxLen = 200): string {
  return raw.trim().replace(CTRL_RE, "").slice(0, maxLen)
}
