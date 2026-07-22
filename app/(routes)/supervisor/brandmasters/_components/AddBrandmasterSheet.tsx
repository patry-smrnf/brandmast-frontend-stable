"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  CircleIcon,
  Loader2Icon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { brandmastApi, getApiErrorMessage } from "@/lib/api"
import type {
  BrandmastersResponse,
  TourPlannerBrandmasterListItem,
} from "@/lib/api/generated/types"
import { buildExistingBrandmasterTpUuidSet } from "@/lib/brandmasters/brandmaster-utils"
import {
  buildBrandmasterAddRequest,
  casBrandmasterLabel,
  casBrandmasterMatchesQuery,
  getCasBrandmasterFullName,
  getCasBrandmasterKey,
} from "@/lib/brandmasters/cas-brandmaster-utils"
import { cn } from "@/lib/utils"

export type AddBrandmasterSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingBrandmasters: BrandmastersResponse[]
  onBrandmasterAdded?: () => void
}

type CasBrandmasterRow = {
  item: TourPlannerBrandmasterListItem
  key: string
  alreadyAdded: boolean
}

export function AddBrandmasterSheet({
  open,
  onOpenChange,
  existingBrandmasters,
  onBrandmasterAdded,
}: AddBrandmasterSheetProps) {
  const [entered, setEntered] = React.useState(false)
  const [portalTarget, setPortalTarget] = React.useState<HTMLElement | null>(null)

  const [casBrandmasters, setCasBrandmasters] = React.useState<TourPlannerBrandmasterListItem[]>([])
  const [listLoading, setListLoading] = React.useState(false)
  const [listError, setListError] = React.useState<string | null>(null)

  const [search, setSearch] = React.useState("")
  const [selectedKey, setSelectedKey] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const existingTpUuids = React.useMemo(
    () => buildExistingBrandmasterTpUuidSet(existingBrandmasters),
    [existingBrandmasters],
  )

  const rows = React.useMemo((): CasBrandmasterRow[] => {
    return casBrandmasters.map((item, index) => {
      const key = getCasBrandmasterKey(item, index)
      const uuid = item.uuid?.trim() ?? ""
      return {
        item,
        key,
        alreadyAdded: Boolean(uuid && existingTpUuids.has(uuid)),
      }
    })
  }, [casBrandmasters, existingTpUuids])

  const filteredRows = React.useMemo(
    () => rows.filter((r) => casBrandmasterMatchesQuery(r.item, search)),
    [rows, search],
  )

  const selectedRow = React.useMemo(
    () => rows.find((r) => r.key === selectedKey && !r.alreadyAdded) ?? null,
    [rows, selectedKey],
  )

  const stats = React.useMemo(() => {
    const total = rows.length
    const added = rows.filter((r) => r.alreadyAdded).length
    return { total, added, toAdd: total - added }
  }, [rows])

  React.useLayoutEffect(() => {
    setPortalTarget(document.body)
  }, [])

  React.useLayoutEffect(() => {
    if (!open) {
      setEntered(false)
      return
    }
    const id = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(id)
  }, [open])

  const loadCasBrandmasters = React.useCallback(async () => {
    setListLoading(true)
    setListError(null)
    setCasBrandmasters([])
    setSelectedKey(null)
    try {
      const res = await brandmastApi.fetchCasBrandmasters()
      if (res.success === false) {
        setListError(res.message ?? "Nie udało się pobrać brandmasterów z CAS.")
        return
      }
      setCasBrandmasters(res.data ?? [])
    } catch (e) {
      setListError(getApiErrorMessage(e))
    } finally {
      setListLoading(false)
    }
  }, [])

  React.useEffect(() => {
    if (!open) return
    setSearch("")
    setSelectedKey(null)
    void loadCasBrandmasters()
  }, [open, loadCasBrandmasters])

  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) onOpenChange(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, isSubmitting, onOpenChange])

  React.useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  function selectRow(key: string, alreadyAdded: boolean) {
    if (isSubmitting || alreadyAdded) return
    setSelectedKey((prev) => (prev === key ? null : key))
  }

  async function handleConfirm() {
    if (!selectedRow) {
      toast.error("Wybierz brandmastera do dodania.")
      return
    }

    const body = buildBrandmasterAddRequest(selectedRow.item)
    if (!body.tpUuid) {
      toast.error("Wybrany brandmaster nie ma UUID Tourplannera.")
      return
    }

    setIsSubmitting(true)
    const toastId = toast.loading("Dodawanie brandmastera…")
    try {
      const res = await brandmastApi.addBrandmaster(body)
      if (res.success === false) {
        toast.error(res.message ?? "Nie udało się dodać brandmastera.", { id: toastId })
        return
      }
      toast.success("Brandmaster dodany do zespołu.", { id: toastId })
      onOpenChange(false)
      onBrandmasterAdded?.()
    } catch (e) {
      toast.error(getApiErrorMessage(e), { id: toastId })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!open || !portalTarget) return null

  return createPortal(
    <div className="fixed inset-0 z-60 flex flex-col justify-end sm:justify-center" aria-hidden={false}>
      <button
        type="button"
        className={cn(
          "absolute inset-0 bg-black/45 backdrop-blur-[1px] transition-opacity duration-300",
          entered ? "opacity-100" : "opacity-0",
        )}
        aria-label="Zamknij"
        onClick={() => !isSubmitting && onOpenChange(false)}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-brandmaster-sheet-title"
        className={cn(
          "relative z-61 flex max-h-[min(92dvh,820px)] w-full flex-col rounded-t-2xl border border-border bg-card shadow-[0_-12px_40px_rgba(0,0,0,0.14)] transition-transform duration-300 ease-out motion-reduce:transition-none",
          "sm:mx-auto sm:mb-4 sm:max-h-[min(88vh,720px)] sm:max-w-lg sm:rounded-2xl sm:shadow-xl",
          entered ? "translate-y-0" : "translate-y-full",
        )}
      >
        <div className="flex shrink-0 justify-center pt-3 pb-1 sm:hidden" aria-hidden>
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 sm:px-6 sm:pb-6 sm:pt-4">
          <div className="shrink-0 space-y-1">
            <h2
              id="add-brandmaster-sheet-title"
              className="text-lg font-semibold tracking-tight text-foreground"
            >
              Dodaj brandmastera
            </h2>
            <p className="text-sm text-muted-foreground">
              Wybierz brandmastera z CAS, którego jeszcze nie ma w zespole (porównanie po UUID
              Tourplannera).
            </p>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1.5 text-[10px]">
                <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-800 dark:text-emerald-200">
                  Do dodania: {stats.toAdd}
                </span>
                <span className="rounded-md border border-border bg-muted/50 px-2 py-0.5 font-medium text-muted-foreground">
                  Już w zespole: {stats.added}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                disabled={isSubmitting || listLoading}
                onClick={() => void loadCasBrandmasters()}
              >
                <RefreshCwIcon className={cn("size-3.5", listLoading ? "animate-spin" : null)} />
                <span className="ml-1.5">Odśwież listę</span>
              </Button>
            </div>

            <div className="relative shrink-0">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Szukaj brandmastera…"
                className="h-9 pl-8 text-sm"
                autoComplete="off"
                disabled={isSubmitting || listLoading}
              />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-xl border border-border/80">
              {listLoading ? (
                <div className="flex items-center justify-center gap-2 px-3 py-8 text-sm text-muted-foreground">
                  <Loader2Icon className="size-4 animate-spin" />
                  Ładowanie brandmasterów z CAS…
                </div>
              ) : listError ? (
                <div className="space-y-2 p-3">
                  <p className="flex items-start gap-2 text-sm text-destructive">
                    <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
                    {listError}
                  </p>
                  <Button type="button" variant="outline" size="sm" onClick={() => void loadCasBrandmasters()}>
                    <RefreshCwIcon className="size-3.5" />
                    <span className="ml-1.5">Ponów</span>
                  </Button>
                </div>
              ) : filteredRows.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                  {search.trim()
                    ? "Brak brandmasterów pasujących do wyszukiwania."
                    : "Brak brandmasterów w CAS."}
                </p>
              ) : (
                <ul className="divide-y divide-border/60" role="listbox" aria-label="Brandmasterzy z CAS">
                  {filteredRows.map((row, index) => (
                    <CasBrandmasterListItem
                      key={row.key}
                      row={row}
                      index={index}
                      selected={selectedKey === row.key}
                      disabled={isSubmitting}
                      onSelect={() => selectRow(row.key, row.alreadyAdded)}
                    />
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="mt-auto flex shrink-0 flex-col-reverse gap-2 border-t border-border/60 pt-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => onOpenChange(false)}>
              Anuluj
            </Button>
            <Button
              type="button"
              disabled={isSubmitting || listLoading || !selectedRow}
              onClick={() => void handleConfirm()}
            >
              {isSubmitting ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  <span className="ml-2">Dodawanie…</span>
                </>
              ) : (
                <>
                  <PlusIcon className="size-4" />
                  <span className="ml-2">Dodaj wybranego</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    portalTarget,
  )
}

type CasBrandmasterListItemProps = {
  row: CasBrandmasterRow
  index: number
  selected: boolean
  disabled: boolean
  onSelect: () => void
}

function CasBrandmasterListItem({
  row,
  index,
  selected,
  disabled,
  onSelect,
}: CasBrandmasterListItemProps) {
  const { item, alreadyAdded } = row
  const title = getCasBrandmasterFullName(item) || casBrandmasterLabel(item, index)
  const login = item.username?.trim()
  const email = item.emailAddress?.trim()
  const tpUuid = item.uuid?.trim()

  return (
    <li role="presentation">
      <button
        type="button"
        role="option"
        aria-selected={selected}
        disabled={disabled || alreadyAdded}
        onClick={onSelect}
        className={cn(
          "flex w-full gap-2.5 px-3 py-2.5 text-left transition-colors",
          alreadyAdded
            ? "cursor-default bg-muted/40"
            : selected
              ? "bg-primary/5"
              : "bg-background hover:bg-muted/30",
        )}
      >
        <div className="pt-0.5">
          {alreadyAdded ? (
            <CheckCircle2Icon
              className="size-5 text-muted-foreground"
              aria-label="Już w zespole"
            />
          ) : selected ? (
            <CheckCircle2Icon className="size-5 text-primary" aria-hidden />
          ) : (
            <CircleIcon className="size-5 text-muted-foreground/50" aria-hidden />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p
              className={cn(
                "min-w-0 truncate text-sm leading-tight font-medium",
                alreadyAdded ? "text-muted-foreground" : "text-foreground",
              )}
            >
              {title}
            </p>
            {alreadyAdded ? (
              <span className="shrink-0 rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                W zespole
              </span>
            ) : (
              <span className="shrink-0 rounded-md border border-emerald-500/35 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-800 dark:text-emerald-200">
                Nowy
              </span>
            )}
          </div>
          {login ? <p className="mt-0.5 text-xs text-muted-foreground">Login: {login}</p> : null}
          {email ? <p className="mt-0.5 truncate text-xs text-muted-foreground">{email}</p> : null}
          {tpUuid ? (
            <p className="mt-0.5 font-mono text-[10px] text-muted-foreground/80">TP: {tpUuid}</p>
          ) : null}
        </div>
      </button>
    </li>
  )
}
