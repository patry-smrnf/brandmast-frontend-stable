"use client"

import * as React from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

import type { UserGeolocation } from "@/lib/hooks/use-user-geolocation"
import { cn } from "@/lib/utils"

/** Poland-ish default when there are no markers */
const DEFAULT_VIEW: L.LatLngTuple = [52.1, 19.3]
const DEFAULT_ZOOM = 6
const USER_LOCATION_ZOOM = 14

function markerIcon(selected: boolean) {
  const fill = selected ? "#2563eb" : "#64748b"
  return L.divIcon({
    className: "bm-leaflet-marker",
    html: `<span style="display:block;width:22px;height:22px;border-radius:9999px;background:${fill};border:2px solid #fff;box-shadow:0 1px 4px rgba(15,23,42,.35)"></span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  })
}

function userLocationIcon() {
  return L.divIcon({
    className: "bm-leaflet-user-marker",
    html: `<span style="position:relative;display:block;width:18px;height:18px" aria-hidden="true">
      <span style="position:absolute;inset:-6px;border-radius:9999px;background:rgba(37,99,235,.25)"></span>
      <span style="position:absolute;inset:0;border-radius:9999px;background:#2563eb;border:2px solid #fff;box-shadow:0 1px 4px rgba(15,23,42,.35)"></span>
    </span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })
}

function fitMapView(
  map: L.Map,
  markers: EditorShopMapMarker[],
  selectedShopId: number | null,
  userLocation: UserGeolocation | null | undefined
) {
  const selectedOnMap =
    selectedShopId !== null ? markers.find((x) => x.id === selectedShopId) : undefined

  if (selectedOnMap) {
    const targetZoom = Math.min(16, Math.max(map.getZoom(), 14))
    map.flyTo([selectedOnMap.lat, selectedOnMap.lng], targetZoom, {
      duration: 0.45,
      easeLinearity: 0.22,
    })
    return
  }

  const points: L.LatLngTuple[] = markers.map((x) => [x.lat, x.lng])
  if (userLocation) {
    points.push([userLocation.lat, userLocation.lng])
  }

  if (points.length === 1) {
    const zoom = userLocation && markers.length === 0 ? USER_LOCATION_ZOOM : 13
    map.setView(points[0], zoom, { animate: false })
  } else if (points.length > 1) {
    const bounds = L.latLngBounds(points)
    map.fitBounds(bounds, { padding: [28, 28], maxZoom: 14, animate: false })
  } else if (userLocation) {
    map.setView([userLocation.lat, userLocation.lng], USER_LOCATION_ZOOM, { animate: false })
  } else {
    map.setView(DEFAULT_VIEW, DEFAULT_ZOOM, { animate: false })
  }
}

export type EditorShopMapMarker = {
  id: number
  lat: number
  lng: number
  label: string
}

export type EditorShopsMapProps = {
  markers: EditorShopMapMarker[]
  selectedShopId: number | null
  onMarkerSelect: (id: number) => void
  userLocation?: UserGeolocation | null
  isLoading?: boolean
  className?: string
}

export function EditorShopsMap({
  markers,
  selectedShopId,
  onMarkerSelect,
  userLocation,
  isLoading,
  className,
}: EditorShopsMapProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const mapRef = React.useRef<L.Map | null>(null)
  const layerRef = React.useRef<L.LayerGroup | null>(null)
  const userLayerRef = React.useRef<L.LayerGroup | null>(null)
  const onSelectRef = React.useRef(onMarkerSelect)
  onSelectRef.current = onMarkerSelect

  React.useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const map = L.map(el, {
      zoomControl: true,
      preferCanvas: true,
    }).setView(DEFAULT_VIEW, DEFAULT_ZOOM)

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    const group = L.layerGroup().addTo(map)
    const userGroup = L.layerGroup().addTo(map)
    mapRef.current = map
    layerRef.current = group
    userLayerRef.current = userGroup

    const fixSize = () => {
      map.invalidateSize()
    }
    window.addEventListener("resize", fixSize)

    return () => {
      window.removeEventListener("resize", fixSize)
      map.remove()
      mapRef.current = null
      layerRef.current = null
      userLayerRef.current = null
    }
  }, [])

  React.useEffect(() => {
    const map = mapRef.current
    const userLayer = userLayerRef.current
    if (!map || !userLayer) return

    userLayer.clearLayers()

    if (userLocation) {
      const userMarker = L.marker([userLocation.lat, userLocation.lng], {
        icon: userLocationIcon(),
        zIndexOffset: 1_000,
        interactive: false,
      })
      userMarker.bindTooltip("Twoja lokalizacja", {
        sticky: true,
        direction: "top",
        opacity: 0.95,
      })
      userMarker.addTo(userLayer)

      if (
        userLocation.accuracy != null &&
        Number.isFinite(userLocation.accuracy) &&
        userLocation.accuracy > 0 &&
        userLocation.accuracy <= 5_000
      ) {
        L.circle([userLocation.lat, userLocation.lng], {
          radius: userLocation.accuracy,
          color: "#2563eb",
          fillColor: "#2563eb",
          fillOpacity: 0.12,
          weight: 1,
          interactive: false,
        }).addTo(userLayer)
      }
    }
  }, [userLocation])

  React.useEffect(() => {
    const map = mapRef.current
    const layer = layerRef.current
    if (!map || !layer) return

    layer.clearLayers()

    for (const m of markers) {
      const selected = selectedShopId !== null && m.id === selectedShopId
      const marker = L.marker([m.lat, m.lng], {
        icon: markerIcon(selected),
        riseOnHover: true,
      })
      marker.bindTooltip(m.label, { sticky: true, direction: "top", opacity: 0.95 })
      marker.on("click", () => {
        onSelectRef.current(m.id)
      })
      marker.addTo(layer)
    }

    fitMapView(map, markers, selectedShopId, userLocation)

    queueMicrotask(() => map.invalidateSize())
  }, [markers, selectedShopId, userLocation])

  React.useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const t = window.setTimeout(() => map.invalidateSize(), 50)
    return () => window.clearTimeout(t)
  }, [isLoading, markers.length])

  return (
    <div className={cn("relative w-full", className)}>
      <div
        ref={containerRef}
        className={cn(
          "z-0 w-full min-h-[220px] rounded-xl border border-border bg-muted",
          // Mobile-first height: comfortable on phones, grows on larger screens
          "h-[min(52dvh,380px)] sm:h-[min(48vh,420px)]"
        )}
        aria-label="Mapa lokalizacji sklepów"
        role="region"
      />
      {isLoading ? (
        <div className="pointer-events-none absolute inset-0 z-400 flex items-center justify-center rounded-xl bg-background/70 backdrop-blur-[1px]">
          <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground shadow-sm">
            Ładowanie mapy…
          </div>
        </div>
      ) : null}
    </div>
  )
}
