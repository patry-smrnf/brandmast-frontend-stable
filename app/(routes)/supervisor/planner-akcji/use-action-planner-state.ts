"use client"

import * as React from "react"
import { isAxiosError } from "axios"

import { brandmastApi } from "@/lib/api"
import type { Event, ShopResponse } from "@/lib/api/generated/types"
import { isCasConnected } from "@/lib/config"
import { useIsClient } from "@/lib/hooks/use-is-client"
import { toDateKey } from "@/lib/dates/date-utils"
import {
  combineDateTimeToIso,
  formatDatePL,
  normalizeTime,
} from "@/app/(routes)/brandmaster/editor/editor-utils"

import {
  buildPlannerTasks,
  filterShopsByEventId,
  getShopDisplayName,
  shopAddressMatchesQuery,
  type PlannerStep,
  type PlannerTask,
  type ShopViewMode,
} from "./planner-utils"

function readFetchError(err: unknown): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined
    return data?.message ?? err.message ?? "Błąd sieci."
  }
  if (err instanceof Error) return err.message
  return "Nieznany błąd."
}

export function useActionPlannerState() {
  const isClient = useIsClient()

  const [step, setStep] = React.useState<PlannerStep>(1)

  const [events, setEvents] = React.useState<Event[]>([])
  const [eventsLoading, setEventsLoading] = React.useState(false)
  const [eventsError, setEventsError] = React.useState<string | null>(null)
  const [selectedEventId, setSelectedEventId] = React.useState<number | null>(null)

  const [shopViewMode, setShopViewMode] = React.useState<ShopViewMode>("all")
  const [shops, setShops] = React.useState<ShopResponse[]>([])
  const [shopsLoading, setShopsLoading] = React.useState(false)
  const [shopsError, setShopsError] = React.useState<string | null>(null)

  const [selectedShopIds, setSelectedShopIds] = React.useState<Set<number>>(() => new Set())
  const [selectedShopCache, setSelectedShopCache] = React.useState<Map<number, ShopResponse>>(
    () => new Map(),
  )
  const [shopQuery, setShopQuery] = React.useState("")

  const [startTime, setStartTime] = React.useState("")
  const [endTime, setEndTime] = React.useState("")
  const [selectedDates, setSelectedDates] = React.useState<Date[]>([])

  const [executionPhase, setExecutionPhase] = React.useState<"idle" | "running" | "done">("idle")
  const [tasks, setTasks] = React.useState<PlannerTask[]>([])
  const [currentTaskKey, setCurrentTaskKey] = React.useState<string | null>(null)
  const abortRef = React.useRef(false)

  const startNorm = React.useMemo(() => normalizeTime(startTime), [startTime])
  const endNorm = React.useMemo(() => normalizeTime(endTime), [endTime])

  const sortedSelectedDates = React.useMemo(
    () => selectedDates.slice().sort((a, b) => a.getTime() - b.getTime()),
    [selectedDates],
  )

  const selectedShops = React.useMemo(() => {
    const byId = new Map(shops.map((s) => [s.id ?? 0, s]))
    const result: ShopResponse[] = []
    for (const id of selectedShopIds) {
      const shop = byId.get(id) ?? selectedShopCache.get(id)
      if (shop) result.push(shop)
    }
    return result.sort((a, b) => getShopDisplayName(a).localeCompare(getShopDisplayName(b), "pl"))
  }, [shops, selectedShopIds, selectedShopCache])

  const filteredShops = React.useMemo(() => {
    return shops.filter((s) => shopAddressMatchesQuery(s, shopQuery))
  }, [shops, shopQuery])

  const totalActions = selectedShopIds.size * sortedSelectedDates.length

  const loadEvents = React.useCallback(async () => {
    setEventsLoading(true)
    setEventsError(null)
    try {
      const res = await brandmastApi.fetchEvents()
      if (res.success === false) {
        setEventsError(res.message ?? "Nie udało się pobrać eventów.")
        setEvents([])
        return
      }
      setEvents(res.data ?? [])
    } catch (e) {
      setEventsError(readFetchError(e))
      setEvents([])
    } finally {
      setEventsLoading(false)
    }
  }, [])

  const loadShops = React.useCallback(async (eventId: number, mode: ShopViewMode) => {
    setShopsLoading(true)
    setShopsError(null)
    try {
      if (mode === "top50") {
        const res = await brandmastApi.fetchTopShops({ eventId, limit: 50 })
        if (res.success === false) {
          setShopsError(res.message ?? "Nie udało się pobrać top sklepów.")
          setShops([])
          return
        }
        setShops(res.data ?? [])
      } else {
        const res = await brandmastApi.fetchShops()
        if (res.success === false) {
          setShopsError(res.message ?? "Nie udało się pobrać sklepów.")
          setShops([])
          return
        }
        setShops(filterShopsByEventId(res.data ?? [], eventId))
      }
    } catch (e) {
      setShopsError(readFetchError(e))
      setShops([])
    } finally {
      setShopsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    if (!isClient) return
    void loadEvents()
  }, [isClient, loadEvents])

  React.useEffect(() => {
    if (!isClient || selectedEventId == null) {
      setShops([])
      return
    }
    void loadShops(selectedEventId, shopViewMode)
  }, [isClient, selectedEventId, shopViewMode, loadShops])

  const toggleShop = React.useCallback(
    (shopId: number) => {
      setSelectedShopIds((prev) => {
        const next = new Set(prev)
        if (next.has(shopId)) {
          next.delete(shopId)
          setSelectedShopCache((cache) => {
            const updated = new Map(cache)
            updated.delete(shopId)
            return updated
          })
        } else {
          next.add(shopId)
          const shop = shops.find((s) => (s.id ?? 0) === shopId)
          if (shop) {
            setSelectedShopCache((cache) => new Map(cache).set(shopId, shop))
          }
        }
        return next
      })
    },
    [shops],
  )

  const clearSelectedShops = React.useCallback(() => {
    setSelectedShopIds(new Set())
    setSelectedShopCache(new Map())
  }, [])

  const handleEventChange = React.useCallback((raw: string) => {
    const id = raw ? Number(raw) : null
    setSelectedEventId(id && Number.isFinite(id) ? id : null)
    setShopQuery("")
  }, [])

  const handleViewModeChange = React.useCallback((mode: ShopViewMode) => {
    setShopViewMode(mode)
  }, [])

  const nextDisabledStep1 = selectedShopIds.size === 0
  const nextDisabledStep2 =
    sortedSelectedDates.length === 0 || !startNorm.ok || !endNorm.ok

  const step1NextBlocked = !isClient || nextDisabledStep1 || selectedEventId == null
  const step2NextBlocked = !isClient || nextDisabledStep2
  const planBlocked = !isClient || totalActions === 0

  const stepTitle = React.useCallback((s: PlannerStep) => {
    if (s === 1) return "Wybierz sklepy"
    if (s === 2) return "Wybierz daty i godziny"
    return "Podsumowanie"
  }, [])

  const goBack = React.useCallback(() => {
    if (executionPhase !== "idle") return
    setStep((prev) => (prev > 1 ? ((prev - 1) as PlannerStep) : prev))
  }, [executionPhase])

  const startPlanning = React.useCallback(async () => {
    if (!isCasConnected()) return
    if (!startNorm.ok || !endNorm.ok || selectedShopIds.size === 0 || sortedSelectedDates.length === 0) {
      return
    }

    const shopList = selectedShops
    const initialTasks = buildPlannerTasks(
      shopList,
      selectedShopIds,
      sortedSelectedDates,
      formatDatePL,
      toDateKey,
    )

    if (initialTasks.length === 0) return

    abortRef.current = false
    setTasks(initialTasks)
    setExecutionPhase("running")
    setCurrentTaskKey(null)

    const shopById = new Map(shopList.map((s) => [s.id ?? 0, s]))

    for (let i = 0; i < initialTasks.length; i++) {
      if (abortRef.current) break

      const task = initialTasks[i]!
      setCurrentTaskKey(task.key)
      setTasks((prev) =>
        prev.map((t) => (t.key === task.key ? { ...t, status: "running" } : t)),
      )

      const shop = shopById.get(task.shopId)
      const shopName = shop ? getShopDisplayName(shop) : task.shopName
      const date = sortedSelectedDates.find((d) => toDateKey(d) === task.dateKey)
      if (!shop || !date) {
        setTasks((prev) =>
          prev.map((t) =>
            t.key === task.key
              ? { ...t, status: "error", errorMessage: "Brak danych sklepu lub daty." }
              : t,
          ),
        )
        continue
      }

      const since = combineDateTimeToIso(date, startNorm.value)
      const until = combineDateTimeToIso(date, endNorm.value)

      try {
        const res = await brandmastApi.createBlankAction({
          idShop: task.shopId,
          name: shopName,
          since,
          until,
        })
        if (res.success === false) {
          setTasks((prev) =>
            prev.map((t) =>
              t.key === task.key
                ? { ...t, status: "error", errorMessage: res.message ?? "Błąd tworzenia akcji." }
                : t,
            ),
          )
        } else {
          setTasks((prev) =>
            prev.map((t) => (t.key === task.key ? { ...t, status: "success" } : t)),
          )
        }
      } catch (e) {
        setTasks((prev) =>
          prev.map((t) =>
            t.key === task.key
              ? { ...t, status: "error", errorMessage: readFetchError(e) }
              : t,
          ),
        )
      }

      await new Promise((r) => setTimeout(r, 80))
    }

    setCurrentTaskKey(null)
    setExecutionPhase("done")
  }, [startNorm, endNorm, selectedShopIds, sortedSelectedDates, selectedShops, shops])

  const resetPlanning = React.useCallback(() => {
    abortRef.current = true
    setExecutionPhase("idle")
    setTasks([])
    setCurrentTaskKey(null)
  }, [])

  const completedCount = tasks.filter((t) => t.status === "success").length
  const errorCount = tasks.filter((t) => t.status === "error").length
  const progressPercent = tasks.length ? Math.round(((completedCount + errorCount) / tasks.length) * 100) : 0

  return {
    isClient,
    step,
    setStep,
    stepTitle,
    goBack,

    events,
    eventsLoading,
    eventsError,
    selectedEventId,
    handleEventChange,

    shopViewMode,
    handleViewModeChange,
    shops,
    shopsLoading,
    shopsError,
    filteredShops,

    selectedShopIds,
    selectedShops,
    toggleShop,
    clearSelectedShops,
    shopQuery,
    setShopQuery,

    startTime,
    setStartTime,
    endTime,
    setEndTime,
    startNorm,
    endNorm,
    selectedDates,
    setSelectedDates,
    sortedSelectedDates,

    nextDisabledStep1,
    nextDisabledStep2,
    step1NextBlocked,
    step2NextBlocked,
    planBlocked,
    totalActions,

    executionPhase,
    tasks,
    currentTaskKey,
    startPlanning,
    resetPlanning,
    completedCount,
    errorCount,
    progressPercent,
  }
}

export type ActionPlannerState = ReturnType<typeof useActionPlannerState>
