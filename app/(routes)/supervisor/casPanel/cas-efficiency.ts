import type { SampleStatsFieldCounts } from "@/lib/api"
import type { TourPlannerActionListItem } from "@/lib/api/generated/types"
import { normalizeCasActionStatus } from "@/lib/cas-status"
import { parseIso } from "@/lib/dates/date-utils"
import {
  getActionDurationHours,
  parseCasDatetime,
} from "@/app/(routes)/brandmaster/cas-action-utils"

/**
 * Dzielnik czasu trwania używany przy liczeniu efektywności.
 * Czas trwania akcji (w godzinach) dzielimy przez tę wartość, a następnie
 * wynik (np. liczba sprzedanych sztuk) dzielimy przez tak wyliczony czas.
 */
export const EFFICIENCY_TIME_DIVISOR = 4

/**
 * Uniwersalna efektywność: `value / (durationHours / EFFICIENCY_TIME_DIVISOR)`.
 *
 * Przykład: akcja trwa 3,5 h → 3,5 / 4 = 0,875. Dla 2 sprzedanych sztuk:
 * 2 / 0,875 = 2,29.
 *
 * Zwraca `null`, gdy nie da się policzyć (brak/zerowy czas trwania).
 */
export function computeEfficiency(value: number, durationHours: number): number | null {
  if (!Number.isFinite(value) || !Number.isFinite(durationHours) || durationHours <= 0) {
    return null
  }
  const dividedDuration = durationHours / EFFICIENCY_TIME_DIVISOR
  if (dividedDuration <= 0) return null
  return value / dividedDuration
}

/** Formatuje efektywność do dwóch miejsc po przecinku (format PL). */
export function formatEfficiency(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "-"
  return value.toFixed(2).replace(".", ",")
}

/**
 * Czas trwania akcji w godzinach (rzeczywisty, bez zaokrągleń rozliczeniowych).
 *
 * - status `started`: od czasu startu do `now` (domyślnie teraz),
 * - status `finished` (i inne z czasem stop): od czasu startu do czasu stop.
 *
 * Zwraca `null`, gdy brakuje wymaganych znaczników czasu.
 */
export function getCasActionDurationHours(
  action: TourPlannerActionListItem,
  now: Date = new Date(),
): number | null {
  const start =
    parseCasDatetime(action.history?.start) ?? (action.since ? parseIso(action.since) : null)
  if (!start) return null

  const status = normalizeCasActionStatus(action.status)
  if (status === "started") {
    return getActionDurationHours(start, now)
  }

  const stop =
    parseCasDatetime(action.history?.stop) ?? (action.until ? parseIso(action.until) : null)
  if (!stop) return null

  return getActionDurationHours(start, stop)
}

/** Suma wyników GLO (Hilo + Hilo+ + Hyper Pro). */
export function getGloSum(stats: SampleStatsFieldCounts): number {
  return stats.glo.hilo + stats.glo.hiloPlus + stats.glo.hyperPro
}

export type CasSampleStatsEfficiency = {
  glo: number | null
  velo: number | null
}

/**
 * Efektywność GLO i VELO na podstawie wyników próbek oraz czasu trwania akcji.
 * - GLO: suma (Hilo + Hilo+ + Hyper Pro) / (czas trwania / 4),
 * - VELO: liczba VELO / (czas trwania / 4).
 */
export function computeSampleStatsEfficiency(
  stats: SampleStatsFieldCounts,
  durationHours: number,
): CasSampleStatsEfficiency {
  return {
    glo: computeEfficiency(getGloSum(stats), durationHours),
    velo: computeEfficiency(stats.veloNet, durationHours),
  }
}
