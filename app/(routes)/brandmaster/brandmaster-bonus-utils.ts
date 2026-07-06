import type { SampleStatsGloCounts } from "@/lib/api"

import {
  buildQualitativeVeloProgress,
  buildRegularTierProgress,
  getQualitativeProductRates,
  getRegularGloRatePerDevice,
  getRegularVeloRatePerUnit,
  QUALITATIVE_VELO_PER_UNIT,
  type QualitativeVeloProgress,
  type TierProgressHint,
} from "./brandmaster-bonus-tiers"

export type BrandmasterBonusInput = {
  glo: SampleStatsGloCounts
  veloNet: number
  roundedHours: number
  /** Godziny do liczenia efektywności Glo (domyślnie roundedHours). */
  gloEfficiencyHours?: number
  /** Godziny do liczenia efektywności Velo (domyślnie roundedHours). */
  veloEfficiencyHours?: number
}

export type BonusLineItem = {
  label: string
  quantity: number
  ratePerUnit: number
  amount: number
}

export type RegularBonusBreakdown = {
  tierLabel: string
  gloRatePerDevice: number
  veloRatePerUnit: number
  items: BonusLineItem[]
  total: number
  tierProgress: TierProgressHint
}

export type QualitativeBonusBreakdown = {
  tierLabel: string
  hiloRate: number
  hiloPlusRate: number
  hyperProRate: number
  veloRatePerUnit: number
  items: BonusLineItem[]
  total: number
  veloProgress: QualitativeVeloProgress
}

export type BrandmasterEfficiency = {
  roundedHours: number
  gloEfficiencyHours: number
  veloEfficiencyHours: number
  gloTimeDivisor: number
  veloTimeDivisor: number
  gloCount: number
  veloCount: number
  gloEfficiency: number
  veloEfficiency: number
}

export type BrandmasterBonusBreakdown = {
  efficiency: BrandmasterEfficiency
  regular: RegularBonusBreakdown
  qualitative: QualitativeBonusBreakdown
  totalBonus: number
}

export function sumGloDeviceCount(glo: SampleStatsGloCounts): number {
  return glo.hilo + glo.hiloPlus + glo.hyperPro
}

/** Urządzenia Glo w bonusie zwykłym (Hilo + Hilo+). Hyper Pro trafia do bonusu jakościowego. */
export function sumRegularGloDeviceCount(glo: SampleStatsGloCounts): number {
  return glo.hilo + glo.hiloPlus
}

export function computeTimeDivisor(roundedHours: number): number {
  if (!Number.isFinite(roundedHours) || roundedHours <= 0) return 0
  return roundedHours / 4
}

export function computeEfficiency(count: number, roundedHours: number): number {
  const divisor = computeTimeDivisor(roundedHours)
  if (divisor <= 0) return 0
  return count / divisor
}

function lineItem(
  label: string,
  quantity: number,
  ratePerUnit: number,
): BonusLineItem {
  return {
    label,
    quantity,
    ratePerUnit,
    amount: quantity * ratePerUnit,
  }
}

export function computeRegularBonus(
  input: BrandmasterBonusInput,
  efficiency: BrandmasterEfficiency,
): RegularBonusBreakdown {
  const regularGloCount = sumRegularGloDeviceCount(input.glo)
  const veloCount = efficiency.veloCount
  const { rate: gloRatePerDevice, tierLabel } = getRegularGloRatePerDevice(
    efficiency.veloEfficiency,
    efficiency.gloEfficiency,
  )
  const veloRatePerUnit = getRegularVeloRatePerUnit(efficiency.veloEfficiency)
  const tierProgress = buildRegularTierProgress(
    efficiency.gloEfficiency,
    efficiency.veloEfficiency,
  )

  const items: BonusLineItem[] = []
  if (regularGloCount > 0 && gloRatePerDevice > 0) {
    items.push(lineItem("Urządzenia Glo (Hilo, Hilo+)", regularGloCount, gloRatePerDevice))
  } else if (gloRatePerDevice === 0 && regularGloCount > 0) {
    items.push(lineItem("Urządzenia Glo (Hilo, Hilo+)", regularGloCount, 0))
  }
  if (veloCount > 0 && veloRatePerUnit > 0) {
    items.push(lineItem("Velo", veloCount, veloRatePerUnit))
  }

  const total = items.reduce((sum, item) => sum + item.amount, 0)
  return {
    tierLabel,
    gloRatePerDevice,
    veloRatePerUnit,
    items,
    total,
    tierProgress,
  }
}

export function computeQualitativeBonus(
  input: BrandmasterBonusInput,
  efficiency: BrandmasterEfficiency,
): QualitativeBonusBreakdown {
  const { hiloRate, hiloPlusRate, tierLabel } = getQualitativeProductRates(
    efficiency.gloEfficiency,
  )
  const { rate: hyperProRate } = getRegularGloRatePerDevice(
    efficiency.veloEfficiency,
    efficiency.gloEfficiency,
  )
  const veloRatePerUnit = QUALITATIVE_VELO_PER_UNIT
  const veloProgress = buildQualitativeVeloProgress(efficiency.veloEfficiency)
  const items: BonusLineItem[] = []

  if (input.glo.hilo > 0) {
    items.push(lineItem("Hilo", input.glo.hilo, hiloRate))
  }
  if (input.glo.hiloPlus > 0) {
    items.push(lineItem("Hilo+", input.glo.hiloPlus, hiloPlusRate))
  }
  if (input.glo.hyperPro > 0) {
    items.push(lineItem("Hyper Pro", input.glo.hyperPro, hyperProRate))
  }
  if (efficiency.veloCount > 0) {
    items.push(lineItem("Velo", efficiency.veloCount, veloRatePerUnit))
  }

  const total = items.reduce((sum, item) => sum + item.amount, 0)
  return {
    tierLabel,
    hiloRate,
    hiloPlusRate,
    hyperProRate,
    veloRatePerUnit,
    items,
    total,
    veloProgress,
  }
}

export function computeBrandmasterEfficiency(
  input: BrandmasterBonusInput,
): BrandmasterEfficiency {
  const gloCount = sumGloDeviceCount(input.glo)
  const veloCount = Math.max(0, input.veloNet)
  const gloEfficiencyHours = input.gloEfficiencyHours ?? input.roundedHours
  const veloEfficiencyHours = input.veloEfficiencyHours ?? input.roundedHours
  const gloTimeDivisor = computeTimeDivisor(gloEfficiencyHours)
  const veloTimeDivisor = computeTimeDivisor(veloEfficiencyHours)

  return {
    roundedHours: input.roundedHours,
    gloEfficiencyHours,
    veloEfficiencyHours,
    gloTimeDivisor,
    veloTimeDivisor,
    gloCount,
    veloCount,
    gloEfficiency: computeEfficiency(gloCount, gloEfficiencyHours),
    veloEfficiency: computeEfficiency(veloCount, veloEfficiencyHours),
  }
}

export function computeBrandmasterBonus(
  input: BrandmasterBonusInput,
): BrandmasterBonusBreakdown {
  const efficiency = computeBrandmasterEfficiency(input)
  const regular = computeRegularBonus(input, efficiency)
  const qualitative = computeQualitativeBonus(input, efficiency)

  return {
    efficiency,
    regular,
    qualitative,
    totalBonus: regular.total + qualitative.total,
  }
}

export function formatEfficiencyPl(value: number): string {
  if (!Number.isFinite(value)) return "-"
  return value.toLocaleString("pl-PL", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
}

export type { QualitativeVeloProgress, TierProgressHint } from "./brandmaster-bonus-tiers"
