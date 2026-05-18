"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"

import type { DataGroup } from "./types"

export type CompactGroupedListProps<T> = {
  groups: DataGroup<T>[]
  getItemKey: (item: T, index: number) => string
  renderItem: (item: T, index: number) => React.ReactNode
  emptyMessage?: string
  onItemClick?: (item: T) => void
  className?: string
  /** Nagłówki grup zwijają / rozwijają listę pozycji */
  collapsible?: boolean
  /** Gdy collapsible — domyślnie wszystkie grupy zwinięte */
  defaultCollapsed?: boolean
}

function initialCollapsedKeys(groups: DataGroup<unknown>[], defaultCollapsed: boolean) {
  if (!defaultCollapsed) return new Set<string>()
  return new Set(groups.map((g) => g.key))
}

export function CompactGroupedList<T>({
  groups,
  getItemKey,
  renderItem,
  emptyMessage = "Brak danych.",
  onItemClick,
  className,
  collapsible = false,
  defaultCollapsed = false,
}: CompactGroupedListProps<T>) {
  const [collapsedKeys, setCollapsedKeys] = React.useState<Set<string>>(() =>
    initialCollapsedKeys(groups as DataGroup<unknown>[], defaultCollapsed)
  )

  React.useEffect(() => {
    setCollapsedKeys((prev) => {
      const valid = new Set(groups.map((g) => g.key))
      let pruned = false
      const next = new Set<string>()
      for (const key of prev) {
        if (valid.has(key)) next.add(key)
        else pruned = true
      }
      return pruned ? next : prev
    })
  }, [groups])

  const total = groups.reduce((n, g) => n + g.items.length, 0)

  function toggleGroup(key: string) {
    setCollapsedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  if (total === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border/80 bg-muted/30 px-4 py-10 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    )
  }

  return (
    <div className={cn("space-y-3", className)}>
      {groups.map((group) => {
        const collapsed = collapsible && collapsedKeys.has(group.key)

        return (
          <section
            key={group.key}
            className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm"
          >
            {collapsible ? (
              <button
                type="button"
                className={cn(
                  "flex w-full items-center justify-between gap-2 border-b border-border/70 bg-muted/35 px-3 py-2 text-left transition-colors",
                  "hover:bg-muted/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                  collapsed ? "border-b-0" : null
                )}
                aria-expanded={!collapsed}
                onClick={() => toggleGroup(group.key)}
              >
                <GroupHeaderContent
                  label={group.label}
                  count={group.items.length}
                  collapsible
                  collapsed={collapsed}
                />
              </button>
            ) : (
              <header className="flex items-center justify-between gap-2 border-b border-border/70 bg-muted/35 px-3 py-2">
                <GroupHeaderContent label={group.label} count={group.items.length} collapsible={false} />
              </header>
            )}
            {!collapsed ? (
              <ul className="divide-y divide-border/60">
                {group.items.map((item, index) => {
                  const key = getItemKey(item, index)
                  const clickable = Boolean(onItemClick)
                  return (
                    <li key={key}>
                      {clickable ? (
                        <button
                          type="button"
                          className="flex w-full text-left transition-colors hover:bg-muted/45 focus-visible:bg-muted/45 focus-visible:outline-none"
                          onClick={() => onItemClick?.(item)}
                        >
                          {renderItem(item, index)}
                        </button>
                      ) : (
                        <div>{renderItem(item, index)}</div>
                      )}
                    </li>
                  )
                })}
              </ul>
            ) : null}
          </section>
        )
      })}
    </div>
  )
}

function GroupHeaderContent({
  label,
  count,
  collapsible,
  collapsed = false,
}: {
  label: string
  count: number
  collapsible: boolean
  collapsed?: boolean
}) {
  return (
    <>
      <span className="flex min-w-0 flex-1 items-center gap-2">
        {collapsible ? (
          <ChevronDownIcon
            className={cn(
              "size-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
              collapsed ? "-rotate-90" : null
            )}
            aria-hidden
          />
        ) : null}
        <span className="min-w-0 truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
      </span>
      <span className="shrink-0 rounded-full bg-background px-2 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground shadow-xs">
        {count}
      </span>
    </>
  )
}
