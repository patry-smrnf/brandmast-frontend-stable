"use client"

import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  RefreshCwIcon,
  SearchIcon,
  StoreIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { Event } from "@/lib/api/generated/types"
import { getShopAddress } from "@/lib/shops/shop-utils"

import { getShopDisplayName } from "./planner-utils"
import type { ActionPlannerState } from "./use-action-planner-state"

type PlannerStep1ShopsProps = {
  state: ActionPlannerState
}

export default function PlannerStep1Shops({ state }: PlannerStep1ShopsProps) {
  const {
    events,
    eventsLoading,
    eventsError,
    selectedEventId,
    handleEventChange,
    shopViewMode,
    handleViewModeChange,
    shopsLoading,
    shopsError,
    filteredShops,
    selectedShopIds,
    toggleShop,
    clearSelectedShops,
    shopQuery,
    setShopQuery,
    isClient,
    step1NextBlocked,
    setStep,
  } = state

  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-1">
        <CardTitle className="inline-flex items-center gap-2">
          <StoreIcon className="size-5 text-muted-foreground" />
          Wybierz sklepy
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="planner-event">Event</Label>
          <select
            id="planner-event"
            value={selectedEventId ?? ""}
            onChange={(e) => handleEventChange(e.target.value)}
            disabled={isClient && eventsLoading}
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            <option value="">
              {eventsLoading ? "Ładowanie eventów…" : "Wybierz event…"}
            </option>
            {events.map((ev: Event) => (
              <option key={ev.id ?? ev.ident} value={ev.id ?? ""}>
                {ev.name?.trim() || ev.ident || `Event #${ev.id}`}
              </option>
            ))}
          </select>
          {eventsError ? (
            <p className="flex items-center gap-1.5 text-xs text-destructive">
              <AlertTriangleIcon className="size-3.5 shrink-0" />
              {eventsError}
            </p>
          ) : null}
        </div>

        {selectedEventId != null ? (
          <>
            <div
              className="grid w-full grid-cols-2 gap-1 rounded-xl border border-border bg-muted/50 p-1 shadow-xs"
              role="group"
              aria-label="Widok listy sklepów"
            >
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-pressed={shopViewMode === "all"}
                onClick={() => handleViewModeChange("all")}
                className={cn(
                  "h-9 w-full rounded-lg text-xs font-medium sm:text-sm",
                  shopViewMode === "all"
                    ? "bg-background text-foreground shadow-sm hover:bg-background"
                    : "text-muted-foreground hover:bg-background/70 hover:text-foreground",
                )}
              >
                Wszystkie sklepy
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-pressed={shopViewMode === "top50"}
                onClick={() => handleViewModeChange("top50")}
                className={cn(
                  "h-9 w-full rounded-lg text-xs font-medium sm:text-sm",
                  shopViewMode === "top50"
                    ? "bg-background text-foreground shadow-sm hover:bg-background"
                    : "text-muted-foreground hover:bg-background/70 hover:text-foreground",
                )}
              >
                Top 50
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <Badge variant="secondary" className="tabular-nums">
                Wybrano: {selectedShopIds.size}
              </Badge>
              {selectedShopIds.size > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={clearSelectedShops}
                >
                  Odznacz wszystkie
                </Button>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="planner-shop-search">Szukaj po adresie</Label>
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="planner-shop-search"
                  placeholder={shopsLoading ? "Ładowanie sklepów…" : "Zacznij pisać adres…"}
                  value={shopQuery}
                  className="pl-10"
                  autoComplete="off"
                  onChange={(e) => setShopQuery(e.target.value)}
                />
              </div>
            </div>

            {shopsError ? (
              <p className="flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                <AlertTriangleIcon className="size-4 shrink-0" />
                {shopsError}
              </p>
            ) : null}

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>Lista sklepów</span>
                {shopsLoading ? (
                  <span className="inline-flex items-center gap-1">
                    <RefreshCwIcon className="size-3.5 animate-spin" />
                    Ładowanie…
                  </span>
                ) : (
                  <span className="tabular-nums">{filteredShops.length} sklepów</span>
                )}
              </div>

              <div className="max-h-[min(420px,50vh)] space-y-1.5 overflow-auto rounded-xl border border-border bg-muted/20 p-2">
                {shopsLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
                  ))
                ) : filteredShops.length === 0 ? (
                  <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                    {shopQuery.trim()
                      ? "Brak sklepów pasujących do wyszukiwania."
                      : "Brak sklepów dla wybranego eventu."}
                  </p>
                ) : (
                  filteredShops.map((s) => {
                    const id = s.id ?? 0
                    const isSelected = selectedShopIds.has(id)
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => toggleShop(id)}
                        aria-pressed={isSelected}
                        className={cn(
                          "flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-all",
                          isSelected
                            ? "border-emerald-500/55 bg-emerald-500/10 shadow-sm ring-1 ring-emerald-500/20"
                            : "border-border bg-card hover:border-border/80 hover:bg-muted/60",
                        )}
                      >
                        <div
                          className={cn(
                            "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                            isSelected
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : "border-border bg-background",
                          )}
                        >
                          {isSelected ? <CheckCircle2Icon className="size-3.5" /> : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="truncate text-sm font-medium">
                              {getShopAddress(s) || getShopDisplayName(s)}
                            </span>
                            {isSelected ? (
                              <Badge variant="success" className="shrink-0 text-[10px]">
                                Już wybrany
                              </Badge>
                            ) : null}
                          </div>
                          {s.name ? (
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">{s.name}</p>
                          ) : null}
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          </>
        ) : (
          <p className="rounded-xl border border-dashed border-border/80 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
            Wybierz event, aby załadować sklepy.
          </p>
        )}

        <div className="flex items-center justify-end gap-3 pt-1">
          <Button
            className="shadow-sm"
            disabled={step1NextBlocked}
            onClick={() => setStep(2)}
          >
            Dalej
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
