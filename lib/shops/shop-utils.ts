import type { ShopResponse } from "@/lib/api/generated/types"

export function getShopAddress(s: ShopResponse) {
  return s.location?.address?.trim() ?? ""
}

export function getShopEventName(s: ShopResponse) {
  return s.event?.name?.trim() ?? ""
}

export function getShopTourplannerIdent(s: ShopResponse) {
  return s.tourplanner?.ident?.trim() ?? ""
}

/** Tourplanner point UUID — matches `TourPlannerPointListItem.uuid` from CAS. */
export function getShopTourplannerId(s: ShopResponse) {
  return s.tourplanner?.id?.trim() ?? ""
}

export function buildExistingShopTpIdSet(shops: ShopResponse[]) {
  const ids = new Set<string>()
  for (const s of shops) {
    const id = getShopTourplannerId(s)
    if (id) ids.add(id)
  }
  return ids
}

export function buildShopLabel(s: ShopResponse) {
  const address = getShopAddress(s)
  const eventName = getShopEventName(s)
  return [address, eventName].filter(Boolean).join(" • ")
}

export function shopMatchesQuery(s: ShopResponse, q: string) {
  const query = q.trim().toLowerCase()
  if (!query) return true
  const hay = [
    s.name ?? "",
    getShopEventName(s),
    getShopAddress(s),
    getShopTourplannerIdent(s),
    String(s.id ?? ""),
    buildShopLabel(s),
  ]
    .join(" | ")
    .toLowerCase()
  return hay.includes(query)
}

export function getShopGroupKey(s: ShopResponse) {
  const event = getShopEventName(s)
  return event || "__other__"
}

export function getShopGroupLabel(key: string) {
  return key === "__other__" ? "Bez eventu" : key
}

export function formatShopCoords(s: ShopResponse) {
  const lat = s.location?.geoLat?.trim()
  const lng = s.location?.geoLng?.trim()
  if (!lat && !lng) return "—"
  if (lat && lng) return `${lat}, ${lng}`
  return lat || lng || "—"
}
