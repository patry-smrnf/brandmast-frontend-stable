"use client"

import * as React from "react"
import {
  AlertTriangleIcon,
  CalendarDaysIcon,
  ListChecksIcon,
  PenLineIcon,
  RefreshCwIcon,
  ShuffleIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

import { formatHeaderDate, parseIso, toDateKey, toMonthKey } from "../brandmaster/actions/date-utils"
import { SupervisorActionCard } from "./_components/SupervisorActionCard"
import { getScheduleConflictLayout } from "./conflict-utils"
import type { SvActionRow } from "./use-sv-actions"
import { useSvActions } from "./use-sv-actions"

function pickRandomBrandmasterFromCluster(
  cluster: SvActionRow[]
): { name: string; surname: string } | null {
  const byId = new Map<number, { name: string; surname: string }>()
  for (const r of cluster) {
    const id = r.brandmaster.idBrandmaster
    if (!byId.has(id)) {
      byId.set(id, { name: r.brandmaster.name, surname: r.brandmaster.surname })
    }
  }
  const list = [...byId.values()]
  if (list.length === 0) return null
  return list[Math.floor(Math.random() * list.length)]!
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-xl border border-border/80 bg-card p-4 pl-5 shadow-sm"
        >
          <div className="flex justify-between gap-3">
            <div className="h-4 w-48 animate-pulse rounded-md bg-muted" />
            <div className="h-5 w-20 shrink-0 animate-pulse rounded-full bg-muted" />
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-4 w-full animate-pulse rounded-md bg-muted" />
            <div className="h-4 w-40 animate-pulse rounded-md bg-muted" />
          </div>
          <div className="mt-4 flex justify-end">
            <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function SupervisorPage() {
  const [selectedDateKey, setSelectedDateKey] = React.useState(() => toDateKey(new Date()))
  const [search, setSearch] = React.useState("")
  const [editableOnly, setEditableOnly] = React.useState(false)
  const [eventFilter, setEventFilter] = React.useState<string>("")
  const [collisionDraw, setCollisionDraw] = React.useState<{
    winner: { name: string; surname: string }
    shopName: string
  } | null>(null)

  const selectedDate = React.useMemo(() => {
    const d = parseIso(`${selectedDateKey}T12:00:00`)
    return d ?? new Date()
  }, [selectedDateKey])

  const monthKey = React.useMemo(() => toMonthKey(selectedDate), [selectedDate])
  const headerDate = React.useMemo(() => formatHeaderDate(selectedDate), [selectedDate])

  const { rows, isLoading, error, refetch } = useSvActions(monthKey)

  const eventOptions = React.useMemo(() => {
    const map = new Map<number, string>()
    for (const r of rows) {
      const id = r.action.event.idEvent
      if (id) map.set(id, r.action.event.name || `Wydarzenie #${id}`)
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], "pl"))
  }, [rows])

  const filteredRows = React.useMemo(() => {
    let list = rows.filter((r) => {
      const d = parseIso(r.action.since)
      return d && toDateKey(d) === selectedDateKey
    })

    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter((r) => {
        const addr = (r.action.shop.address ?? "").toLowerCase()
        const nm = `${r.brandmaster.name} ${r.brandmaster.surname}`.toLowerCase()
        return addr.includes(q) || nm.includes(q)
      })
    }

    if (editableOnly) {
      list = list.filter((r) => r.action.status.toUpperCase() === "EDITABLE")
    }

    const eventId = eventFilter ? Number(eventFilter) : 0
    if (eventId) {
      list = list.filter((r) => r.action.event.idEvent === eventId)
    }

    return list
  }, [rows, selectedDateKey, search, editableOnly, eventFilter])

  const countForDayAll = React.useMemo(() => {
    return rows.filter((r) => {
      const d = parseIso(r.action.since)
      return d && toDateKey(d) === selectedDateKey
    }).length
  }, [rows, selectedDateKey])

  const { clusters, singles } = React.useMemo(
    () => getScheduleConflictLayout(filteredRows),
    [filteredRows]
  )

  React.useEffect(() => {
    if (!collisionDraw) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCollisionDraw(null)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [collisionDraw])

  React.useEffect(() => {
    if (!collisionDraw) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [collisionDraw])

  return (
    <main className="flex flex-1 flex-col bg-background pb-24">
      <div className="mx-auto w-full max-w-5xl px-4 py-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDaysIcon className="size-3.5" />
                <span className="font-medium text-foreground">Supervisor</span>
              </span>
              <span className="text-muted-foreground/60">•</span>
              <span className="tabular-nums">{monthKey}</span>
              {isLoading ? (
                <>
                  <span className="text-muted-foreground/60">•</span>
                  <span className="inline-flex items-center gap-1.5">
                    <RefreshCwIcon className="size-3.5 animate-spin" />
                    Ładowanie
                  </span>
                </>
              ) : null}
            </div>

            <div className="mt-3 flex flex-wrap items-end gap-4 gap-y-2">
              <div className="flex min-w-0 items-baseline gap-3">
                <div className="bg-linear-to-br from-muted-foreground via-foreground to-primary bg-clip-text text-4xl font-semibold tracking-tight tabular-nums text-transparent">
                  {headerDate.day}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium capitalize text-foreground">
                    {headerDate.rest}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {error ? (
                      <span className="inline-flex items-center gap-1.5">
                        <AlertTriangleIcon className="size-3.5 text-destructive" />
                        <span className="truncate">{error}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5">
                        <ListChecksIcon className="size-3.5" />
                        <span>
                          <span className="font-medium text-foreground">{filteredRows.length}</span>
                          {editableOnly || search.trim() || eventFilter
                            ? ` pasujących (${countForDayAll} tego dnia w sumie)`
                            : ` akcji tego dnia`}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex w-full shrink-0 flex-col gap-1.5 sm:w-auto sm:min-w-[12rem]">
            <Label htmlFor="sv-day" className="text-xs text-muted-foreground">
              Dzień
            </Label>
            <Input
              id="sv-day"
              type="date"
              value={selectedDateKey}
              onChange={(e) => setSelectedDateKey(e.target.value)}
              className="tabular-nums sm:min-w-[11.5rem]"
            />
          </div>
        </header>

        <Separator className="my-6" />

        <section className="space-y-4">
          <Input
            type="search"
            placeholder="Szukaj po adresie lub brandmasterze…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
            autoComplete="off"
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <Button
              type="button"
              variant={editableOnly ? "default" : "outline"}
              size="sm"
              aria-pressed={editableOnly}
              onClick={() => setEditableOnly((v) => !v)}
              className="h-9 w-full justify-center gap-2 rounded-full shadow-xs sm:w-auto"
            >
              <PenLineIcon className="size-3.5 opacity-90" aria-hidden />
              Tylko EDITABLE
            </Button>

            <div className="flex w-full flex-col gap-1.5 sm:w-auto sm:min-w-[min(100%,14rem)] sm:max-w-xs">
              <Label htmlFor="sv-event" className="text-xs text-muted-foreground sm:text-right">
                Event name
              </Label>
              <select
                id="sv-event"
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
                className={cn(
                  "h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs",
                  "outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                )}
              >
                <option value="">Wszystkie eventy</option>
                {eventOptions.map(([id, name]) => (
                  <option key={id} value={String(id)}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <div className="mt-8 space-y-4">
          {isLoading ? (
            <LoadingSkeleton />
          ) : filteredRows.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border/80 bg-muted/30 px-4 py-10 text-center text-sm text-muted-foreground">
              Brak akcji dla wybranych kryteriów.
            </p>
          ) : (
            <>
              {clusters.map((cluster, clusterIdx) => {
                const shopName = cluster[0]?.action.shop.name?.trim() || "Sklep"
                const shopId = cluster[0]?.action.idShop ?? 0
                const clusterKey = cluster
                  .map((r) => r.action.idAction)
                  .sort((a, b) => a - b)
                  .join("-")
                return (
                  <section
                    key={`collision-${shopId}-${clusterKey}-${clusterIdx}`}
                    className="space-y-2 rounded-xl border border-amber-500/45 bg-amber-800/6 p-3 shadow-sm dark:border-amber-400/40 dark:bg-amber-900/4"
                  >
                    <div
                      role="alert"
                      className="flex flex-col gap-3 rounded-lg border border-amber-500/35 bg-background/80 px-3 py-2.5 text-sm sm:flex-row sm:items-start sm:gap-3 dark:bg-background/60"
                    >
                      <div className="flex min-w-0 flex-1 gap-2.5">
                        <AlertTriangleIcon
                          className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400"
                          aria-hidden
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-amber-950 dark:text-amber-50">
                            Kolizja akcji w jednym sklepie
                          </p>
                          <p className="mt-0.5 text-xs leading-snug text-amber-900/85 dark:text-amber-100/85">
                            <span className="font-medium text-foreground">{shopName}</span>
                            {" — "}
                            {cluster.length} akcje maja nachodzące na siebie przedziały czasu.
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 shrink-0 gap-1.5 self-end sm:self-start"
                        onClick={() => {
                          const winner = pickRandomBrandmasterFromCluster(cluster)
                          if (!winner) return
                          setCollisionDraw({ winner, shopName })
                        }}
                      >
                        <ShuffleIcon className="size-3.5" aria-hidden />
                        Wylosuj
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {cluster.map((row) => (
                        <SupervisorActionCard
                          key={row.action.idAction}
                          row={row}
                          onApproved={refetch}
                          scheduleConflict
                        />
                      ))}
                    </div>
                  </section>
                )
              })}
              {singles.length > 0 ? (
                <div className="space-y-3">
                  {singles.map((row) => (
                    <SupervisorActionCard key={row.action.idAction} row={row} onApproved={refetch} />
                  ))}
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>

      {collisionDraw ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-[1px] sm:items-center sm:pb-4"
          role="presentation"
          onClick={() => setCollisionDraw(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="collision-draw-title"
            className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="collision-draw-title" className="text-base font-semibold text-foreground">
              Wynik losowania
            </h2>
            <p className="mt-4 text-lg font-semibold tracking-tight text-foreground">
              {collisionDraw.winner.name} {collisionDraw.winner.surname}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Ten szczesciarz bedzie sobie dzisiaj tu akcjiowal{" "}
              <span className="font-medium text-foreground">{collisionDraw.shopName}</span>.
            </p>
            <Button type="button" className="mt-6 w-full" onClick={() => setCollisionDraw(null)}>
              Zamknij
            </Button>
          </div>
        </div>
      ) : null}
    </main>
  )
}
