"use client"

import * as React from "react"
import {
  AlertTriangleIcon,
  RefreshCwIcon,
  UsersIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import type { BrandmastersResponse } from "@/lib/api/generated/types"
import { brandmasterMatchesQuery } from "@/lib/brandmasters/brandmaster-utils"
import { cn } from "@/lib/utils"

import { BrandmastersDetailPanel } from "./_components/BrandmastersDetailPanel"
import { BrandmastersListView } from "./_components/BrandmastersListView"
import { useBrandmasters } from "./use-brandmasters"

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

export default function SupervisorBrandmastersPage() {
  const [search, setSearch] = React.useState("")
  const [selected, setSelected] = React.useState<BrandmastersResponse | null>(null)
  const { brandmasters, isLoading, error, refetch, removeBrandmasterLocally } = useBrandmasters()

  const filteredBrandmasters = React.useMemo(
    () => brandmasters.filter((bm) => brandmasterMatchesQuery(bm, search)),
    [brandmasters, search]
  )

  const selectedId = selected?.brandmasterId ?? null

  React.useEffect(() => {
    if (!selected) return
    const stillExists = brandmasters.some(
      (bm) => (bm.brandmasterId ?? 0) === (selected.brandmasterId ?? 0)
    )
    if (!stillExists) setSelected(null)
  }, [brandmasters, selected])

  function onRowClick(bm: BrandmastersResponse) {
    setSelected(bm)
  }

  function onDeleted(id: number) {
    removeBrandmasterLocally(id)
    setSelected(null)
  }

  return (
    <main className="flex flex-1 flex-col bg-background pb-24">
      <div className="mx-auto w-full max-w-5xl px-4 py-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 space-y-1">
            <p className="text-xs text-muted-foreground">Panel Supervisora</p>
            <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight sm:text-2xl">
              <UsersIcon className="size-5 text-muted-foreground" aria-hidden />
              Brandmasterzy w zespole
            </h1>
            <p className="max-w-prose text-sm text-muted-foreground">
              Podgląd brandmasterów przypisanych do teamu. Wybierz wiersz, aby zobaczyć szczegóły
              lub usunąć konto.
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
                  <span className="font-medium text-foreground">{filteredBrandmasters.length}</span>
                  {search.trim()
                    ? ` pasujących (${brandmasters.length} łącznie)`
                    : ` brandmasterów`}
                </span>
              )}
            </p>
          </div>

          <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row">
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

        <Separator className="my-6" />

        <section className="space-y-4">
          <Input
            type="search"
            placeholder="Szukaj po imieniu, nazwisku, loginie, e-mailu, ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
            autoComplete="off"
          />
        </section>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
          <div>
            {isLoading ? (
              <LoadingSkeleton />
            ) : (
              <BrandmastersListView
                brandmasters={filteredBrandmasters}
                selectedId={selectedId}
                onRowClick={onRowClick}
                emptyMessage={
                  search.trim()
                    ? "Brak brandmasterów pasujących do wyszukiwania."
                    : "Brak brandmasterów w zespole."
                }
              />
            )}
          </div>

          {!isLoading ? (
            <BrandmastersDetailPanel selected={selected} onDeleted={onDeleted} />
          ) : null}
        </div>
      </div>
    </main>
  )
}
