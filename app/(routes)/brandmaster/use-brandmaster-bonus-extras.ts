"use client"

import * as React from "react"
import { toast } from "sonner"

import { brandmastApi, type BonusResponse } from "@/lib/api"

type EditingState =
  | { mode: "idle" }
  | { mode: "edit"; idBonus: number; title: string; amount: string }
  | { mode: "create"; title: string; amount: string }

function readApiError(err: unknown): string {
  if (err instanceof Error) return err.message
  return "Wystąpił nieoczekiwany błąd."
}

function parseAmountInput(value: string): number | null {
  const normalized = value.trim().replace(",", ".")
  if (!normalized) return null
  const parsed = Number(normalized)
  if (!Number.isFinite(parsed)) return null
  return parsed
}

export function useBrandmasterBonusExtras(enabled = true) {
  const [items, setItems] = React.useState<BonusResponse[]>([])
  const [loading, setLoading] = React.useState(false)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [editing, setEditing] = React.useState<EditingState>({ mode: "idle" })
  const [savingId, setSavingId] = React.useState<number | "create" | null>(null)
  const [deletingId, setDeletingId] = React.useState<number | null>(null)
  const fetchRequestRef = React.useRef(0)

  const loadExtras = React.useCallback(async () => {
    const requestId = ++fetchRequestRef.current
    setLoading(true)
    setLoadError(null)

    try {
      const res = await brandmastApi.fetchBonus()
      if (fetchRequestRef.current !== requestId) return

      if (res.success === false) {
        setLoadError(res.message ?? "Nie udało się pobrać dodatków.")
        setItems([])
        return
      }

      setItems(res.data ?? [])
    } catch (e) {
      if (fetchRequestRef.current !== requestId) return
      setLoadError(readApiError(e))
      setItems([])
    } finally {
      if (fetchRequestRef.current === requestId) {
        setLoading(false)
      }
    }
  }, [])

  React.useEffect(() => {
    if (!enabled) return
    void loadExtras()
  }, [enabled, loadExtras])

  const extrasTotal = React.useMemo(
    () => items.reduce((sum, item) => sum + (item.amount ?? 0), 0),
    [items],
  )

  const getDraftForItem = React.useCallback(
    (idBonus: number) => {
      if (editing.mode === "edit" && editing.idBonus === idBonus) {
        return { title: editing.title, amount: editing.amount }
      }
      const item = items.find((entry) => entry.idBonus === idBonus)
      return {
        title: item?.title ?? "",
        amount: item?.amount != null ? String(item.amount) : "",
      }
    },
    [editing, items],
  )

  const startEdit = (item: BonusResponse) => {
    if (item.idBonus == null) return
    setEditing({
      mode: "edit",
      idBonus: item.idBonus,
      title: item.title ?? "",
      amount: item.amount != null ? String(item.amount) : "",
    })
  }

  const startCreate = () => {
    setEditing({ mode: "create", title: "", amount: "" })
  }

  const cancelEditing = () => {
    setEditing({ mode: "idle" })
  }

  const updateDraft = (field: "title" | "amount", value: string) => {
    setEditing((prev) => {
      if (prev.mode === "idle") return prev
      return { ...prev, [field]: value }
    })
  }

  const validateDraft = (title: string, amount: string): { title: string; amount: number } | null => {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      toast.error("Podaj tytuł dodatku.")
      return null
    }
    const parsedAmount = parseAmountInput(amount)
    if (parsedAmount == null) {
      toast.error("Podaj poprawną kwotę.")
      return null
    }
    return { title: trimmedTitle, amount: parsedAmount }
  }

  const handleSaveEdit = async (idBonus: number) => {
    if (editing.mode !== "edit" || editing.idBonus !== idBonus) return
    const payload = validateDraft(editing.title, editing.amount)
    if (!payload) return

    setSavingId(idBonus)
    try {
      const res = await brandmastApi.updateBonus({
        idBonus,
        title: payload.title,
        amount: payload.amount,
      })
      if (res.success === false) {
        toast.error(res.message ?? "Nie udało się zapisać dodatku.")
        return
      }
      toast.success("Dodatek zaktualizowany.")
      setEditing({ mode: "idle" })
      await loadExtras()
    } catch (e) {
      toast.error(readApiError(e))
    } finally {
      setSavingId(null)
    }
  }

  const handleCreate = async () => {
    if (editing.mode !== "create") return
    const payload = validateDraft(editing.title, editing.amount)
    if (!payload) return

    setSavingId("create")
    try {
      const res = await brandmastApi.createBonus({
        title: payload.title,
        amount: payload.amount,
      })
      if (res.success === false) {
        toast.error(res.message ?? "Nie udało się dodać dodatku.")
        return
      }
      toast.success("Dodatek dodany.")
      setEditing({ mode: "idle" })
      await loadExtras()
    } catch (e) {
      toast.error(readApiError(e))
    } finally {
      setSavingId(null)
    }
  }

  const handleDelete = async (idBonus: number) => {
    const item = items.find((entry) => entry.idBonus === idBonus)
    if (!item) return

    setDeletingId(idBonus)
    try {
      const res = await brandmastApi.deleteBonus({
        idBonus,
        title: item.title ?? "",
        amount: item.amount ?? 0,
      })
      if (res.success === false) {
        toast.error(res.message ?? "Nie udało się usunąć dodatku.")
        return
      }
      toast.success("Dodatek usunięty.")
      if (editing.mode === "edit" && editing.idBonus === idBonus) {
        setEditing({ mode: "idle" })
      }
      await loadExtras()
    } catch (e) {
      toast.error(readApiError(e))
    } finally {
      setDeletingId(null)
    }
  }

  return {
    items,
    loading,
    loadError,
    editing,
    savingId,
    deletingId,
    extrasTotal,
    isCreating: editing.mode === "create",
    loadExtras,
    getDraftForItem,
    startEdit,
    startCreate,
    cancelEditing,
    updateDraft,
    handleSaveEdit,
    handleCreate,
    handleDelete,
  }
}

export type BrandmasterBonusExtrasState = ReturnType<typeof useBrandmasterBonusExtras>
