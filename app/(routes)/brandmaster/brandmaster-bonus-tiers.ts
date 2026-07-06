/**
 * Konfiguracja progów bonusów brandmastera.
 * Edytuj ten plik przy zmianie stawek na kolejny miesiąc.
 */

/** Minimalna efektywność Velo, aby w ogóle liczyć bonus Glo w bonusie zwykłym. */
export const REGULAR_MIN_VELO_FOR_GLO = 5.0

/** Próg Velo, od którego liczony jest bonus jakościowy (informacyjnie / zachęta). */
export const QUALITATIVE_VELO_TARGET = 9.0

/** Progi efektywności Glo — wartości „od” dla kolejnych stopni (wyższy indeks = wyższy próg). */
export const GLO_EFFICIENCY_THRESHOLDS = [1.4, 1.9, 2.3] as const

export type GloTierRates = {
  readonly gloPerDevice: number
  readonly hilo: number
  readonly hiloPlus: number
}

export type RegularVeloBand = {
  /** Etykieta pasma Velo w UI. */
  readonly label: string
  /** Dolna granica efektywności Velo (włącznie). */
  readonly minVelo: number
  /** Górna granica efektywności Velo (wyłącznie). `null` = brak górnej granicy. */
  readonly maxVelo: number | null
  /** Stawki Glo za urządzenie (Hilo, Hilo+, Hyper Pro) wg stopnia efektywności Glo. */
  readonly gloRates: readonly number[]
  /** Stawka za Velo w bonusie zwykłym. */
  readonly veloPerUnit: number
}

/**
 * Bonus zwykły — pasma efektywności Velo.
 * Kolejność ma znaczenie: pierwsze pasujące pasmo wygrywa.
 */
export const REGULAR_VELO_BANDS: readonly RegularVeloBand[] = [
  {
    label: "Velo 5,0–7,1",
    minVelo: 5.0,
    maxVelo: 7.1,
    gloRates: [10, 20, 25, 35],
    veloPerUnit: 0,
  },
  {
    label: "Velo ≥ 7,1",
    minVelo: 7.1,
    maxVelo: null,
    gloRates: [15, 25, 30, 40],
    veloPerUnit: 2,
  },
]

/**
 * Bonus jakościowy — stawki Hilo / Hilo+ wg stopnia efektywności Glo.
 * Indeks odpowiada stopniowi z {@link GLO_EFFICIENCY_THRESHOLDS}.
 */
export const QUALITATIVE_GLO_TIER_RATES: readonly GloTierRates[] = [
  { gloPerDevice: 0, hilo: 15, hiloPlus: 30 },
  { gloPerDevice: 0, hilo: 30, hiloPlus: 45 },
  { gloPerDevice: 0, hilo: 40, hiloPlus: 60 },
  { gloPerDevice: 0, hilo: 45, hiloPlus: 60 },
]

/** Stawka za Velo w bonusie jakościowym (liczona zawsze jako zachęta). */
export const QUALITATIVE_VELO_PER_UNIT = 4

export type ResolvedGloTier = {
  index: number
  label: string
}

export function formatGloTierLabel(tierIndex: number): string {
  const thresholds = GLO_EFFICIENCY_THRESHOLDS
  if (tierIndex <= 0) return `Glo < ${formatThreshold(thresholds[0])}`
  if (tierIndex >= thresholds.length) {
    return `Glo ≥ ${formatThreshold(thresholds[thresholds.length - 1])}`
  }
  const lower = thresholds[tierIndex - 1]
  const upper = thresholds[tierIndex]
  return `Glo ${formatThreshold(lower)}–${formatThreshold(upper)}`
}

function formatThreshold(value: number): string {
  return value.toLocaleString("pl-PL", { maximumFractionDigits: 1 })
}

/** Zwraca indeks stopnia Glo: 0 = najniższy, kolejne progi wg {@link GLO_EFFICIENCY_THRESHOLDS}. */
export function resolveGloTier(gloEfficiency: number): ResolvedGloTier {
  let index = 0
  for (const threshold of GLO_EFFICIENCY_THRESHOLDS) {
    if (gloEfficiency < threshold) break
    index += 1
  }
  return { index, label: formatGloTierLabel(index) }
}

export function resolveRegularVeloBand(veloEfficiency: number): RegularVeloBand | null {
  if (veloEfficiency < REGULAR_MIN_VELO_FOR_GLO) return null
  for (const band of REGULAR_VELO_BANDS) {
    if (veloEfficiency < band.minVelo) continue
    if (band.maxVelo != null && veloEfficiency >= band.maxVelo) continue
    return band
  }
  return REGULAR_VELO_BANDS[REGULAR_VELO_BANDS.length - 1] ?? null
}

