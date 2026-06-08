"use client"

import * as React from "react"
import {
  CheckIcon,
  GiftIcon,
  Loader2Icon,
  PlusIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { BonusResponse } from "@/lib/api"
import { cn } from "@/lib/utils"

import { formatMoneyPl } from "./cas-action-utils"
import type { BrandmasterBonusExtrasState } from "./use-brandmaster-bonus-extras"

function formatCreatedAtLabel(createdAt?: string): string | null {
  if (!createdAt?.trim()) return null
  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date)
}

function BonusExtraCardSkeleton() {
  return (
    <div
      className="flex animate-pulse items-center gap-2.5 rounded-lg border border-border/60 bg-background px-3 py-2.5"
      aria-hidden
    >
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="h-3.5 w-3/5 max-w-[140px] rounded-md bg-muted" />
        <div className="h-2.5 w-16 rounded-md bg-muted/80" />
      </div>
      <div className="h-4 w-14 shrink-0 rounded-md bg-muted" />
    </div>
  )
}

function BonusExtrasCardsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div
      className="max-h-[min(45vh,13rem)] space-y-1.5 overflow-hidden sm:max-h-56"
      aria-busy="true"
      aria-label="Ładowanie dodatków"
    >
      {Array.from({ length: count }).map((_, index) => (
        <BonusExtraCardSkeleton key={index} />
      ))}
    </div>
  )
}

function BonusExtraCard({
  item,
  editing,
  saving,
  deleting,
  draftTitle,
  draftAmount,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDelete,
  onDraftChange,
}: {
  item: BonusResponse
  editing: boolean
  saving: boolean
  deleting: boolean
  draftTitle: string
  draftAmount: string
  onStartEdit: () => void
  onCancelEdit: () => void
  onSave: () => void
  onDelete: () => void
  onDraftChange: (field: "title" | "amount", value: string) => void
}) {
  const createdLabel = formatCreatedAtLabel(item.createdAt)
  const title = item.title?.trim() || "Bez nazwy"
  const amount = item.amount ?? 0

  if (editing) {
    return (
      <div className="rounded-lg border border-primary/35 bg-background px-3 py-2.5 shadow-sm ring-1 ring-primary/10">
        <div className="space-y-2">
          <div className="space-y-1">
            <Label htmlFor={`bonus-title-${item.idBonus}`} className="text-[11px] text-muted-foreground">
              Tytuł
            </Label>
            <Input
              id={`bonus-title-${item.idBonus}`}
              value={draftTitle}
              onChange={(e) => onDraftChange("title", e.target.value)}
              placeholder="Np. premia specjalna"
              className="h-9 text-base sm:text-sm"
              disabled={saving || deleting}
              autoComplete="off"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`bonus-amount-${item.idBonus}`} className="text-[11px] text-muted-foreground">
              Kwota (zł)
            </Label>
            <Input
              id={`bonus-amount-${item.idBonus}`}
              type="text"
              inputMode="decimal"
              value={draftAmount}
              onChange={(e) => onDraftChange("amount", e.target.value)}
              placeholder="0"
              className="h-9 text-base tabular-nums sm:text-sm"
              disabled={saving || deleting}
              autoComplete="off"
            />
          </div>
        </div>
        <div className="mt-2.5 flex items-center gap-1.5">
          <Button
            type="button"
            size="sm"
            className="h-8 min-w-0 flex-1"
            onClick={onSave}
            disabled={saving || deleting}
          >
            {saving ? (
              <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <CheckIcon className="size-3.5" aria-hidden />
            )}
            Zapisz
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 min-w-0 flex-1"
            onClick={onCancelEdit}
            disabled={saving || deleting}
          >
            <XIcon className="size-3.5" aria-hidden />
            Anuluj
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="icon-sm"
            className="shrink-0"
            onClick={onDelete}
            disabled={saving || deleting}
            aria-label="Usuń dodatek"
          >
            {deleting ? (
              <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <Trash2Icon className="size-3.5" aria-hidden />
            )}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      className="flex w-full items-center gap-2.5 rounded-lg border border-border/80 bg-background px-3 py-2.5 text-left transition-colors hover:border-primary/30 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 active:bg-muted/50"
      onClick={onStartEdit}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-tight">{title}</p>
        {createdLabel ? (
          <p className="mt-0.5 text-[10px] text-muted-foreground">{createdLabel}</p>
        ) : null}
      </div>
      <p className="shrink-0 text-sm font-semibold tabular-nums">{formatMoneyPl(amount)}</p>
    </button>
  )
}

