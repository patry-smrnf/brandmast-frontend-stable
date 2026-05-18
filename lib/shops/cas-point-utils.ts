import type { TourPlannerPointListItem } from "@/lib/api/generated/types"

export function getCasPointKey(point: TourPlannerPointListItem, index: number) {
  return point.uuid?.trim() || point.ident?.trim() || `point-${index}`
}

export function formatCasPointAddress(point: TourPlannerPointListItem) {
  const a = point.address
  if (!a) return ""
  return [a.streetAddress?.trim(), a.cityName?.trim()].filter(Boolean).join(", ")
}

export function casPointMatchesQuery(point: TourPlannerPointListItem, q: string) {
  const query = q.trim().toLowerCase()
  if (!query) return true
  const hay = [
    point.name ?? "",
    point.ident ?? "",
    point.uuid ?? "",
    formatCasPointAddress(point),
  ]
    .join(" | ")
    .toLowerCase()
  return hay.includes(query)
}
