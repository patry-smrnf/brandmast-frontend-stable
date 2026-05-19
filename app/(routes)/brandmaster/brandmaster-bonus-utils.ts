import type { SampleStatsGloCounts } from "@/lib/api"

export type BrandmasterBonusInput = {
  glo: SampleStatsGloCounts
  veloNet: number
  roundedHours: number
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
}

export type QualitativeBonusBreakdown = {
  tierLabel: string
  hiloRate: number
  hiloPlusRate: number
  veloRatePerUnit: number
  items: BonusLineItem[]
  total: number
}

export type BrandmasterEfficiency = {
  roundedHours: number
  timeDivisor: number
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

function gloEfficiencyTierLabel(gloEfficiency: number): string {
  if (gloEfficiency < 1.0) return "Glo < 1,0"
  if (gloEfficiency < 1.6) return "Glo < 1,6"
  return "Glo ≥ 1,6"
}

function getRegularGloRatePerDevice(
  veloEfficiency: number,
  gloEfficiency: number,
): { rate: number; tierLabel: string } {
  if (veloEfficiency < 5.0) {
    return { rate: 0, tierLabel: "Velo < 5,0 czyli brak bonusu Glo" }
  }
  if (veloEfficiency < 6.0) {
    const rate =
      gloEfficiency < 1.0 ? 10 : gloEfficiency < 1.6 ? 20 : 30
    return {
      rate,
      tierLabel: `Velo < 6,0 · ${gloEfficiencyTierLabel(gloEfficiency)}`,
    }
  }
  const rate = gloEfficiency < 1.0 ? 15 : gloEfficiency < 1.6 ? 30 : 40
  const veloBand =
    veloEfficiency < 7.9 ? "Velo < 7,9" : "Velo ≥ 7,9"
  return {
    rate,
    tierLabel: `${veloBand} · ${gloEfficiencyTierLabel(gloEfficiency)}`,
  }
}

function getRegularVeloRatePerUnit(veloEfficiency: number): number {
  if (veloEfficiency < 6.0) return 0
  return 2
}

export function computeRegularBonus(
  input: BrandmasterBonusInput,
  efficiency: BrandmasterEfficiency,
): RegularBonusBreakdown {
  const gloCount = efficiency.gloCount
  const veloCount = efficiency.veloCount
  const { rate: gloRatePerDevice, tierLabel } = getRegularGloRatePerDevice(
    efficiency.veloEfficiency,
    efficiency.gloEfficiency,
  )
  const veloRatePerUnit = getRegularVeloRatePerUnit(efficiency.veloEfficiency)

  const items: BonusLineItem[] = []
  if (gloCount > 0 && gloRatePerDevice > 0) {
    items.push(lineItem("Urządzenia Glo (łącznie)", gloCount, gloRatePerDevice))
  } else if (gloRatePerDevice === 0 && gloCount > 0) {
    items.push(lineItem("Urządzenia Glo (łącznie)", gloCount, 0))
  }
  if (veloCount > 0 && veloRatePerUnit > 0) {
    items.push(lineItem("Velo ", veloCount, veloRatePerUnit))
  }

  const total = items.reduce((sum, item) => sum + item.amount, 0)
  return {
    tierLabel,
    gloRatePerDevice,
    veloRatePerUnit,
    items,
    total,
  }
}

function getQualitativeRates(gloEfficiency: number): {
  hiloRate: number
  hiloPlusRate: number
  tierLabel: string
} {
  if (gloEfficiency < 1.0) {
    return { hiloRate: 25, hiloPlusRate: 40, tierLabel: gloEfficiencyTierLabel(gloEfficiency) }
  }
  if (gloEfficiency < 1.6) {
    return { hiloRate: 35, hiloPlusRate: 70, tierLabel: gloEfficiencyTierLabel(gloEfficiency) }
  }
  return { hiloRate: 45, hiloPlusRate: 70, tierLabel: gloEfficiencyTierLabel(gloEfficiency) }
}

export function computeQualitativeBonus(
  input: BrandmasterBonusInput,
  efficiency: BrandmasterEfficiency,
): QualitativeBonusBreakdown {
  const { hiloRate, hiloPlusRate, tierLabel } = getQualitativeRates(
    efficiency.gloEfficiency,
  )
  const veloRatePerUnit = 4
  const items: BonusLineItem[] = []

  if (input.glo.hilo > 0) {
    items.push(lineItem("Hilo", input.glo.hilo, hiloRate))
  }
  if (input.glo.hiloPlus > 0) {
    items.push(lineItem("Hilo+", input.glo.hiloPlus, hiloPlusRate))
  }
  if (efficiency.veloCount > 0) {
    items.push(lineItem("Velo", efficiency.veloCount, veloRatePerUnit))
  }

  const total = items.reduce((sum, item) => sum + item.amount, 0)
  return {
    tierLabel,
    hiloRate,
    hiloPlusRate,
    veloRatePerUnit,
    items,
    total,
  }
}

export function computeBrandmasterEfficiency(
  input: BrandmasterBonusInput,
): BrandmasterEfficiency {
  const gloCount = sumGloDeviceCount(input.glo)
  const veloCount = Math.max(0, input.veloNet)
  const timeDivisor = computeTimeDivisor(input.roundedHours)

  return {
    roundedHours: input.roundedHours,
    timeDivisor,
    gloCount,
    veloCount,
    gloEfficiency: computeEfficiency(gloCount, input.roundedHours),
    veloEfficiency: computeEfficiency(veloCount, input.roundedHours),
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
