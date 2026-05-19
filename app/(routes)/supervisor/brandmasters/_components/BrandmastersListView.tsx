"use client"

import * as React from "react"

import { groupItemsBy, ResponsiveDataView } from "@/components/data-display"
import type { BrandmastersResponse } from "@/lib/api/generated/types"
import {
  getBrandmasterGroupKey,
  getBrandmasterGroupLabel,
} from "@/lib/brandmasters/brandmaster-utils"

import {
  BrandmasterCompactItem,
  brandmasterTableColumns,
  getBrandmasterRowKey,
} from "../brandmaster-table-config"

export type BrandmastersListViewProps = {
  brandmasters: BrandmastersResponse[]
  emptyMessage?: string
  selectedId?: number | null
  onRowClick?: (bm: BrandmastersResponse) => void
}

export function BrandmastersListView({
  brandmasters,
  emptyMessage,
  selectedId,
  onRowClick,
}: BrandmastersListViewProps) {
  const groups = React.useMemo(
    () => groupItemsBy(brandmasters, getBrandmasterGroupKey, getBrandmasterGroupLabel),
    [brandmasters]
  )

  return (
    <ResponsiveDataView
      data={brandmasters}
      columns={brandmasterTableColumns}
      groups={groups}
      getRowKey={getBrandmasterRowKey}
      renderCompactItem={(bm) => (
        <BrandmasterCompactItem
          brandmaster={bm}
          selected={(bm.brandmasterId ?? 0) === (selectedId ?? -1)}
        />
      )}
      emptyMessage={emptyMessage}
      compactCollapsible
      onRowClick={onRowClick}
    />
  )
}
