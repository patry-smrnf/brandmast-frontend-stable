"use client"

import * as React from "react"

import { brandmastApi } from "@/lib/api"
import type { TourPlannerActionListItem } from "@/lib/api/generated/types"
import type { CasActionStatus } from "@/lib/cas-status"
export function useCasPanelActions(dateKey: string) {
  const [actions, setActions] = React.useState<TourPlannerActionListItem[]>([])
  // Start w stanie ładowania: pobranie zawsze rusza po zamontowaniu, a dzięki temu
  // pierwszy render (SSR + hydracja) jest deterministyczny i identyczny.
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [tick, setTick] = React.useState(0)

  const refetch = React.useCallback(() => setTick((t) => t + 1), [])

  React.useEffect(() => {
    if (!dateKey) return

    let cancelled = false

    async function run() {
      setIsLoading(true)
      setError(null)

      try {
        const res = await brandmastApi.fetchSVCasActions({
          since: dateKey,
          until: dateKey,
        })

        if (cancelled) return

        if (res.success === false) {
          setActions([])
          setError(res.message ?? "Nie udało się pobrać akcji CAS.")
          return
        }

        setActions(res.data ?? [])
      } catch (e) {
        if (cancelled) return
        setActions([])
        setError(e instanceof Error ? e.message : "Nie udało się pobrać akcji CAS.")
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [dateKey, tick])

  const patchActionStatus = React.useCallback((ident: string, status: CasActionStatus) => {
    setActions((prev) =>
      prev.map((action) =>
        action.ident?.trim() === ident ? { ...action, status } : action,
      ),
    )
  }, [])

  const updateActionStatus = React.useCallback(
    async (ident: string, status: CasActionStatus): Promise<{ synced: boolean }> => {
      patchActionStatus(ident, status)

      const action = actions.find((item) => item.ident?.trim() === ident)
      const uuid = action?.uuid?.trim()
      if (!uuid) {
        return { synced: false }
      }

      try {
        const res = await brandmastApi.updateStatus({ uuid, ident: status })
        if (res.success === false) {
          return { synced: false }
        }
        return { synced: true }
      } catch {
        return { synced: false }
      }
    },
    [actions, patchActionStatus],
  )

  return {
    actions,
    isLoading,
    error,
    refetch,
    updateActionStatus,
    patchActionStatus,
  }
}
