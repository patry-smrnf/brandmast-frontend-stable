import type {
  BrandmasterAddRequest,
  TourPlannerBrandmasterListItem,
} from "@/lib/api/generated/types"

export function getCasBrandmasterKey(item: TourPlannerBrandmasterListItem, index: number) {
  return item.uuid?.trim() || item.ident?.trim() || item.username?.trim() || `bm-${index}`
}

export function getCasBrandmasterFullName(item: TourPlannerBrandmasterListItem) {
  return [item.firstname?.trim(), item.lastname?.trim()].filter(Boolean).join(" ")
}

export function casBrandmasterMatchesQuery(item: TourPlannerBrandmasterListItem, q: string) {
  const query = q.trim().toLowerCase()
  if (!query) return true
  const hay = [
    item.firstname ?? "",
    item.lastname ?? "",
    getCasBrandmasterFullName(item),
    item.username ?? "",
    item.emailAddress ?? "",
    item.ident ?? "",
    item.uuid ?? "",
  ]
    .join(" | ")
    .toLowerCase()
  return hay.includes(query)
}

export function buildBrandmasterAddRequest(
  item: TourPlannerBrandmasterListItem,
): BrandmasterAddRequest {
  return {
    name: item.firstname?.trim(),
    surname: item.lastname?.trim(),
    tpUuid: item.uuid?.trim(),
    email: item.emailAddress?.trim(),
    login: item.ident?.trim(),
  }
}

export function casBrandmasterLabel(item: TourPlannerBrandmasterListItem, index: number) {
  const name = getCasBrandmasterFullName(item)
  const login = item.username?.trim()
  if (name && login) return `${name} (${login})`
  return name || login || item.ident?.trim() || `brandmaster ${index + 1}`
}
