export type { ActionStatus, NormalizedActionStatus } from "@/lib/action-status"

import type { NormalizedActionStatus } from "@/lib/action-status"

export type BrandmasterAction = {
  idAction: number
  status: NormalizedActionStatus
  since: string
  until: string
  createdAt: string
  updatedAt: string
  shop: {
    idShop: number
    name: string
    address: string
    geoLat: string | null
    geoLng: string | null
    tpShopId: string
    tpIdent: string
  }
  event: {
    idEvent: number
    name: string
    tpEventId: string
  }
}

export type ActionsPayload = {
  brandmaster: {
    idBrandmaster: number
    name: string
    surname: string
    account: {
      idAccount: number
      login: string
      createdAt: string
    }
  }
  actions: BrandmasterAction[]
}
