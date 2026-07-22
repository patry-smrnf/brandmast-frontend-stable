"use client"

import * as React from "react"

import { brandmastApi, getApiErrorMessage } from "@/lib/api"
import type { ShopResponse } from "@/lib/api/generated/types"
import { useIsClient } from "@/lib/hooks/use-is-client"

export function useShops() {
  const isClient = useIsClient()
  const [shops, setShops] = React.useState<ShopResponse[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await brandmastApi.fetchShops()
      if (res.success === false) {
        setError(res.message ?? "Nie udało się pobrać sklepów.")
        setShops([])
        return
      }
      setShops(res.data ?? [])
    } catch (e) {
      setError(getApiErrorMessage(e))
      setShops([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    if (!isClient) return
    void load()
  }, [isClient, load])

  const removeShopLocally = React.useCallback((id: number) => {
    setShops((prev) => prev.filter((s) => (s.id ?? 0) !== id))
  }, [])

  const busy = isClient && isLoading

  return {
    shops,
    isLoading: busy,
    error,
    refetch: load,
    removeShopLocally,
  }
}
