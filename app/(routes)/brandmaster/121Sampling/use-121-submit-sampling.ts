"use client"

import * as React from "react"

import { brandmastApi, type OneTwoOneRivoVirto, type TourPlannerActionListItem } from "@/lib/api"
import { nowInPoland } from "@/lib/dates/date-utils"

import { getMonthToTodayCasRange } from "./121-sampling-utils"

export function use121SubmitSampling(enabled: boolean, teamId: number | null) {
  const [actions, setActions] = React.useState<TourPlannerActionListItem[]>([])
  const [products, setProducts] = React.useState<OneTwoOneRivoVirto[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [hasFetched, setHasFetched] = React.useState(false)
  const [refetchTick, setRefetchTick] = React.useState(0)

  React.useEffect(() => {
    if (!enabled) return

    let cancelled = false

    async function run() {
      setIsLoading(true)
      setError(null)

      try {
        const { since, until } = getMonthToTodayCasRange(nowInPoland())

        const [actionsRes, productsRes] = await Promise.all([
          brandmastApi.fetchBMActions({ since, until, status: "finished" }),
          brandmastApi.fetchProductsRivoVirto(),
        ])

        if (cancelled) return

        if (actionsRes.success === false) {
          setError(actionsRes.message ?? "Nie udało się pobrać akcji.")
          setActions([])
          setProducts([])
          return
        }

        if (productsRes.success === false) {
          setError(productsRes.message ?? "Nie udało się pobrać produktów.")
          setActions([])
          setProducts([])
          return
        }

        const items = (actionsRes.data ?? []).slice().sort((a, b) => {
          const da = a.since ?? ""
          const db = b.since ?? ""
          return db.localeCompare(da)
        })

        const productItems = (productsRes.data ?? []).slice().sort((a, b) => {
          const la = a.lp ?? 0
          const lb = b.lp ?? 0
          if (la !== lb) return la - lb
          return (a.nazwa ?? "").localeCompare(b.nazwa ?? "", "pl")
        })

        setActions(items)
        setProducts(productItems)
      } catch (e) {
        if (cancelled) return
        setError(e instanceof Error ? e.message : "Nie udało się pobrać danych.")
        setActions([])
        setProducts([])
      } finally {
        if (!cancelled) {
          setIsLoading(false)
          setHasFetched(true)
        }
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [enabled, refetchTick])

  const refetch = React.useCallback(() => setRefetchTick((t) => t + 1), [])

  return {
    actions,
    products,
    teamId,
    isLoading: enabled && (!hasFetched || isLoading),
    error,
    refetch,
  }
}