function BonusExtraCreateCard({
  draftTitle,
  draftAmount,
  saving,
  onDraftChange,
  onSave,
  onCancel,
}: {
  draftTitle: string
  draftAmount: string
  saving: boolean
  onDraftChange: (field: "title" | "amount", value: string) => void
  onSave: () => void
  onCancel: () => void
}) {
  return (
    <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 px-3 py-2.5">
      <p className="mb-2 text-[11px] font-medium text-muted-foreground">Nowy dodatek</p>
      <div className="space-y-2">
        <div className="space-y-1">
          <Label htmlFor="bonus-create-title" className="text-[11px] text-muted-foreground">
            Tytuł
          </Label>
          <Input
            id="bonus-create-title"
            value={draftTitle}
            onChange={(e) => onDraftChange("title", e.target.value)}
            placeholder="Np. premia specjalna"
            className="h-9 text-base sm:text-sm"
            disabled={saving}
            autoComplete="off"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="bonus-create-amount" className="text-[11px] text-muted-foreground">
            Kwota (zł)
          </Label>
          <Input
            id="bonus-create-amount"
            type="text"
            inputMode="decimal"
            value={draftAmount}
            onChange={(e) => onDraftChange("amount", e.target.value)}
            placeholder="0"
            className="h-9 text-base tabular-nums sm:text-sm"
            disabled={saving}
            autoComplete="off"
          />
        </div>
      </div>
      <div className="mt-2.5 flex items-center gap-1.5">
        <Button type="button" size="sm" className="h-8 min-w-0 flex-1" onClick={onSave} disabled={saving}>
          {saving ? (
            <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
          ) : (
            <CheckIcon className="size-3.5" aria-hidden />
          )}
          Dodaj
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 min-w-0 flex-1"
          onClick={onCancel}
          disabled={saving}
        >
          <XIcon className="size-3.5" aria-hidden />
          Anuluj
        </Button>
      </div>
    </div>
  )
}

export function BonusExtrasSection({ extras }: { extras: BrandmasterBonusExtrasState }) {
  const {
    items,
    loading,
    loadError,
    editing,
    savingId,
    deletingId,
    extrasTotal,
    isCreating,
    loadExtras,
    getDraftForItem,
    startEdit,
    startCreate,
    cancelEditing,
    updateDraft,
    handleSaveEdit,
    handleCreate,
    handleDelete,
  } = extras

  return (
    <section className="space-y-2 rounded-lg border border-border/80 bg-muted/25 px-3 py-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-0.5">
          <p className="flex items-center gap-1.5 text-xs font-semibold">
            <GiftIcon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
            Dodatki
          </p>
          <p className="text-[11px] leading-snug text-muted-foreground">
            Np. Szkolenie nowego BM, Brief na teams itd
          </p>
        </div>
        {loading ? (
          <div className="h-5 w-14 shrink-0 animate-pulse rounded-md bg-muted" aria-hidden />
        ) : (
          <p className="shrink-0 text-sm font-semibold tabular-nums">{formatMoneyPl(extrasTotal)}</p>
        )}
      </div>

      {loading ? (
        <BonusExtrasCardsSkeleton />
      ) : loadError ? (
        <div className="space-y-2 py-2">
          <p className="text-xs text-destructive">{loadError}</p>
          <Button type="button" variant="outline" size="sm" className="h-8" onClick={() => void loadExtras()}>
            Spróbuj ponownie
          </Button>
        </div>
      ) : (
        <>
          <div
            className={cn(
              "space-y-1.5 overflow-y-auto overscroll-y-contain pr-0.5",
              items.length > 0 || isCreating ? "max-h-[min(45vh,13rem)] sm:max-h-56" : "",
            )}
          >
            {items.length === 0 && !isCreating ? (
              <p className="py-3 text-center text-xs text-muted-foreground">Brak dodatków.</p>
            ) : (
              items.map((item) => {
                const id = item.idBonus
                if (id == null) return null
                const isEditing = editing.mode === "edit" && editing.idBonus === id
                const draft = getDraftForItem(id)
                return (
                  <BonusExtraCard
                    key={id}
                    item={item}
                    editing={isEditing}
                    saving={savingId === id}
                    deleting={deletingId === id}
                    draftTitle={draft.title}
                    draftAmount={draft.amount}
                    onStartEdit={() => startEdit(item)}
                    onCancelEdit={cancelEditing}
                    onSave={() => void handleSaveEdit(id)}
                    onDelete={() => void handleDelete(id)}
                    onDraftChange={updateDraft}
                  />
                )
              })
            )}
            {isCreating ? (
              <BonusExtraCreateCard
                draftTitle={editing.mode === "create" ? editing.title : ""}
                draftAmount={editing.mode === "create" ? editing.amount : ""}
                saving={savingId === "create"}
                onDraftChange={updateDraft}
                onSave={() => void handleCreate()}
                onCancel={cancelEditing}
              />
            ) : null}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 w-full"
            onClick={startCreate}
            disabled={isCreating || savingId != null || deletingId != null}
          >
            <PlusIcon className="size-3.5" aria-hidden />
            Dodaj dodatek
          </Button>
        </>
      )}
    </section>
  )
}
