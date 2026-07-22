"use client"

import * as React from "react"

import { brandmastApi, getApiErrorMessage } from "@/lib/api"
import type { BrandmastersResponse } from "@/lib/api/generated/types"
import { useIsClient } from "@/lib/hooks/use-is-client"

export function useBrandmasters() {
  const isClient = useIsClient()
  const [brandmasters, setBrandmasters] = React.useState<BrandmastersResponse[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await brandmastApi.fetchBrandmasters()
      if (res.success === false) {
        setError(res.message ?? "Nie udało się pobrać brandmasterów.")
        setBrandmasters([])
        return
      }
      setBrandmasters(res.data ?? [])
    } catch (e) {
      setError(getApiErrorMessage(e))
      setBrandmasters([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    if (!isClient) return
    void load()
  }, [isClient, load])

  const removeBrandmasterLocally = React.useCallback((id: number) => {
    setBrandmasters((prev) => prev.filter((b) => (b.brandmasterId ?? 0) !== id))
  }, [])

  const busy = isClient && isLoading

  return {
    brandmasters,
    isLoading: busy,
    error,
    refetch: load,
    removeBrandmasterLocally,
  }
}