export function getRegularGloRatePerDevice(
  veloEfficiency: number,
  gloEfficiency: number,
): { rate: number; tierLabel: string; gloTier: ResolvedGloTier; veloBand: RegularVeloBand | null } {
  const gloTier = resolveGloTier(gloEfficiency)
  const veloBand = resolveRegularVeloBand(veloEfficiency)

  if (!veloBand) {
    return {
      rate: 0,
      tierLabel: `Velo < ${formatThreshold(REGULAR_MIN_VELO_FOR_GLO)} · brak bonusu Glo`,
      gloTier,
      veloBand: null,
    }
  }

  const rate = veloBand.gloRates[gloTier.index] ?? 0
  return {
    rate,
    tierLabel: `${veloBand.label} · ${gloTier.label} · ${rate} zł/urz.`,
    gloTier,
    veloBand,
  }
}

export function getRegularVeloRatePerUnit(veloEfficiency: number): number {
  return resolveRegularVeloBand(veloEfficiency)?.veloPerUnit ?? 0
}

export function getQualitativeProductRates(gloEfficiency: number): {
  hiloRate: number
  hiloPlusRate: number
  tierLabel: string
  gloTier: ResolvedGloTier
} {
  const gloTier = resolveGloTier(gloEfficiency)
  const rates = QUALITATIVE_GLO_TIER_RATES[gloTier.index] ?? QUALITATIVE_GLO_TIER_RATES[0]!
  return {
    hiloRate: rates.hilo,
    hiloPlusRate: rates.hiloPlus,
    tierLabel: `${gloTier.label} · Hilo ${rates.hilo} zł · Hilo+ ${rates.hiloPlus} zł`,
    gloTier,
  }
}

export type TierProgressHint = {
  currentLabel: string
  nextGloThreshold: number | null
  gloEfficiencyGap: number | null
  gloProgressPercent: number | null
  nextVeloThreshold: number | null
  veloEfficiencyGap: number | null
  veloProgressPercent: number | null
  nextVeloBandLabel: string | null
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value))
}

function progressBetween(current: number, from: number, to: number): number | null {
  if (to <= from) return null
  return clampPercent(((current - from) / (to - from)) * 100)
}

/** Postęp w bonusie zwykłym — brakująca efektywność do wyższego stopnia Glo lub pasma Velo. */
export function buildRegularTierProgress(
  gloEfficiency: number,
  veloEfficiency: number,
): TierProgressHint {
  const gloTier = resolveGloTier(gloEfficiency)
  const veloBand = resolveRegularVeloBand(veloEfficiency)

  const nextGloThreshold =
    gloTier.index < GLO_EFFICIENCY_THRESHOLDS.length
      ? GLO_EFFICIENCY_THRESHOLDS[gloTier.index]!
      : null

  const gloEfficiencyGap =
    nextGloThreshold != null ? Math.max(0, nextGloThreshold - gloEfficiency) : null

  const gloProgressFrom =
    gloTier.index === 0 ? 0 : GLO_EFFICIENCY_THRESHOLDS[gloTier.index - 1]!
  const gloProgressPercent =
    nextGloThreshold != null
      ? progressBetween(gloEfficiency, gloProgressFrom, nextGloThreshold)
      : 100

  let nextVeloThreshold: number | null = null
  let nextVeloBandLabel: string | null = null

  if (veloEfficiency < REGULAR_MIN_VELO_FOR_GLO) {
    nextVeloThreshold = REGULAR_MIN_VELO_FOR_GLO
    nextVeloBandLabel = REGULAR_VELO_BANDS[0]?.label ?? null
  } else if (veloBand?.maxVelo != null && veloEfficiency < veloBand.maxVelo) {
    nextVeloThreshold = veloBand.maxVelo
    nextVeloBandLabel = REGULAR_VELO_BANDS[1]?.label ?? null
  }

  const veloEfficiencyGap =
    nextVeloThreshold != null ? Math.max(0, nextVeloThreshold - veloEfficiency) : null

  const veloProgressFrom =
    veloEfficiency < REGULAR_MIN_VELO_FOR_GLO
      ? 0
      : veloBand?.minVelo ?? REGULAR_MIN_VELO_FOR_GLO

  const veloProgressPercent =
    nextVeloThreshold != null
      ? progressBetween(veloEfficiency, veloProgressFrom, nextVeloThreshold)
      : veloBand
        ? 100
        : progressBetween(veloEfficiency, 0, REGULAR_MIN_VELO_FOR_GLO)

  const currentLabel = veloBand
    ? `${veloBand.label} · ${gloTier.label}`
    : `Velo < ${formatThreshold(REGULAR_MIN_VELO_FOR_GLO)}`

  return {
    currentLabel,
    nextGloThreshold,
    gloEfficiencyGap,
    gloProgressPercent,
    nextVeloThreshold,
    veloEfficiencyGap,
    veloProgressPercent,
    nextVeloBandLabel,
  }
}

export type QualitativeVeloProgress = {
  target: number
  gap: number
  progressPercent: number
  reached: boolean
}

/** Postęp Velo w kierunku bonusu jakościowego (zachęta). */
export function buildQualitativeVeloProgress(veloEfficiency: number): QualitativeVeloProgress {
  const target = QUALITATIVE_VELO_TARGET
  const reached = veloEfficiency >= target
  const gap = reached ? 0 : Math.max(0, target - veloEfficiency)
  const progressPercent = reached
    ? 100
    : clampPercent((veloEfficiency / target) * 100)

  return { target, gap, progressPercent, reached }
}
