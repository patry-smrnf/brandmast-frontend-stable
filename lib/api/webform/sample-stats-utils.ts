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

function isTrackedModel(model: string): boolean {
  const key = normalizeKey(model);
  for (const tracked of Object.values(GLO_TRACKED_MODELS)) {
    if (normalizeKey(tracked) === key) return true;
  }
  return false;
}

function sumBrandCountsForTrackedModels(rows: SampleStatsRow[], brand: string): number {
  const target = normalizeKey(brand);
  return rows.reduce((sum, row) => {
    if (normalizeKey(row.brand) !== target) return sum;
    // Nowe API potrafi zwracać modele typu "[H] GLO + Paczki / POP".
    // Liczymy wyłącznie znane modele: Hilo / Hilo+ / Hyper Pro.
    if (!isTrackedModel(row.model)) return sum;
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

function isBracketAnnotatedModel(model: string): boolean {
  return model.includes("[") && model.includes("]");
}

/**
 * VELO: suma wierszy z brandu "Velo", bez modeli z adnotacją w nawiasach
 * kwadratowych (np. "[H] …") — takie county nie wchodzą do sumy.
 *
 * Uwaga: historycznie to pole było liczone jako "VELO netto" (Velo − Glo),
 * ale w nowej regule biznesowej NIE odejmujemy już ilości brandu Glo.
 */
export function getVeloNetTotal(rows: SampleStatsRow[]): number {
  const target = normalizeKey("Velo");
  return rows.reduce((sum, row) => {
    if (normalizeKey(row.brand) !== target) return sum;
    if (isBracketAnnotatedModel(row.model)) return sum;
    const count = Number(row.count);
    return sum + (Number.isFinite(count) ? count : 0);
  }, 0);
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
