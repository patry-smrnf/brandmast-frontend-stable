import type * as React from "react"

export type DataColumn<T> = {
  id: string
  header: React.ReactNode
  cell: (row: T, index: number) => React.ReactNode
  headerClassName?: string
  cellClassName?: string
}

export type DataGroup<T> = {
  key: string
  label: string
  items: T[]
}
