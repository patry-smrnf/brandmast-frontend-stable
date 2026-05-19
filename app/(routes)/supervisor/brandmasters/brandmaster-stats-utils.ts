import type { BrandmastersResponse } from "@/lib/api/generated/types"
import { parseIso, toDateKey } from "@/lib/dates/date-utils"
import { brandmasterMatchesQuery } from "@/lib/brandmasters/brandmaster-utils"

import type { SvActionRow } from "../use-sv-actions"

export type BrandmasterStatRow = {
  idBrandmaster: number
  name: string
  surname: string
  cancelledCount: number
  totalHours: number
  /** Godziny akcji rozpoczynających się w wybranym dniu lub później w tym miesiącu. */
  hoursFromDay: number
}

export type BrandmasterStatsAggregateOptions = {
  fromDateKey: string
  monthKey: string
}

export function actionDurationHours(sinceIso: string, untilIso: string): number {
  const start = parseIso(sinceIso)
  const end = parseIso(untilIso)
  if (!start || !end) return 0
  return Math.max(0, (end.getTime() - start.getTime()) / 3_600_000)
}

export function formatHoursPl(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) return "0 h"
  const rounded = Math.round(hours * 10) / 10
  const n = Number.isInteger(rounded) ? String(rounded) : String(rounded).replace(".", ",")
  return `${n} h`
}

function emptyBmStats() {
  return { cancelledCount: 0, totalHours: 0, hoursFromDay: 0 }
}

function addActionHours(
  cur: ReturnType<typeof emptyBmStats>,
  since: string,
  until: string,
  fromDateKey: string,
  monthKey: string
) {
  const hours = actionDurationHours(since, until)
  cur.totalHours += hours
  const d = parseIso(since)
  if (!d) return
  const key = toDateKey(d)
  if (key >= fromDateKey && key.startsWith(`${monthKey}-`)) {
    cur.hoursFromDay += hours
  }
}

export function aggregateBrandmasterStats(
  rows: SvActionRow[],
  brandmasters: BrandmastersResponse[],
  options: BrandmasterStatsAggregateOptions
): BrandmasterStatRow[] {
  const { fromDateKey, monthKey } = options
  const map = new Map<number, ReturnType<typeof emptyBmStats>>()

  for (const r of rows) {
    const id = r.brandmaster.idBrandmaster
    if (!id) continue
    const cur = map.get(id) ?? emptyBmStats()
    if (r.action.status === "CANCELLED") {
      cur.cancelledCount += 1
    } else {
      addActionHours(cur, r.action.since, r.action.until, fromDateKey, monthKey)
    }
    map.set(id, cur)
  }

  const result: BrandmasterStatRow[] = []
  const seen = new Set<number>()

  for (const bm of brandmasters) {
    const id = bm.brandmasterId ?? 0
    if (!id) continue
    seen.add(id)
    const stats = map.get(id) ?? emptyBmStats()
    result.push({
      idBrandmaster: id,
      name: bm.name ?? "",
      surname: bm.surname ?? "",
      ...stats,
    })
  }

  for (const r of rows) {
    const id = r.brandmaster.idBrandmaster
    if (!id || seen.has(id)) continue
    seen.add(id)
    const stats = map.get(id) ?? emptyBmStats()
    result.push({
      idBrandmaster: id,
      name: r.brandmaster.name,
      surname: r.brandmaster.surname,
      ...stats,
    })
  }

  return result.sort((a, b) => {
    const la = `${a.surname} ${a.name}`.trim()
    const lb = `${b.surname} ${b.name}`.trim()
    return la.localeCompare(lb, "pl", { sensitivity: "base" })
  })
}

export function statRowMatchesQuery(row: BrandmasterStatRow, q: string) {
  const query = q.trim().toLowerCase()
  if (!query) return true
  const hay = [
    row.name,
    row.surname,
    `${row.name} ${row.surname}`,
    String(row.idBrandmaster),
  ]
    .join(" | ")
    .toLowerCase()
  return hay.includes(query)
}

export function filterStatsByBrandmasterSearch(
  stats: BrandmasterStatRow[],
  brandmasters: BrandmastersResponse[],
  query: string
): BrandmasterStatRow[] {
  const q = query.trim()
  if (!q) return stats
  const matchingIds = new Set(
    brandmasters
      .filter((bm) => brandmasterMatchesQuery(bm, q))
      .map((bm) => bm.brandmasterId ?? 0)
      .filter(Boolean)
  )
  if (matchingIds.size > 0) {
    return stats.filter((s) => matchingIds.has(s.idBrandmaster) || statRowMatchesQuery(s, q))
  }
  return stats.filter((s) => statRowMatchesQuery(s, q))
}

export function sumTeamStats(stats: BrandmasterStatRow[]) {
  return stats.reduce(
    (acc, s) => ({
      cancelledCount: acc.cancelledCount + s.cancelledCount,
      totalHours: acc.totalHours + s.totalHours,
      hoursFromDay: acc.hoursFromDay + s.hoursFromDay,
    }),
    { cancelledCount: 0, totalHours: 0, hoursFromDay: 0 }
  )
}

/** Etykieta krótka dla pickera (np. „19.05”). */
export function formatStatsDayLabel(dateKey: string) {
  const d = parseIso(`${dateKey}T12:00:00`)
  if (!d) return dateKey
  return new Intl.DateTimeFormat("pl-PL", { day: "2-digit", month: "2-digit" }).format(d)
}
