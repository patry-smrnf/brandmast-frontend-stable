import type { OneTwoOneAwaryjneZgloszenia, SampleStatsGloCounts } from "@/lib/api"

/** Ilości zgłoszeń awaryjnych ("tickety") w rozbiciu na produkty. Każdy wiersz = 1 sztuka. */
export type AwaryjneCounts = {
  hilo: number
  hiloPlus: number
  velo: number
}

export const EMPTY_AWARYJNE_COUNTS: AwaryjneCounts = { hilo: 0, hiloPlus: 0, velo: 0 }

/** GLO awaryjnych = Hilo + Hilo+. */
export function sumAwaryjneGlo(counts: AwaryjneCounts): number {
  return counts.hilo + counts.hiloPlus
}

/**
 * Zlicza zgłoszenia awaryjne wg pola `oferta` (dopasowanie bez rozróżniania wielkości liter):
 * "HILO" → hilo, "HILO+" → hiloPlus, "VELO" → velo. Pozostałe wartości są ignorowane.
 */
export function computeAwaryjneCounts(
  rows: OneTwoOneAwaryjneZgloszenia[] | null | undefined,
): AwaryjneCounts {
  const counts: AwaryjneCounts = { hilo: 0, hiloPlus: 0, velo: 0 }
  if (!rows) return counts

  for (const row of rows) {
    switch (row.oferta?.trim().toLowerCase()) {
      case "hilo":
        counts.hilo += 1
        break
      case "hilo+":
        counts.hiloPlus += 1
        break
      case "velo":
        counts.velo += 1
        break
      default:
        break
    }
  }

  return counts
}

/** Dolicza ilości awaryjne do GLO (Hilo, Hilo+) pobranego ze statystyk sprzedaży. */
export function addAwaryjneToGlo(
  glo: SampleStatsGloCounts,
  awaryjne: AwaryjneCounts,
): SampleStatsGloCounts {
  return {
    ...glo,
    hilo: glo.hilo + awaryjne.hilo,
    hiloPlus: glo.hiloPlus + awaryjne.hiloPlus,
  }
}
