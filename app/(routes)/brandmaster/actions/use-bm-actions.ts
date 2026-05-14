"use client"

import * as React from "react"

import { brandmastApi } from "@/lib/api"
import type { ActionStatus, ActionsPayload } from "./types"

function coerceStatus(status: string | undefined | null): ActionStatus {
  const u = (status ?? "").toUpperCase()
  if (
    u === "ACCEPTED" ||
    u === "CANCEL_REQUESTED" ||
    u === "PENDING" ||
    u === "REJECTED" ||
    u === "EDITABLE"
  ) {
    return u as ActionStatus
  }
  return "PENDING"
}

function emptyPayload(): ActionsPayload {
  return {
    brandmaster: {
      idBrandmaster: 0,
      name: "",
      surname: "",
      account: { idAccount: 0, login: "", createdAt: "" },
    },
    actions: [],
  }
}

export function useBmActions(monthKey: string) {
  const [data, setData] = React.useState<ActionsPayload>(() => emptyPayload())
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [refetchTick, setRefetchTick] = React.useState(0)

  React.useEffect(() => {
    let cancelled = false

    async function run() {
      setIsLoading(true)
      setError(null)
      try {
        const res = await brandmastApi.fetchBmActions({ month: monthKey })
        if (cancelled) return

        const payload: ActionsPayload = {
          brandmaster: {
            idBrandmaster: res.data?.brandmaster?.idBrandmaster ?? 0,
            name: res.data?.brandmaster?.name ?? "",
            surname: res.data?.brandmaster?.surname ?? "",
            account: {
              idAccount: res.data?.brandmaster?.account?.idAccount ?? 0,
              login: res.data?.brandmaster?.account?.login ?? "",
              createdAt: res.data?.brandmaster?.account?.createdAt ?? "",
            },
          },
          actions:
            res.data?.actions?.map((a) => ({
              idAction: a.idAction ?? 0,
              status: coerceStatus(a.status),
              since: a.since ?? "",
              until: a.until ?? "",
              createdAt: a.createdAt ?? "",
              updatedAt: a.updatedAt ?? "",
              shop: {
                idShop: a.shop?.idShop ?? 0,
                name: a.shop?.name ?? "",
                address: a.shop?.address ?? "",
                geoLat: a.shop?.geoLat ?? null,
                geoLng: a.shop?.geoLng ?? null,
                tpShopId: a.shop?.tpShopId ?? "",
                tpIdent: a.shop?.tpIdent ?? "",
              },
              event: {
                idEvent: a.event?.idEvent ?? 0,
                name: a.event?.name ?? "",
                tpEventId: a.event?.tpEventId ?? "",
              },
            })) ?? [],
        }

        setData(payload)
      } catch (e) {
        if (cancelled) return
        setError(e instanceof Error ? e.message : "Nie udało się pobrać akcji.")
        setData(emptyPayload())
      } finally {
        if (cancelled) return
        setIsLoading(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [monthKey, refetchTick])

  const refetch = React.useCallback(() => {
    setRefetchTick((t) => t + 1)
  }, [])

  return { data, isLoading, error, refetch }
}

