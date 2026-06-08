"use client"

import * as React from "react"

import { useIsClient } from "@/lib/hooks/use-is-client"

export type UserGeolocation = {
  lat: number
  lng: number
  accuracy?: number
}

export type UserGeolocationStatus =
  | "idle"
  | "pending"
  | "granted"
  | "denied"
  | "unavailable"
  | "error"

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 15_000,
  maximumAge: 60_000,
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

function mapGeolocationError(error: GeolocationPositionError): UserGeolocationStatus {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "denied"
    case error.POSITION_UNAVAILABLE:
    case error.TIMEOUT:
      return "unavailable"
    default:
      return "error"
  }
}

function canUseGeolocation(): boolean {
  if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
    return false
  }
  if (typeof window !== "undefined" && !window.isSecureContext) {
    return false
  }
  return true
}

export function useUserGeolocation() {
  const isClient = useIsClient()
  const [location, setLocation] = React.useState<UserGeolocation | null>(null)
  const [status, setStatus] = React.useState<UserGeolocationStatus>("idle")
  const requestedRef = React.useRef(false)

  React.useEffect(() => {
    if (!isClient || requestedRef.current) return

    if (!canUseGeolocation()) {
      setStatus("unavailable")
      return
    }

    requestedRef.current = true
    setStatus("pending")

    let cancelled = false

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (cancelled) return
        const parsed = parsePosition(position)
        if (parsed) {
          setLocation(parsed)
          setStatus("granted")
        } else {
          setStatus("error")
        }
      },
      (error) => {
        if (cancelled) return
        setStatus(mapGeolocationError(error))
      },
      GEO_OPTIONS
    )

    return () => {
      cancelled = true
    }
  }, [isClient])

  return { location, status }
}
