"use client"

import * as React from "react"
import {
  AlertTriangleIcon,
  LayoutListIcon,
  MapIcon,
  PlusIcon,
  RefreshCwIcon,
  StoreIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { shopMatchesQuery } from "@/lib/shops/shop-utils"
import { cn } from "@/lib/utils"

import { AddShopsSheet } from "./_components/AddShopsSheet"
import { ShopsListView } from "./_components/ShopsListView"
import { ShopsMapView } from "./_components/ShopsMapView"
import { useShops } from "./use-shops"

type ViewMode = "list" | "map"

function LoadingSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="h-14 animate-pulse rounded-xl border border-border/80 bg-muted/50"
        />
      ))}
    </div>
  )
}

export default function SupervisorShopsPage() {
  const [viewMode, setViewMode] = React.useState<ViewMode>("list")
  const [search, setSearch] = React.useState("")
  const [addShopsOpen, setAddShopsOpen] = React.useState(false)
  const { shops, isLoading, error, refetch, removeShopLocally } = useShops()

  const filteredShops = React.useMemo(
    () => shops.filter((s) => shopMatchesQuery(s, search)),
    [shops, search]
  )

  return (
    <main className="flex flex-1 flex-col bg-background pb-24">
      <div className="mx-auto w-full max-w-5xl px-4 py-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 space-y-1">
            <p className="text-xs text-muted-foreground">Panel Supervisora</p>
            <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight sm:text-2xl">
              <StoreIcon className="size-5 text-muted-foreground" aria-hidden />
              Sklepy w zespole
            </h1>
            <p className="max-w-prose text-sm text-muted-foreground">
              Podgląd lokalizacji przypisanych do teamu. Przełącz widok listy lub mapy.
            </p>
            <p className="text-xs text-muted-foreground">
              {isLoading ? (
                <span className="inline-flex items-center gap-1.5">
                  <RefreshCwIcon className="size-3.5 animate-spin" />
                  Ładowanie…
                </span>
              ) : error ? (
                <span className="inline-flex items-center gap-1.5 text-destructive">
                  <AlertTriangleIcon className="size-3.5" />
                  {error}
                </span>
              ) : (
                <span>
                  <span className="font-medium text-foreground">{filteredShops.length}</span>
                  {search.trim() ? ` pasujących (${shops.length} łącznie)` : ` sklepów`}
                </span>
              )}
            </p>
          </div>

          <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row">
            <Button
              type="button"
              size="sm"
              className="w-full sm:w-auto"
              disabled={isLoading}
              onClick={() => setAddShopsOpen(true)}
            >
              <PlusIcon className="size-4" />
              <span className="ml-2">Dodaj sklepy</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              disabled={isLoading}
              onClick={() => void refetch()}
            >
              <RefreshCwIcon className={cn("size-4", isLoading ? "animate-spin" : null)} />
              <span className="ml-2">Odśwież</span>
            </Button>
          </div>
        </header>

        <AddShopsSheet
          open={addShopsOpen}
          onOpenChange={setAddShopsOpen}
          existingShops={shops}
          onShopsAdded={() => void refetch()}
        />

        <Separator className="my-6" />

        <section className="space-y-4">
          <Input
            type="search"
            placeholder="Szukaj po nazwie, adresie, evencie, ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
            autoComplete="off"
          />

          <div
            className="grid w-full max-w-md grid-cols-2 gap-1 rounded-xl border border-border bg-muted/50 p-1 shadow-xs"
            role="group"
            aria-label="Tryb widoku"
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-pressed={viewMode === "list"}
              onClick={() => setViewMode("list")}
              className={cn(
                "h-9 w-full justify-center gap-1.5 rounded-lg text-xs font-medium",
                viewMode === "list"
                  ? "bg-background text-foreground shadow-sm hover:bg-background"
                  : "text-muted-foreground hover:bg-background/70 hover:text-foreground"
              )}
            >
              <LayoutListIcon className="size-3.5 shrink-0" aria-hidden />
              Lista
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-pressed={viewMode === "map"}
              onClick={() => setViewMode("map")}
              className={cn(
                "h-9 w-full justify-center gap-1.5 rounded-lg text-xs font-medium",
                viewMode === "map"
                  ? "bg-background text-foreground shadow-sm hover:bg-background"
                  : "text-muted-foreground hover:bg-background/70 hover:text-foreground"
              )}
            >
              <MapIcon className="size-3.5 shrink-0" aria-hidden />
              Mapa
            </Button>
          </div>
        </section>

        <div className="mt-8">
          {isLoading ? (
            <LoadingSkeleton />
          ) : viewMode === "list" ? (
            <ShopsListView
              shops={filteredShops}
              emptyMessage={
                search.trim()
                  ? "Brak sklepów pasujących do wyszukiwania."
                  : "Brak sklepów w zespole."
              }
            />
          ) : (
            <ShopsMapView
              shops={filteredShops}
              isLoading={isLoading}
              onShopDeleted={removeShopLocally}
            />
          )}
        </div>
      </div>
    </main>
  )
}
