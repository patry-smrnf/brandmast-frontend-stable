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
  /** Rzeczywisty czas pracy w godzinach (co do minuty). */
  durationHours: number
  /** Godziny do liczenia efektywności Glo (domyślnie durationHours). */
  gloEfficiencyHours?: number
  /** Godziny do liczenia efektywności Velo (domyślnie durationHours). */
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
  durationHours: number
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

export function computeTimeDivisor(durationHours: number): number {
  if (!Number.isFinite(durationHours) || durationHours <= 0) return 0
  return durationHours / 4
}

export function computeEfficiency(count: number, durationHours: number): number {
  const divisor = computeTimeDivisor(durationHours)
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
  const gloEfficiencyHours = input.gloEfficiencyHours ?? input.durationHours
  const veloEfficiencyHours = input.veloEfficiencyHours ?? input.durationHours
  const gloTimeDivisor = computeTimeDivisor(gloEfficiencyHours)
  const veloTimeDivisor = computeTimeDivisor(veloEfficiencyHours)

  return {
    durationHours: input.durationHours,
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
