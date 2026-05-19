import type { BrandmastersResponse } from "@/lib/api/generated/types"

export function getBrandmasterFullName(bm: BrandmastersResponse) {
  return [bm.name?.trim(), bm.surname?.trim()].filter(Boolean).join(" ")
}

export function getBrandmasterTpEmail(bm: BrandmastersResponse) {
  return bm.tourplannerData?.email?.trim() ?? ""
}

export function getBrandmasterTpUuid(bm: BrandmastersResponse) {
  return bm.tourplannerData?.uuid?.trim() ?? ""
}

/** Tourplanner UUID — matches `TourPlannerBrandmasterListItem.uuid` from CAS. */
export function buildExistingBrandmasterTpUuidSet(brandmasters: BrandmastersResponse[]) {
  const ids = new Set<string>()
  for (const bm of brandmasters) {
    const uuid = getBrandmasterTpUuid(bm)
    if (uuid) ids.add(uuid)
  }
  return ids
}

export function buildBrandmasterLabel(bm: BrandmastersResponse) {
  const name = getBrandmasterFullName(bm)
  const login = bm.login?.trim()
  if (name && login) return `${name} (${login})`
  return name || login || "Brandmaster"
}

export function brandmasterMatchesQuery(bm: BrandmastersResponse, q: string) {
  const query = q.trim().toLowerCase()
  if (!query) return true
  const hay = [
    bm.name ?? "",
    bm.surname ?? "",
    getBrandmasterFullName(bm),
    bm.login ?? "",
    getBrandmasterTpEmail(bm),
    getBrandmasterTpUuid(bm),
    String(bm.kasoterminal ?? ""),
    String(bm.brandmasterId ?? ""),
    buildBrandmasterLabel(bm),
  ]
    .join(" | ")
    .toLowerCase()
  return hay.includes(query)
}

export function getBrandmasterGroupKey(bm: BrandmastersResponse) {
  return bm.has121 ? "121" : "__no_121__"
}

export function getBrandmasterGroupLabel(key: string) {
  if (key === "121") return "121 skonfigurowane"
  return "Bez konfiguracji 121"
}

export function getBrandmasterRowKey(bm: BrandmastersResponse, index: number) {
  const id = bm.brandmasterId
  if (id != null) return String(id)
  const login = bm.login?.trim()
  if (login) return `login-${login}`
  return `row-${index}`
}
