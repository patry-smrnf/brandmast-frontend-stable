import type { ShopResponse } from "@/lib/api/generated/types"
import { getShopAddress } from "@/lib/shops/shop-utils"

export type PlannerStep = 1 | 2 | 3
export type ShopViewMode = "all" | "top50"

export function getShopEventId(s: ShopResponse): number {
  return s.event?.id ?? 0
}

export function getShopDisplayName(s: ShopResponse): string {
  return s.name?.trim() || getShopAddress(s) || `Sklep #${s.id ?? "?"}`
}

export function filterShopsByEventId(shops: ShopResponse[], eventId: number): ShopResponse[] {
  return shops.filter((s) => getShopEventId(s) === eventId)
}

export function shopAddressMatchesQuery(s: ShopResponse, q: string): boolean {
  const query = q.trim().toLowerCase()
  if (!query) return true
  const address = getShopAddress(s).toLowerCase()
  const name = (s.name ?? "").toLowerCase()
  return address.includes(query) || name.includes(query)
}

export type PlannerTaskStatus = "pending" | "running" | "success" | "error"

export type PlannerTask = {
  key: string
  shopId: number
  shopName: string
  shopAddress: string
  dateKey: string
  dateLabel: string
  status: PlannerTaskStatus
  errorMessage?: string
}

export function buildPlannerTasks(
  shops: ShopResponse[],
  selectedShopIds: Set<number>,
  sortedDates: Date[],
  formatDateLabel: (d: Date) => string,
  toDateKey: (d: Date) => string,
): PlannerTask[] {
  const tasks: PlannerTask[] = []
  const shopById = new Map(shops.map((s) => [s.id ?? 0, s]))

  for (const shopId of selectedShopIds) {
    const shop = shopById.get(shopId)
    if (!shop) continue
    const shopName = getShopDisplayName(shop)
    const shopAddress = getShopAddress(shop)

    for (const date of sortedDates) {
      const dateKey = toDateKey(date)
      tasks.push({
        key: `${shopId}-${dateKey}`,
        shopId,
        shopName,
        shopAddress,
        dateKey,
        dateLabel: formatDateLabel(date),
        status: "pending",
      })
    }
  }

  return tasks
}
