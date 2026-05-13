"use client"

import * as React from "react"
import dynamic from "next/dynamic"

import type { ShopResponse } from "@/lib/api/generated/types"

import type { EditorShopMapMarker } from "./shops-map"

const EditorShopsMap = dynamic(
  () => import("./shops-map").then((m) => m.EditorShopsMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[220px] h-[min(52dvh,380px)] w-full items-center justify-center rounded-xl border border-border bg-muted text-sm text-muted-foreground sm:h-[min(48vh,420px)]">
        Ładowanie mapy…
      </div>
    ),
  }
)

export type EditorStep2MapSectionProps = {
  shopsLoading: boolean
  shopMapBundle: {
    markers: EditorShopMapMarker[]
    stats: {
      total: number
      onMap: number
      missingOrInvalid: number
      zeroZero: number
      notOnMap: number
    }
  }
  selectedShop: ShopResponse | null
  onMarkerSelect: (id: number) => void
}

export function EditorStep2MapSection({
  shopsLoading,
  shopMapBundle,
  selectedShop,
  onMarkerSelect,
}: EditorStep2MapSectionProps) {
  return (
    <div className="relative z-0 isolate space-y-2">
      {!shopsLoading && shopMapBundle.stats.total > 0 ? (
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
          <div className="tabular-nums">
            <span className="font-medium text-foreground">Na mapie:</span> {shopMapBundle.stats.onMap}
            <span className="text-muted-foreground"> / {shopMapBundle.stats.total}</span>
          </div>
          <div className="tabular-nums sm:text-right">
            <span className="font-medium text-foreground">Poza mapą</span>{" "}
            <span className="text-muted-foreground">(brak danych lub 0,0):</span> {shopMapBundle.stats.notOnMap}
          </div>
          {shopMapBundle.stats.notOnMap > 0 ? (
            <div className="w-full border-t border-border pt-2 text-[11px] sm:border-t-0 sm:border-l sm:pl-3 sm:pt-0">
              <span className="text-muted-foreground">Rozkład:</span> brak / błąd:{" "}
              {shopMapBundle.stats.missingOrInvalid}
              <span className="mx-1.5 text-border">·</span>
              współrzędne 0,0: {shopMapBundle.stats.zeroZero}
            </div>
          ) : null}
        </div>
      ) : null}

      {!shopsLoading && shopMapBundle.stats.total === 0 ? (
        <p className="text-xs text-muted-foreground">
          Brak sklepów z serwera — mapa pokazuje domyślny widok (Polska), punkty pojawią się po załadowaniu
          listy.
        </p>
      ) : null}

      <EditorShopsMap
        markers={shopMapBundle.markers}
        selectedShopId={selectedShop?.id ?? null}
        onMarkerSelect={onMarkerSelect}
        isLoading={shopsLoading}
      />
    </div>
  )
}
