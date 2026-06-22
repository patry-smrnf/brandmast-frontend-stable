"use client"

import * as React from "react"
import {
  AlertTriangleIcon,
  BanIcon,
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

import { formatHeaderDate, parseIso, toDateKey, toMonthKey } from "@/lib/dates/date-utils"
import { SupervisorActionCard } from "./_components/SupervisorActionCard"
import { SupervisorBulkApproveDialog } from "./_components/SupervisorBulkApproveDialog"
import { SupervisorBulkToolbar } from "./_components/SupervisorBulkToolbar"
import { getScheduleConflictLayout } from "./conflict-utils"
import { EXCLUDED_BULK_APPROVE_EVENT_ID } from "./supervisor-constants"
import type { SvActionRow } from "./use-sv-actions"
import { useSvActions } from "./use-sv-actions"

type SvStatusFilterMode = "all" | "editable" | "cancel_requested"

function isBulkApproveEligible(row: SvActionRow): boolean {
  return row.action.event.idEvent !== EXCLUDED_BULK_APPROVE_EVENT_ID
}

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
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-lg border border-border/80 bg-card px-2.5 py-2 pl-3 shadow-sm sm:px-3 sm:py-2.5 sm:pl-3.5"
        >
          <div className="flex justify-between gap-2">
            <div className="h-3.5 w-40 animate-pulse rounded-md bg-muted sm:h-4 sm:w-48" />
            <div className="h-5 w-16 shrink-0 animate-pulse rounded-full bg-muted sm:w-20" />
          </div>
          <div className="mt-1 space-y-1">
            <div className="h-3 w-full animate-pulse rounded-md bg-muted sm:h-3.5" />
            <div className="h-3 w-2/3 animate-pulse rounded-md bg-muted sm:h-3.5" />
          </div>
          <div className="mt-1 flex items-start justify-between gap-2">
            <div className="h-3 min-w-0 flex-1 animate-pulse rounded-md bg-muted" />
            <div className="h-7 w-20 shrink-0 animate-pulse rounded-md bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function SupervisorPage() {
  const [selectedDateKey, setSelectedDateKey] = React.useState(() => toDateKey(new Date()))
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<SvStatusFilterMode>("all")
  const [eventFilter, setEventFilter] = React.useState<string>("")
  const [collisionDraw, setCollisionDraw] = React.useState<{
    winner: { name: string; surname: string }
    shopName: string
  } | null>(null)
  const [bulkApproveEnabled, setBulkApproveEnabled] = React.useState(false)
  const [bulkSelectedIds, setBulkSelectedIds] = React.useState<Set<number>>(() => new Set())
  const [bulkDialogOpen, setBulkDialogOpen] = React.useState(false)
  const [bulkDialogRows, setBulkDialogRows] = React.useState<SvActionRow[]>([])

  const selectedDate = React.useMemo(() => {
    const d = parseIso(`${selectedDateKey}T12:00:00`)
    return d ?? new Date()
  }, [selectedDateKey])

  const monthKey = React.useMemo(() => toMonthKey(selectedDate), [selectedDate])
  const headerDate = React.useMemo(() => formatHeaderDate(selectedDate), [selectedDate])

  const { rows, isLoading, error, refetch, patchSvActionRow, patchSvActionCasStatus } =
    useSvActions(monthKey)

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

    if (statusFilter === "editable") {
      list = list.filter((r) => r.action.status === "EDITABLE")
    } else if (statusFilter === "cancel_requested") {
      list = list.filter((r) => r.action.status === "CANCEL_REQUESTED")
    }

    const eventId = eventFilter ? Number(eventFilter) : 0
    if (eventId) {
      list = list.filter((r) => r.action.event.idEvent === eventId)
    }

    return list
  }, [rows, selectedDateKey, search, statusFilter, eventFilter])

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

  const bulkEligibleSingles = React.useMemo(
    () => singles.filter(isBulkApproveEligible),
    [singles]
  )

  const bulkEligibleIdsKey = React.useMemo(
    () => bulkEligibleSingles.map((r) => r.action.idAction).join(","),
    [bulkEligibleSingles]
  )

  const bulkSelectedCount = React.useMemo(() => {
    const eligibleIds = new Set(bulkEligibleSingles.map((r) => r.action.idAction))
    let count = 0
    for (const id of bulkSelectedIds) {
      if (eligibleIds.has(id)) count++
    }
    return count
  }, [bulkEligibleSingles, bulkSelectedIds])

  const bulkSelectedRows = React.useMemo(
    () => bulkEligibleSingles.filter((r) => bulkSelectedIds.has(r.action.idAction)),
    [bulkEligibleSingles, bulkSelectedIds]
  )

  React.useEffect(() => {
    if (statusFilter !== "editable") {
      setBulkApproveEnabled(false)
      setBulkSelectedIds(new Set())
      setBulkDialogOpen(false)
    }
  }, [statusFilter])

  React.useEffect(() => {
    if (!bulkApproveEnabled || !bulkEligibleIdsKey) return
    const eligibleIds = new Set(
      bulkEligibleIdsKey
        .split(",")
        .filter(Boolean)
        .map((id) => Number(id))
    )
    setBulkSelectedIds((prev) => new Set([...prev].filter((id) => eligibleIds.has(id))))
  }, [bulkApproveEnabled, bulkEligibleIdsKey])

  function handleBulkApproveToggle(checked: boolean | "indeterminate") {
    if (checked === "indeterminate") return
    setBulkApproveEnabled(checked)
    if (checked) {
      setBulkSelectedIds(new Set(bulkEligibleSingles.map((r) => r.action.idAction)))
    } else {
      setBulkSelectedIds(new Set())
    }
  }

  function handleBulkCardSelect(idAction: number, selected: boolean) {
    setBulkSelectedIds((prev) => {
      const next = new Set(prev)
      if (selected) next.add(idAction)
      else next.delete(idAction)
      return next
    })
  }

  function handleStartBulkApprove() {
    if (bulkSelectedRows.length === 0) return
    setBulkDialogRows(bulkSelectedRows)
    setBulkDialogOpen(true)
  }

  const handleBulkComplete = React.useCallback(() => {
    void refetch()
  }, [refetch])

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
    <main
      className={cn(
        "flex flex-1 flex-col bg-background pb-24",
        bulkApproveEnabled && "max-sm:pb-44"
      )}
    >
      <div className="mx-auto w-full min-w-0 max-w-5xl overflow-x-clip px-4 py-6">
        <header className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
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
                          {statusFilter !== "all" || search.trim() || eventFilter
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

          <div className="flex w-full min-w-0 flex-col gap-1.5 sm:w-auto sm:min-w-[12rem]">
            <Label htmlFor="sv-day" className="text-xs text-muted-foreground">
              Dzień
            </Label>
            <Input
              id="sv-day"
              type="date"
              value={selectedDateKey}
              onChange={(e) => setSelectedDateKey(e.target.value)}
              className="tabular-nums"
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

          <div
            className="grid w-full grid-cols-3 gap-1 rounded-xl border border-border bg-muted/50 p-1 shadow-xs"
            role="group"
            aria-label="Filtr wg statusu akcji"
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-pressed={statusFilter === "all"}
              aria-label="Wszystkie akcje, niezależnie od statusu"
              onClick={() => setStatusFilter("all")}
              className={cn(
                "h-9 w-full min-w-0 justify-center gap-1.5 rounded-lg px-1.5 text-[11px] font-medium sm:gap-2 sm:px-2 sm:text-xs",
                statusFilter === "all"
                  ? "bg-background text-foreground shadow-sm hover:bg-background"
                  : "text-muted-foreground hover:bg-background/70 hover:text-foreground"
              )}
            >
              <ListChecksIcon className="size-3 shrink-0 opacity-90 sm:size-3.5" aria-hidden />
              <span className="truncate">Wszystkie</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-pressed={statusFilter === "editable"}
              aria-label="Tylko akcje ze statusem EDITABLE"
              onClick={() => setStatusFilter("editable")}
              className={cn(
                "h-9 w-full min-w-0 justify-center gap-1.5 rounded-lg px-1.5 text-[11px] font-medium sm:gap-2 sm:px-2 sm:text-xs",
                statusFilter === "editable"
                  ? "bg-background text-foreground shadow-sm hover:bg-background"
                  : "text-muted-foreground hover:bg-background/70 hover:text-foreground"
              )}
            >
              <PenLineIcon className="size-3 shrink-0 opacity-90 sm:size-3.5" aria-hidden />
              <span className="truncate">EDITABLE</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-pressed={statusFilter === "cancel_requested"}
              aria-label="Odwołania ze statusem CANCEL_REQUESTED"
              onClick={() => setStatusFilter("cancel_requested")}
              className={cn(
                "h-9 w-full min-w-0 justify-center gap-1.5 rounded-lg px-1.5 text-[11px] font-medium sm:gap-2 sm:px-2 sm:text-xs",
                statusFilter === "cancel_requested"
                  ? "bg-background text-foreground shadow-sm hover:bg-background"
                  : "text-muted-foreground hover:bg-background/70 hover:text-foreground"
              )}
            >
              <BanIcon className="size-3 shrink-0 opacity-90 sm:size-3.5" aria-hidden />
              <span className="truncate">Odwołania</span>
            </Button>
          </div>

          {statusFilter === "editable" ? (
            <SupervisorBulkToolbar
              enabled={bulkApproveEnabled}
              selectedCount={bulkSelectedCount}
              eligibleCount={bulkEligibleSingles.length}
              onEnabledChange={handleBulkApproveToggle}
              onStart={handleStartBulkApprove}
            />
          ) : null}
        </section>

        <div className="mt-8 space-y-3">
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
                    className="space-y-2 rounded-xl border border-amber-500/45 bg-amber-800/6 p-2.5 shadow-sm dark:border-amber-400/40 dark:bg-amber-900/4 sm:space-y-2.5 sm:p-3"
                  >
                    <div
                      role="alert"
                      className="flex flex-col gap-3 rounded-lg border border-amber-500/35 bg-background/85 px-2.5 py-2.5 dark:bg-background/65 sm:flex-row sm:items-center sm:gap-3 sm:px-3 sm:py-2.5"
                    >
                      <div className="flex min-w-0 flex-1 gap-2.5">
                        <div className="flex shrink-0 pt-0.5">
                          <AlertTriangleIcon
                            className="size-4 text-amber-600 dark:text-amber-400 sm:size-[1.125rem]"
                            aria-hidden
                          />
                        </div>
                        <div className="min-w-0 space-y-1">
                          <p className="text-xs font-semibold leading-tight text-amber-950 dark:text-amber-50">
                            Kolizja akcji w jednym sklepie
                          </p>
                          <p className="text-[11px] leading-snug text-amber-900/90 dark:text-amber-100/88 sm:text-xs sm:leading-relaxed">
                            <span className="font-medium text-foreground">{shopName}</span>
                            {" "}
                            {cluster.length} akcje mają nachodzące na siebie przedziały czasu.
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 w-full shrink-0 gap-1.5 px-3 text-xs sm:h-8 sm:w-auto sm:shrink-0 sm:px-3"
                        onClick={() => {
                          const winner = pickRandomBrandmasterFromCluster(cluster)
                          if (!winner) return
                          setCollisionDraw({ winner, shopName })
                        }}
                      >
                        <ShuffleIcon className="size-3.5" aria-hidden />
                        Wylosuj brandmastera
                      </Button>
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      {cluster.map((row) => (
                        <SupervisorActionCard
                          key={row.action.idAction}
                          row={row}
                          onApproved={refetch}
                          onPatched={patchSvActionRow}
                          onCasStatusPatched={patchSvActionCasStatus}
                          scheduleConflict
                        />
                      ))}
                    </div>
                  </section>
                )
              })}
              {singles.length > 0 ? (
                <div className="space-y-2">
                  {singles.map((row) => (
                    <SupervisorActionCard
                      key={row.action.idAction}
                      row={row}
                      onApproved={refetch}
                      onPatched={patchSvActionRow}
                      onCasStatusPatched={patchSvActionCasStatus}
                      bulkSelectMode={bulkApproveEnabled && isBulkApproveEligible(row)}
                      bulkSelected={bulkSelectedIds.has(row.action.idAction)}
                      onBulkSelectChange={(selected) => handleBulkCardSelect(row.action.idAction, selected)}
                    />
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

      <SupervisorBulkApproveDialog
        open={bulkDialogOpen}
        onOpenChange={setBulkDialogOpen}
        rows={bulkDialogRows}
        onComplete={handleBulkComplete}
      />
    </main>
  )
}
