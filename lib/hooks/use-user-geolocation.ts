"use client"

import * as React from "react"

import { useIsClient } from "@/lib/hooks/use-is-client"

export type UserGeolocation = {
  lat: number
  lng: number
  accuracy?: number
}

export type EditorMapGeolocationPhase = "prompt" | "locating" | "ready"

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 20_000,
  maximumAge: 0,
}

function isValidCoordinates(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !(lat === 0 && lng === 0)
  )
}

function parsePosition(position: GeolocationPosition): UserGeolocation | null {
  const { latitude: lat, longitude: lng, accuracy } = position.coords
  if (!isValidCoordinates(lat, lng)) return null

  const parsed: UserGeolocation = { lat, lng }
  if (Number.isFinite(accuracy) && accuracy >= 0) {
    parsed.accuracy = accuracy
  }
  return parsed
}

export function canUseGeolocation(): boolean {
  if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
    return false
  }
  if (typeof window !== "undefined" && !window.isSecureContext) {
    return false
  }
  return true
}

function requestCurrentPosition(): Promise<UserGeolocation | null> {
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(parsePosition(position)),
      () => resolve(null),
      GEO_OPTIONS
    )
  })
}

/**
 * Editor map flow: show prompt first, load map only after the user decides.
 * Location is requested on explicit button click (required for iOS Safari).
 */
export function useEditorMapGeolocation() {
  const isClient = useIsClient()
  const [phase, setPhase] = React.useState<EditorMapGeolocationPhase>(() => {
    if (typeof window === "undefined") return "prompt"
    if (!canUseGeolocation()) return "ready"
    return "prompt"
  })
  const [location, setLocation] = React.useState<UserGeolocation | null>(null)

  const geolocationSupported = isClient && canUseGeolocation()

  const requestLocation = React.useCallback(() => {
    if (!canUseGeolocation()) {
      setPhase("ready")
      return
    }

    setPhase("locating")

    void requestCurrentPosition().then((parsed) => {
      if (parsed) setLocation(parsed)
      setPhase("ready")
    })
  }, [])

  const skipLocation = React.useCallback(() => {
    setPhase("ready")
  }, [])

  return {
    phase,
    location,
    geolocationSupported,
    requestLocation,
    skipLocation,
  }
}
