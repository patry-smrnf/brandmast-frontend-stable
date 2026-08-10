import {
  computeBrandmasterBonus,
  type BrandmasterBonusBreakdown,
  type BrandmasterBonusInput,
} from "./brandmaster-bonus-utils"

export type { BrandmasterBonusBreakdown, BrandmasterBonusInput } from "./brandmaster-bonus-utils"

/** Bonus za poprzedni miesiąc -na razie ta sama logika co bieżący miesiąc. */
export function computeBrandmasterPreviousMonthBonus(
  input: BrandmasterBonusInput,
): BrandmasterBonusBreakdown {
  return computeBrandmasterBonus(input)
}
