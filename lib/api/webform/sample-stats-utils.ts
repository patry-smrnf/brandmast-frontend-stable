import {
  GLO_TRACKED_MODELS,
  SAMPLE_STATS_FIELDS,
  type GloTrackedModelKey,
  type SampleStatsBuckets,
  type SampleStatsCountsByField,
  type SampleStatsField,
  type SampleStatsFieldCounts,
  type SampleStatsGloCounts,
  type SampleStatsRow,
} from "./sample-stats-types";

function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

function sumBrandCounts(rows: SampleStatsRow[], brand: string): number {
  const target = normalizeKey(brand);
  return rows.reduce((sum, row) => {
    if (normalizeKey(row.brand) !== target) return sum;
    const count = Number(row.count);
    return sum + (Number.isFinite(count) ? count : 0);
  }, 0);
}

export function getModelCount(
  rows: SampleStatsRow[],
  brand: string,
  model: string,
): number {
  const brandKey = normalizeKey(brand);
  const modelKey = normalizeKey(model);
  return rows.reduce((sum, row) => {
    if (normalizeKey(row.brand) !== brandKey) return sum;
    if (normalizeKey(row.model) !== modelKey) return sum;
    const count = Number(row.count);
    return sum + (Number.isFinite(count) ? count : 0);
  }, 0);
}

export function getGloCounts(rows: SampleStatsRow[]): SampleStatsGloCounts {
  const out = {} as SampleStatsGloCounts;
  for (const key of Object.keys(GLO_TRACKED_MODELS) as GloTrackedModelKey[]) {
    out[key] = getModelCount(rows, "Glo", GLO_TRACKED_MODELS[key]);
  }
  return out;
}

/** Velo „netto”: suma Velo − suma Glo (wszystkie modele w buckecie). */
export function getVeloNetTotal(rows: SampleStatsRow[]): number {
  return sumBrandCounts(rows, "Velo") - sumBrandCounts(rows, "Glo");
}

export function computeSampleStatsFieldCounts(rows: SampleStatsRow[]): SampleStatsFieldCounts {
  return {
    glo: getGloCounts(rows),
    veloNet: getVeloNetTotal(rows),
  };
}

export function computeSampleStatsCountsByField(
  buckets: SampleStatsBuckets,
): SampleStatsCountsByField {
  const out = {} as SampleStatsCountsByField;
  for (const field of SAMPLE_STATS_FIELDS) {
    out[field] = computeSampleStatsFieldCounts(buckets[field] ?? []);
  }
  return out;
}

/** Skrót: np. `counts.currentMonth.glo.hilo`, `counts.currentMonth.veloNet`. */
export function getSampleStatsFieldCounts(
  counts: SampleStatsCountsByField,
  field: SampleStatsField,
): SampleStatsFieldCounts {
  return counts[field];
}
