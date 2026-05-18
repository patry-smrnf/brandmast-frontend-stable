"use client"

import * as React from "react"

import { CompactGroupedList } from "./CompactGroupedList"
import { DataTable } from "./DataTable"
import type { DataColumn, DataGroup } from "./types"

export type ResponsiveDataViewProps<T> = {
  data: T[]
  columns: DataColumn<T>[]
  groups: DataGroup<T>[]
  getRowKey: (row: T, index: number) => string
  renderCompactItem: (row: T, index: number) => React.ReactNode
  emptyMessage?: string
  onRowClick?: (row: T) => void
  className?: string
  /** Tailwind breakpoint prefix for desktop table, default `md` */
  desktopBreakpoint?: "sm" | "md" | "lg"
  /** Zwijane sekcje w widoku mobilnym (CompactGroupedList) */
  compactCollapsible?: boolean
  compactDefaultCollapsed?: boolean
}

const desktopHidden: Record<NonNullable<ResponsiveDataViewProps<unknown>["desktopBreakpoint"]>, string> =
  {
    sm: "sm:hidden",
    md: "md:hidden",
    lg: "lg:hidden",
  }

const desktopVisible: Record<NonNullable<ResponsiveDataViewProps<unknown>["desktopBreakpoint"]>, string> =
  {
    sm: "hidden sm:block",
    md: "hidden md:block",
    lg: "hidden lg:block",
  }

export function ResponsiveDataView<T>({
  data,
  columns,
  groups,
  getRowKey,
  renderCompactItem,
  emptyMessage,
  onRowClick,
  className,
  desktopBreakpoint = "md",
  compactCollapsible = false,
  compactDefaultCollapsed = false,
}: ResponsiveDataViewProps<T>) {
  return (
    <div className={className}>
      <div className={desktopHidden[desktopBreakpoint]}>
        <CompactGroupedList
          groups={groups}
          getItemKey={getRowKey}
          renderItem={renderCompactItem}
          emptyMessage={emptyMessage}
          onItemClick={onRowClick}
          collapsible={compactCollapsible}
          defaultCollapsed={compactDefaultCollapsed}
        />
      </div>
      <div className={desktopVisible[desktopBreakpoint]}>
        <DataTable
          data={data}
          columns={columns}
          getRowKey={getRowKey}
          emptyMessage={emptyMessage}
          onRowClick={onRowClick}
        />
      </div>
    </div>
  )
}

export function groupItemsBy<T>(
  items: T[],
  getGroupKey: (item: T) => string,
  getGroupLabel?: (key: string) => string
): DataGroup<T>[] {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const key = getGroupKey(item) || "__other__"
    const bucket = map.get(key)
    if (bucket) bucket.push(item)
    else map.set(key, [item])
  }

  const keys = [...map.keys()].sort((a, b) => {
    if (a === "__other__") return 1
    if (b === "__other__") return -1
    return a.localeCompare(b, "pl")
  })

  return keys.map((key) => ({
    key,
    label: getGroupLabel ? getGroupLabel(key) : key === "__other__" ? "Inne" : key,
    items: map.get(key) ?? [],
  }))
}
