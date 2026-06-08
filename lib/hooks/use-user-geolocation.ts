"use client"

import * as React from "react"

import { useIsClient } from "@/lib/hooks/use-is-client"

export type UserGeolocation = {
  lat: number
  lng: number
  accuracy?: number
}

export type EditorMapGeolocationPhase = "prompt" | "ready"

const GEO_STRATEGIES: PositionOptions[] = [
  { enableHighAccuracy: false, timeout: 25_000, maximumAge: 300_000 },
  { enableHighAccuracy: true, timeout: 20_000, maximumAge: 60_000 },
  { enableHighAccuracy: false, timeout: 15_000, maximumAge: 0 },
]

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

function isIOSDevice(): boolean {
  if (typeof navigator === "undefined") return false
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  )
}

/** In-tab Safari on iOS (not Home Screen standalone). */
export function isIOSSafariBrowser(): boolean {
  if (typeof navigator === "undefined" || typeof window === "undefined") return false
  if (!isIOSDevice()) return false

  const standalone =
    (navigator as Navigator & { standalone?: boolean }).standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches

  if (standalone) return false

  const ua = navigator.userAgent
  return /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua)
}

function getPositionOnce(options: PositionOptions): Promise<UserGeolocation | null> {
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(parsePosition(position)),
      () => resolve(null),
      options
    )
  })
}

function getPositionViaWatch(options: PositionOptions, maxWaitMs: number): Promise<UserGeolocation | null> {
  return new Promise((resolve) => {
    let settled = false
    let watchId = -1

    const finish = (value: UserGeolocation | null) => {
      if (settled) return
      settled = true
      if (watchId >= 0) navigator.geolocation.clearWatch(watchId)
      window.clearTimeout(timer)
      resolve(value)
    }

    watchId = navigator.geolocation.watchPosition(
      (position) => finish(parsePosition(position)),
      () => finish(null),
      options
    )

    const timer = window.setTimeout(() => finish(null), maxWaitMs)
  })
}

async function requestCurrentPositionWithFallbacks(
  skipFirstStrategy = false
): Promise<UserGeolocation | null> {
  const strategies = skipFirstStrategy ? GEO_STRATEGIES.slice(1) : GEO_STRATEGIES

  for (const options of strategies) {
    const parsed = await getPositionOnce(options)
    if (parsed) return parsed
  }

  if (isIOSSafariBrowser()) {
    return getPositionViaWatch(GEO_STRATEGIES[0], 20_000)
  }

  return null
}

/**
 * Must be called synchronously inside a user gesture (click / pointerup).
 * iOS Safari drops the request if the triggering element unmounts before the prompt appears.
 */
function beginGeolocationRequest(
  onSuccess: (location: UserGeolocation | null) => void
): void {
  if (!canUseGeolocation()) {
    onSuccess(null)
    return
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const parsed = parsePosition(position)
      if (parsed) {
        onSuccess(parsed)
        return
      }
      void requestCurrentPositionWithFallbacks(true).then(onSuccess)
    },
    () => {
      void requestCurrentPositionWithFallbacks(true).then(onSuccess)
    },
    GEO_STRATEGIES[0]
  )
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
  const [isLocating, setIsLocating] = React.useState(false)
  const [locationFailed, setLocationFailed] = React.useState(false)

  const geolocationSupported = isClient && canUseGeolocation()
  const showSafariHint = isClient && isIOSSafariBrowser()

  const requestLocation = React.useCallback(() => {
    if (!canUseGeolocation()) {
      setPhase("ready")
      return
    }

    setLocationFailed(false)

    // Start geolocation in the same user-gesture tick — before any UI that unmounts the button.
    beginGeolocationRequest((parsed) => {
      setIsLocating(false)
      if (parsed) {
        setLocation(parsed)
        setLocationFailed(false)
        setPhase("ready")
        return
      }
      setLocationFailed(true)
    })

    setIsLocating(true)
  }, [])

  const skipLocation = React.useCallback(() => {
    setIsLocating(false)
    setLocationFailed(false)
    setPhase("ready")
  }, [])

  return {
    phase,
    location,
    isLocating,
    locationFailed,
    geolocationSupported,
    showSafariHint,
    requestLocation,
    skipLocation,
  }
}
