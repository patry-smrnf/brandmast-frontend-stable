"use client"

import * as React from "react"

import {
  brandmastApi,
  type OneTwoOneRivoVirto,
  type OneTwoOneSampling,
} from "@/lib/api"

import {
  getCurrentMonthKey,
  groupSamplingsByMonth,
} from "./121-sampling-utils"
import type { Resolved121TeamContext } from "./use-121-resolved-team"

export function use121SamplingList(resolved: Resolved121TeamContext) {
  const [products, setProducts] = React.useState<OneTwoOneRivoVirto[]>([])
  const [samplings, setSamplings] = React.useState<OneTwoOneSampling[]>([])
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
        const [samplingsRes, productsRes] = await Promise.all([
          brandmastApi.fetchZgloszeniaSampling(),
          brandmastApi.fetchProductsRivoVirto(),
        ])

        if (cancelled) return

        if (samplingsRes.success === false) {
          setError(samplingsRes.message ?? "Nie udało się pobrać zgłoszeń.")
          setProducts([])
          setSamplings([])
          return
        }

        const nextProducts =
          productsRes.success === false ? [] : (productsRes.data ?? [])
        const teamId = resolved.teamId
        const allSamplings = samplingsRes.data ?? []
        const filtered =
          teamId != null
            ? allSamplings.filter((s) => s.region_id === teamId)
            : allSamplings

        setProducts(nextProducts)
        setSamplings(filtered)
        if (!resolved.error) setError(null)
      } catch (e) {
        if (cancelled) return
        setError(e instanceof Error ? e.message : "Nie udało się pobrać danych.")
        setProducts([])
        setSamplings([])
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [
    resolved.isLoading,
    resolved.teamId,
    resolved.error,
    refetchTick,
  ])

  const groups = React.useMemo(() => groupSamplingsByMonth(samplings), [samplings])
  const currentMonthKey = React.useMemo(() => getCurrentMonthKey(), [])

  const refetch = React.useCallback(() => setRefetchTick((t) => t + 1), [])

  return {
    teams: resolved.teams,
    products,
    samplings,
    groups,
    teamId: resolved.teamId,
    teamName: resolved.teamName,
    territoryIdent: resolved.territoryIdent,
    /** region_id w API — to samo co teamId */
    regionId: resolved.teamId,
    currentMonthKey,
    isLoading: resolved.isLoading || isLoading,
    error: error ?? resolved.error,
    refetch,
  }
}
