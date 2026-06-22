"use client"

import * as React from "react"

import { brandmastApi } from "@/lib/api"
import type { ActionsResponse, CasDetails } from "@/lib/api"
import { normalizeActionStatus, type NormalizedActionStatus } from "@/lib/action-status"

export type SvActionRow = {
  brandmaster: {
    idBrandmaster: number
    name: string
    surname: string
  }
  action: {
    idAction: number
    idShop: number
    status: NormalizedActionStatus
    since: string
    until: string
    createdAt: string
    /** Z API jako `updatedAt` (ostatnia edycja). */
    editedAt: string
    shop: { name: string; address: string }
    event: { idEvent: number; name: string }
    cas: CasDetails[]
  }
}

function mapCasDetails(items: CasDetails[] | undefined): CasDetails[] {
  return (items ?? []).map((item) => ({
    ident: item.ident?.trim() || undefined,
    name: item.name?.trim() || undefined,
    status: item.status?.trim() || undefined,
    externalUuid: item.externalUuid?.trim() || undefined,
  }))
}

/** Lokalna aktualizacja po `updateSvAction` bez ponownego fetcha. */
export type SvActionLocalPatch = {
  idAction: number
  idShop: number
  since: string
  until: string
  shop: { name: string; address: string }
  editedAt: string
}

/** Lokalna aktualizacja statusu wpisu CAS po `updateStatus`. */
export type SvCasStatusPatch = {
  idAction: number
  externalUuid: string
  status: string
}

function flattenResponse(blocks: ActionsResponse[] | undefined): SvActionRow[] {
  const out: SvActionRow[] = []
  for (const block of blocks ?? []) {
    const bm = block.brandmaster
    const idBm = bm?.idBrandmaster ?? 0
    const name = bm?.name ?? ""
    const surname = bm?.surname ?? ""
    for (const a of block.actions ?? []) {
      const idAction = a.idAction ?? 0
      const idShop = a.shop?.idShop ?? 0
      if (!idAction || !idShop) continue
      out.push({
        brandmaster: { idBrandmaster: idBm, name, surname },
        action: {
          idAction,
          idShop,
          status: normalizeActionStatus(a.status),
          since: a.since ?? "",
          until: a.until ?? "",
          createdAt: a.createdAt ?? "",
          editedAt: a.updatedAt ?? "",
          shop: {
            name: a.shop?.name ?? "",
            address: a.shop?.address ?? "",
          },
          event: {
            idEvent: a.event?.idEvent ?? 0,
            name: a.event?.name ?? "",
          },
          cas: mapCasDetails(a.cas),
        },
      })
    }
  }
  return out
}

export function useSvActions(monthKey: string, options?: { enabled?: boolean }) {
  const enabled = options?.enabled !== false
  const [rows, setRows] = React.useState<SvActionRow[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [tick, setTick] = React.useState(0)

  const refetch = React.useCallback(() => setTick((t) => t + 1), [])

  const patchSvActionRow = React.useCallback((patch: SvActionLocalPatch) => {
    setRows((prev) =>
      prev.map((r) =>
        r.action.idAction !== patch.idAction
          ? r
          : {
              ...r,
              action: {
                ...r.action,
                idShop: patch.idShop,
                since: patch.since,
                until: patch.until,
                editedAt: patch.editedAt,
                shop: { ...r.action.shop, ...patch.shop },
              },
            }
      )
    )
  }, [])

  const patchSvActionCasStatus = React.useCallback((patch: SvCasStatusPatch) => {
    const uuid = patch.externalUuid.trim()
    if (!uuid) return

    setRows((prev) =>
      prev.map((r) =>
        r.action.idAction !== patch.idAction
          ? r
          : {
              ...r,
              action: {
                ...r.action,
                cas: r.action.cas.map((item) =>
                  item.externalUuid === uuid ? { ...item, status: patch.status } : item
                ),
              },
            }
      )
    )
  }, [])

  React.useEffect(() => {
    if (!enabled) return

    let cancelled = false

    async function run() {
      setIsLoading(true)
      setError(null)
      try {
        const res = await brandmastApi.fetchSvActions({ month: monthKey })
        if (cancelled) return
        if (res.success === false) {
          setError(res.message ?? "Nie udało się pobrać akcji.")
          setRows([])
          return
        }
        setRows(flattenResponse(res.data))
      } catch (e) {
        if (cancelled) return
        setError(e instanceof Error ? e.message : "Nie udało się pobrać akcji.")
        setRows([])
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [monthKey, tick, enabled])

  return { rows, isLoading, error, refetch, patchSvActionRow, patchSvActionCasStatus }
}
