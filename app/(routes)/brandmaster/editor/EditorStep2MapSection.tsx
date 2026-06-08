"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { Loader2Icon, MapPinIcon, NavigationIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useEditorMapGeolocation } from "@/lib/hooks/use-user-geolocation"
import type { ShopResponse } from "@/lib/api/generated/types"
import { cn } from "@/lib/utils"

import {
  buildShopEventFilterOptions,
  buildShopMapMarkersAndStats,
  filterShopsByEventId,
} from "./editor-utils"
import type { EditorShopMapMarker } from "./shops-map"

const EditorShopsMap = dynamic(
  () => import("./shops-map").then((m) => m.EditorShopsMap),
  {
    ssr: false,
    loading: () => <EditorMapPlaceholder message="Ładowanie mapy…" />,
  }
)

const MAP_SHELL_CLASS =
  "flex min-h-[220px] h-[min(52dvh,380px)] w-full flex-col items-center justify-center rounded-xl border border-border bg-muted sm:h-[min(48vh,420px)]"

function EditorMapPlaceholder({ message }: { message: string }) {
  return (
    <div className={cn(MAP_SHELL_CLASS, "gap-2 px-4 text-sm text-muted-foreground")}>
      <Loader2Icon className="size-5 animate-spin" aria-hidden />
      <p>{message}</p>
    </div>
  )
}

function EditorMapLocationPrompt({
  geolocationSupported,
  onRequestLocation,
  onSkip,
}: {
  geolocationSupported: boolean
  onRequestLocation: () => void
  onSkip: () => void
}) {
  return (
    <div
      className={cn(MAP_SHELL_CLASS, "gap-4 px-5 py-6 text-center")}
      role="region"
      aria-label="Prośba o dostęp do lokalizacji"
    >
      <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
        <NavigationIcon className="size-5" aria-hidden />
      </div>
      <div className="max-w-sm space-y-1.5">
        <p className="text-sm font-medium text-foreground">Udostępnij lokalizację</p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {geolocationSupported
            ? "Mapa może pokazać Twoją okolicę i ułatwić wybór najbliższego sklepu. Lokalizacja nie jest wysyłana na serwer."
            : "Twoja przeglądarka lub połączenie nie obsługuje lokalizacji — mapa załaduje się bez tej funkcji."}
        </p>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-2 sm:flex-row sm:justify-center">
        {geolocationSupported ? (
          <Button type="button" className="w-full sm:w-auto" onClick={onRequestLocation}>
            <MapPinIcon className="size-4" aria-hidden />
            Udostępnij lokalizację
          </Button>
        ) : null}
        <Button
          type="button"
          variant={geolocationSupported ? "outline" : "default"}
          className="w-full sm:w-auto"
          onClick={onSkip}
        >
          {geolocationSupported ? "Pomiń" : "Pokaż mapę"}
        </Button>
      </div>
    </div>
  )
}

export type EditorStep2MapSectionProps = {
  shops: ShopResponse[]
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
  shops,
  shopsLoading,
  shopMapBundle,
  selectedShop,
  onMarkerSelect,
}: EditorStep2MapSectionProps) {
  const { phase, location: userLocation, geolocationSupported, requestLocation, skipLocation } =
    useEditorMapGeolocation()
  const [eventFilterId, setEventFilterId] = React.useState<number | null>(null)

  const eventOptions = React.useMemo(() => buildShopEventFilterOptions(shops), [shops])

  React.useEffect(() => {
    if (eventFilterId == null) return
    if (!eventOptions.some((o) => o.id === eventFilterId)) {
      setEventFilterId(null)
    }
  }, [eventOptions, eventFilterId])

  const filteredMapBundle = React.useMemo(() => {
    if (eventFilterId == null) return shopMapBundle
    return buildShopMapMarkersAndStats(filterShopsByEventId(shops, eventFilterId))
  }, [shops, eventFilterId, shopMapBundle])

  const showEventFilter = !shopsLoading && eventOptions.length > 0
  const mapStats = filteredMapBundle.stats
  const mapReady = phase === "ready"

  return (
    <div className="relative z-0 isolate space-y-2">
      {showEventFilter && mapReady ? (
        <div className="space-y-1.5">
          <Label htmlFor="editor-map-event-filter" className="text-xs text-muted-foreground">
            Filtr eventu
          </Label>
          <select
            id="editor-map-event-filter"
            value={eventFilterId == null ? "" : String(eventFilterId)}
            onChange={(e) => {
              const raw = e.target.value
              setEventFilterId(raw ? Number(raw) : null)
            }}
            className={cn(
              "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
          >
            <option value="">Wszystkie eventy ({shops.length})</option>
            {eventOptions.map((o) => (
              <option key={o.id} value={String(o.id)}>
                {o.name} ({o.count})
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {!shopsLoading && mapStats.total > 0 && mapReady ? (
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
          <div className="tabular-nums">
            <span className="font-medium text-foreground">Na mapie:</span> {mapStats.onMap}
            <span className="text-muted-foreground"> / {mapStats.total}</span>
            {eventFilterId != null ? (
              <span className="ml-1 text-muted-foreground">(wybrany event)</span>
            ) : null}
          </div>
          <div className="tabular-nums sm:text-right">
            <span className="font-medium text-foreground">Poza mapą</span>{" "}
            <span className="text-muted-foreground">(brak danych lub 0,0):</span> {mapStats.notOnMap}
          </div>
          {mapStats.notOnMap > 0 ? (
            <div className="w-full border-t border-border pt-2 text-[11px] sm:border-t-0 sm:border-l sm:pl-3 sm:pt-0">
              <span className="text-muted-foreground">Rozkład:</span> brak / błąd:{" "}
              {mapStats.missingOrInvalid}
              <span className="mx-1.5 text-border">·</span>
              współrzędne 0,0: {mapStats.zeroZero}
            </div>
          ) : null}
        </div>
      ) : null}

      {!shopsLoading && shops.length === 0 && mapReady ? (
        <p className="text-xs text-muted-foreground">
          Brak sklepów z serwera - mapa pokazuje domyślny widok (Polska), punkty pojawią się po załadowaniu
          listy.
        </p>
      ) : null}

      {phase === "prompt" ? (
        <EditorMapLocationPrompt
          geolocationSupported={geolocationSupported}
          onRequestLocation={requestLocation}
          onSkip={skipLocation}
        />
      ) : null}

      {phase === "locating" ? <EditorMapPlaceholder message="Ustalanie lokalizacji…" /> : null}

      {mapReady ? (
        <EditorShopsMap
          markers={filteredMapBundle.markers}
          selectedShopId={selectedShop?.id ?? null}
          onMarkerSelect={onMarkerSelect}
          userLocation={userLocation}
          isLoading={shopsLoading}
        />
      ) : null}
    </div>
  )
}
