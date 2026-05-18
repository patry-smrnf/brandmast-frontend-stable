"use client"

import { cn } from "@/lib/utils"

import type { DataColumn } from "./types"

export type DataTableProps<T> = {
  data: T[]
  columns: DataColumn<T>[]
  getRowKey: (row: T, index: number) => string
  emptyMessage?: string
  onRowClick?: (row: T) => void
  className?: string
}

export function DataTable<T>({
  data,
  columns,
  getRowKey,
  emptyMessage = "Brak danych.",
  onRowClick,
  className,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border/80 bg-muted/30 px-4 py-10 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    )
  }

  return (
    <div className={cn("overflow-x-auto rounded-xl border border-border/80 bg-card shadow-sm", className)}>
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            {columns.map((col) => (
              <th
                key={col.id}
                scope="col"
                className={cn(
                  "px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                  col.headerClassName
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => {
            const key = getRowKey(row, index)
            const clickable = Boolean(onRowClick)
            return (
              <tr
                key={key}
                className={cn(
                  "border-b border-border/70 transition-colors last:border-b-0",
                  clickable ? "cursor-pointer hover:bg-muted/50" : null
                )}
                onClick={clickable ? () => onRowClick?.(row) : undefined}
                onKeyDown={
                  clickable
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          onRowClick?.(row)
                        }
                      }
                    : undefined
                }
                tabIndex={clickable ? 0 : undefined}
                role={clickable ? "button" : undefined}
              >
                {columns.map((col) => (
                  <td
                    key={col.id}
                    className={cn("px-3 py-2.5 align-top text-foreground", col.cellClassName)}
                  >
                    {col.cell(row, index)}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
