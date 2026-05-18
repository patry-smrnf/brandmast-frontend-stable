"use client"

import * as React from "react"

import { groupItemsBy, ResponsiveDataView } from "@/components/data-display"
import type { ShopResponse } from "@/lib/api/generated/types"
import { getShopGroupKey, getShopGroupLabel } from "@/lib/shops/shop-utils"

import {
  getShopRowKey,
  ShopCompactItem,
  shopTableColumns,
} from "../shop-table-config"

export type ShopsListViewProps = {
  shops: ShopResponse[]
  emptyMessage?: string
}

export function ShopsListView({ shops, emptyMessage }: ShopsListViewProps) {
  const groups = React.useMemo(
    () => groupItemsBy(shops, getShopGroupKey, getShopGroupLabel),
    [shops]
  )

  return (
    <ResponsiveDataView
      data={shops}
      columns={shopTableColumns}
      groups={groups}
      getRowKey={getShopRowKey}
      renderCompactItem={(shop) => <ShopCompactItem shop={shop} />}
      emptyMessage={emptyMessage}
      compactCollapsible
    />
  )
}
