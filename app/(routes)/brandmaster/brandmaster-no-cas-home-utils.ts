import { parseIso, toDateKeyInPoland } from "@/lib/dates/date-utils"

import type { BrandmasterAction } from "./actions/types"

export function formatBmHoursPl(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) return "0 h"
  const rounded = Math.round(hours * 10) / 10
  const n = Number.isInteger(rounded) ? String(rounded) : String(rounded).replace(".", ",")
  return `${n} h`
}

export function actionDurationHours(sinceIso: string, untilIso: string): number {
  const start = parseIso(sinceIso)
  const end = parseIso(untilIso)
  if (!start || !end) return 0
  return Math.max(0, (end.getTime() - start.getTime()) / 3_600_000)
}

export function actionSinceDateKey(action: BrandmasterAction): string | null {
  const since = parseIso(action.since)
  if (!since) return null
  return toDateKeyInPoland(since)
}

export function filterTodaysActions(
  actions: BrandmasterAction[],
  todayKey: string,
): BrandmasterAction[] {
  return actions
    .filter((action) => actionSinceDateKey(action) === todayKey)
    .slice()
    .sort((a, b) => a.since.localeCompare(b.since))
}

export function sumActionHours(
  actions: BrandmasterAction[],
  opts?: { fromDateKeyInclusive?: string },
): number {
  let total = 0
  for (const action of actions) {
    if (action.status === "CANCELLED") continue
    const dateKey = actionSinceDateKey(action)
    if (!dateKey) continue
    if (opts?.fromDateKeyInclusive && dateKey < opts.fromDateKeyInclusive) continue
    total += actionDurationHours(action.since, action.until)
  }
  return total
}

export function computeNoCasMonthStats(actions: BrandmasterAction[], todayKey: string) {
  return {
    actionCount: actions.length,
    totalHours: sumActionHours(actions),
    fromTodayHours: sumActionHours(actions, { fromDateKeyInclusive: todayKey }),
  }
}
