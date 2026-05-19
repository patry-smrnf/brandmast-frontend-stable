"use client"

import { MapPinIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { DataColumn } from "@/components/data-display"
import type { ShopResponse } from "@/lib/api/generated/types"
import {
  formatShopCoords,
  getShopAddress,
  getShopEventName,
  getShopTourplannerIdent,
} from "@/lib/shops/shop-utils"
import { cn } from "@/lib/utils"

export function getShopRowKey(s: ShopResponse, index: number) {
  return String(s.id ?? `row-${index}`)
}

export const shopTableColumns: DataColumn<ShopResponse>[] = [
  {
    id: "name",
    header: "Nazwa",
    cell: (s) => (
      <span className="font-medium">{s.name?.trim() || <span className="text-muted-foreground">-</span>}</span>
    ),
  },
  {
    id: "address",
    header: "Adres",
    cell: (s) => {
      const addr = getShopAddress(s)
      return addr ? (
        <span className="line-clamp-2 max-w-xs">{addr}</span>
      ) : (
        <span className="text-muted-foreground">-</span>
      )
    },
  },
  {
    id: "event",
    header: "Event",
    cell: (s) => {
      const ev = getShopEventName(s)
      return ev ? (
        <Badge variant="secondary" className="max-w-[12rem] truncate font-normal">
          {ev}
        </Badge>
      ) : (
        <span className="text-muted-foreground">-</span>
      )
    },
  },
  {
    id: "tp",
    header: "Tourplanner",
    cell: (s) => {
      const ident = getShopTourplannerIdent(s)
      return ident ? (
        <span className="font-mono text-xs">{ident}</span>
      ) : (
        <span className="text-muted-foreground">-</span>
      )
    },
  },
  {
    id: "coords",
    header: "GPS",
    cell: (s) => (
      <span className="font-mono text-xs tabular-nums text-muted-foreground">{formatShopCoords(s)}</span>
    ),
  },
  {
    id: "id",
    header: "ID",
    headerClassName: "text-right",
    cellClassName: "text-right",
    cell: (s) => <span className="tabular-nums text-muted-foreground">{s.id ?? "-"}</span>,
  },
]

export type ShopCompactItemProps = {
  shop: ShopResponse
  selected?: boolean
}

export function ShopCompactItem({ shop, selected }: ShopCompactItemProps) {
  const address = getShopAddress(shop)
  const eventName = getShopEventName(shop)
  const title = shop.name?.trim() || address || "Sklep bez nazwy"
  const subtitle = shop.name?.trim() && address ? address : null

  return (
    <div
      className={cn(
        "flex w-full items-start gap-2.5 px-3 py-2.5",
        selected ? "bg-accent/50" : null
      )}
    >
      <MapPinIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 truncate text-sm font-medium leading-tight">{title}</p>
          {eventName ? (
            <Badge variant="outline" className="max-w-[42%] shrink-0 truncate text-[10px] font-normal">
              {eventName}
            </Badge>
          ) : null}
        </div>
        {subtitle ? (
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
    </div>
  )
}
