"use client"

import * as React from "react"

import {
  brandmastApi,
  type OneTwoOneAplikacjaZgloszenie,
  type OneTwoOneRivoVirto,
} from "@/lib/api"

import {
  getCurrentMonthKey,
  groupAplikacjeByMonth,
} from "./121-aplikacje-utils"
import type { Resolved121TeamContext } from "../121Sampling/use-121-resolved-team"

export function use121AplikacjeList(resolved: Resolved121TeamContext) {
  const [products, setProducts] = React.useState<OneTwoOneRivoVirto[]>([])
  const [zgloszenia, setZgloszenia] = React.useState<OneTwoOneAplikacjaZgloszenie[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [refetchTick, setRefetchTick] = React.useState(0)

  React.useEffect(() => {
    if (resolved.isLoading) return

    let cancelled = false

    async function run() {
      setIsLoading(true)
      setError(resolved.error)

      try {
        const [zgloszeniaRes, productsRes] = await Promise.all([
          brandmastApi.fetchZgloszeniaAplikacje(),
          brandmastApi.fetchProductsRivoVirto(),
        ])

        if (cancelled) return

        if (zgloszeniaRes.success === false) {
          setError(zgloszeniaRes.message ?? "Nie udało się pobrać zgłoszeń.")
          setProducts([])
          setZgloszenia([])
          return
        }

        const nextProducts =
          productsRes.success === false ? [] : (productsRes.data ?? [])
        setProducts(nextProducts)
        setZgloszenia(zgloszeniaRes.data ?? [])
        if (!resolved.error) setError(null)
      } catch (e) {
        if (cancelled) return
        setError(e instanceof Error ? e.message : "Nie udało się pobrać danych.")
        setProducts([])
        setZgloszenia([])
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [resolved.isLoading, resolved.error, refetchTick])

  const groups = React.useMemo(() => groupAplikacjeByMonth(zgloszenia), [zgloszenia])
  const currentMonthKey = React.useMemo(() => getCurrentMonthKey(), [])

  const refetch = React.useCallback(() => setRefetchTick((t) => t + 1), [])

  return {
    teams: resolved.teams,
    products,
    zgloszenia,
    groups,
    teamId: resolved.teamId,
    teamName: resolved.teamName,
    territoryIdent: resolved.territoryIdent,
    regionId: resolved.teamId,
    currentMonthKey,
    isLoading: resolved.isLoading || isLoading,
    error: error ?? resolved.error,
    refetch,
  }
}
