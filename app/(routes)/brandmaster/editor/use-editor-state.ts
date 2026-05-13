"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

import { brandmastApi } from "@/lib/api"
import type { ShopResponse } from "@/lib/api/generated/types"

import { parseIso, toDateKey } from "../actions/date-utils"
import type { BrandmasterAction } from "../actions/types"

import {
  buildShopLabel,
  buildShopMapMarkersAndStats,
  coerceAction,
  combineDateTimeToIso,
  createInitialSelectedDates,
  fetchActionsForEditor,
  normalizeTime,
  parseActionId,
  parseEditorMonthToBackendMonth,
  shopMatchesQuery,
  type EditorStep,
} from "./editor-utils"

export function useEditorState() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const idAction = React.useMemo(() => parseActionId(searchParams.get("idAction")), [searchParams])
  const backendMonth = React.useMemo(
    () => parseEditorMonthToBackendMonth(searchParams.get("month")),
    [searchParams]
  )
  const isEditMode = idAction !== null

  const [isMounted, setIsMounted] = React.useState(false)
  React.useEffect(() => {
    const t = setTimeout(() => setIsMounted(true), 0)
    return () => clearTimeout(t)
  }, [])

  const [step, setStep] = React.useState<EditorStep>(1)

  const [startTime, setStartTime] = React.useState("")
  const [endTime, setEndTime] = React.useState("")

  const [allowMultiDates, setAllowMultiDates] = React.useState(false)
  const [selectedDates, setSelectedDates] = React.useState<Date[]>(() => createInitialSelectedDates(searchParams))

  const [shopQuery, setShopQuery] = React.useState("")
  const [shops, setShops] = React.useState<ShopResponse[]>([])
  const [shopsLoading, setShopsLoading] = React.useState(false)
  const [selectedShop, setSelectedShop] = React.useState<ShopResponse | null>(null)
  const [showShopSuggestions, setShowShopSuggestions] = React.useState(false)
  const hideShopSuggestionsTimeoutRef = React.useRef<number | null>(null)

  const [editingAction, setEditingAction] = React.useState<BrandmasterAction | null>(null)
  const [loadingEditData, setLoadingEditData] = React.useState(false)

  const startNorm = React.useMemo(() => normalizeTime(startTime), [startTime])
  const endNorm = React.useMemo(() => normalizeTime(endTime), [endTime])

  const canGoNextStep1 = React.useMemo(() => {
    if (!startNorm.ok || !endNorm.ok) return false
    if (!selectedDates.length) return false
    return true
  }, [startNorm.ok, endNorm.ok, selectedDates.length])

  const canGoNextStep2 = React.useMemo(() => {
    return !!selectedShop
  }, [selectedShop])

  const isMultiDatesEffective = allowMultiDates && !isEditMode

  const nextDisabledStep1 = !isMounted ? false : !canGoNextStep1
  const nextDisabledStep2 = !isMounted ? false : !canGoNextStep2

  React.useEffect(() => {
    if (!isEditMode) return
    if (!idAction) return

    let cancelled = false
    async function run() {
      setLoadingEditData(true)
      try {
        const actions = await fetchActionsForEditor(backendMonth)
        if (cancelled) return

        const found = actions.find((a) => (a.idAction ?? 0) === idAction)
        const coerced = coerceAction(found)
        if (!coerced) {
          toast.error("Nie znaleziono akcji do edycji.")
          return
        }

        setEditingAction(coerced)
        setAllowMultiDates(false)

        const since = parseIso(coerced.since)
        const until = parseIso(coerced.until)
        if (since) {
          setSelectedDates([since])
          const hh = String(since.getHours()).padStart(2, "0")
          const mm = String(since.getMinutes()).padStart(2, "0")
          const ss = String(since.getSeconds()).padStart(2, "0")
          setStartTime(`${hh}:${mm}:${ss}`)
        }
        if (until) {
          const hh = String(until.getHours()).padStart(2, "0")
          const mm = String(until.getMinutes()).padStart(2, "0")
          const ss = String(until.getSeconds()).padStart(2, "0")
          setEndTime(`${hh}:${mm}:${ss}`)
        }

        if (coerced.shop.idShop) {
          const prefilledShop: ShopResponse = {
            id: coerced.shop.idShop,
            name: coerced.shop.name,
            location: { address: coerced.shop.address },
            event: { name: coerced.event.name },
          }
          setSelectedShop(prefilledShop)
          setShopQuery(buildShopLabel(prefilledShop))
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Nie udało się pobrać akcji.")
      } finally {
        if (cancelled) return
        setLoadingEditData(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [idAction, isEditMode, backendMonth])

  React.useEffect(() => {
    if (step !== 2) return
    if (shops.length) return

    let cancelled = false
    async function run() {
      setShopsLoading(true)
      try {
        const res = await brandmastApi.fetchShops()
        if (cancelled) return
        setShops(res.data ?? [])

        if (selectedShop?.id) {
          const matched = (res.data ?? []).find((s) => (s.id ?? 0) === (selectedShop.id ?? 0))
          if (matched) setSelectedShop(matched)
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Nie udało się pobrać listy lokalizacji.")
      } finally {
        if (cancelled) return
        setShopsLoading(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [step, shops.length, selectedShop?.id])

  const filteredShops = React.useMemo(() => {
    const list = shops.filter((s) => shopMatchesQuery(s, shopQuery))
    const q = shopQuery.trim().toLowerCase()
    if (!q) return list.slice(0, 30)

    return list
      .map((s) => {
        const label = buildShopLabel(s).toLowerCase()
        const score =
          label.startsWith(q) ? 0 : label.includes(` ${q}`) ? 1 : label.includes(q) ? 2 : 3
        return { s, score, label }
      })
      .sort((a, b) => a.score - b.score || a.label.localeCompare(b.label, "pl"))
      .slice(0, 30)
      .map((x) => x.s)
  }, [shops, shopQuery])

  const shopMapBundle = React.useMemo(() => buildShopMapMarkersAndStats(shops), [shops])

  const onShopMapMarkerSelect = React.useCallback(
    (id: number) => {
      const s = shops.find((x) => (x.id ?? 0) === id)
      if (!s) return
      setSelectedShop(s)
      setShopQuery(buildShopLabel(s))
      setShowShopSuggestions(false)
    },
    [shops]
  )

  function goBack() {
    if (step === 1) {
      router.back()
      return
    }
    setStep((s) => (s === 1 ? 1 : ((s - 1) as EditorStep)))
  }

  function stepTitle(s: EditorStep) {
    if (s === 1) return "Wybierz datę"
    if (s === 2) return "Wybierz lokalizację"
    return "Podsumowanie"
  }

  const onSubmit = React.useCallback(async (): Promise<void> => {
    const n1 = normalizeTime(startTime)
    const n2 = normalizeTime(endTime)
    if (!n1.ok) {
      toast.error(n1.reason)
      return
    }
    if (!n2.ok) {
      toast.error(n2.reason)
      return
    }
    if (!selectedShop?.id) {
      toast.error("Wybierz lokalizację.")
      return
    }
    if (!selectedDates.length) {
      toast.error("Wybierz co najmniej jedną datę.")
      return
    }

    const uniqueDates = Array.from(
      new Map(selectedDates.map((d) => [toDateKey(d), d] as const)).values()
    ).sort((a, b) => a.getTime() - b.getTime())

    const sinceByDate = uniqueDates.map((d) => combineDateTimeToIso(d, n1.value))
    const untilByDate = uniqueDates.map((d) => combineDateTimeToIso(d, n2.value))

    const isEditing = isEditMode && editingAction?.idAction

    toast.loading(isEditing ? "Zapisywanie zmian…" : "Tworzenie akcji…", { id: "bm-editor-submit" })

    try {
      if (isEditing) {
        await brandmastApi.updateAction({
          idAction: editingAction!.idAction,
          idShop: Number(selectedShop.id),
          since: sinceByDate[0],
          until: untilByDate[0],
          status: editingAction!.status,
        })
      } else {
        await Promise.all(
          sinceByDate.map((since, idx) =>
            brandmastApi.addBMAction({
              idShop: Number(selectedShop.id),
              since,
              until: untilByDate[idx],
            })
          )
        )
      }

      toast.success(isEditing ? "Zapisano zmiany." : "Utworzono akcję/akcje.", {
        id: "bm-editor-submit",
      })
      void router.push("/brandmaster/actions")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Nie udało się zapisać.", {
        id: "bm-editor-submit",
      })
    }
  }, [startTime, endTime, selectedShop, selectedDates, isEditMode, editingAction, router])

  return {
    idAction,
    isEditMode,
    loadingEditData,
    step,
    setStep,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    allowMultiDates,
    setAllowMultiDates,
    selectedDates,
    setSelectedDates,
    shopQuery,
    setShopQuery,
    shops,
    shopsLoading,
    selectedShop,
    setSelectedShop,
    showShopSuggestions,
    setShowShopSuggestions,
    hideShopSuggestionsTimeoutRef,
    startNorm,
    endNorm,
    nextDisabledStep1,
    nextDisabledStep2,
    isMultiDatesEffective,
    filteredShops,
    shopMapBundle,
    onShopMapMarkerSelect,
    goBack,
    stepTitle,
    onSubmit,
  }
}
