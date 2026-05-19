"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { ShopResponse } from "@/lib/api/generated/types"

import { buildShopLabel, getShopEventName } from "./editor-utils"

export type EditorStep2ShopFieldsProps = {
  shopQuery: string
  setShopQuery: (v: string) => void
  shopsLoading: boolean
  showShopSuggestions: boolean
  setShowShopSuggestions: (v: boolean) => void
  hideShopSuggestionsTimeoutRef: React.MutableRefObject<number | null>
  filteredShops: ShopResponse[]
  selectedShop: ShopResponse | null
  setSelectedShop: (s: ShopResponse | null) => void
  nextDisabledStep2: boolean
  onNext: () => void
}

export default function EditorStep2ShopFields({
  shopQuery,
  setShopQuery,
  shopsLoading,
  showShopSuggestions,
  setShowShopSuggestions,
  hideShopSuggestionsTimeoutRef,
  filteredShops,
  selectedShop,
  setSelectedShop,
  nextDisabledStep2,
  onNext,
}: EditorStep2ShopFieldsProps) {
  return (
    <>
      <div className="relative z-30 space-y-2">
        <Label htmlFor="shopQuery">Adres / nazwa / event</Label>
        <div className="relative">
          <Input
            id="shopQuery"
            placeholder={shopsLoading ? "Ładowanie lokalizacji…" : "Zacznij pisać…"}
            value={shopQuery}
            onFocus={() => {
              if (hideShopSuggestionsTimeoutRef.current) {
                window.clearTimeout(hideShopSuggestionsTimeoutRef.current)
                hideShopSuggestionsTimeoutRef.current = null
              }
              setShowShopSuggestions(true)
            }}
            onBlur={() => {
              hideShopSuggestionsTimeoutRef.current = window.setTimeout(() => {
                setShowShopSuggestions(false)
              }, 120)
            }}
            onChange={(e) => {
              setShopQuery(e.target.value)
              setShowShopSuggestions(true)
            }}
          />

          {showShopSuggestions ? (
            <div
              className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-lg"
              onMouseDown={(e) => {
                e.preventDefault()
              }}
            >
              <div className="flex items-center justify-between gap-3 px-3 py-2 text-xs text-muted-foreground">
                <span>Sugestie</span>
                <span>{shopsLoading ? "Ładowanie…" : `${filteredShops.length} wyników`}</span>
              </div>
              <div className="max-h-[320px] overflow-auto p-2">
                {shopsLoading ? (
                  <div className="rounded-lg border border-border bg-card p-3 text-sm text-muted-foreground">
                    Ładowanie…
                  </div>
                ) : filteredShops.length ? (
                  <div className="space-y-2">
                    {filteredShops.map((s) => {
                      const isSelected = (selectedShop?.id ?? 0) === (s.id ?? 0)
                      return (
                        <button
                          key={String(s.id ?? buildShopLabel(s))}
                          type="button"
                          onClick={() => {
                            setSelectedShop(s)
                            setShopQuery(buildShopLabel(s))
                            setShowShopSuggestions(false)
                          }}
                          className={cn(
                            "w-full rounded-xl border border-border bg-card px-3 py-2 text-left shadow-sm transition-colors hover:bg-muted",
                            isSelected ? "border-accent bg-accent/70" : null
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium">{buildShopLabel(s)}</div>
                              <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                {s.name ? <span>name: {s.name}</span> : null}
                                {getShopEventName(s) ? <span>Event: {getShopEventName(s)}</span> : null}
                              </div>
                            </div>
                            <div className="shrink-0 text-xs text-muted-foreground tabular-nums">
                              {s.id ?? "-"}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="rounded-lg border border-border bg-card p-3 text-sm text-muted-foreground">
                    Brak wyników.
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {selectedShop ? (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="text-xs text-muted-foreground">Wybrano</div>
          <div className="mt-1 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{buildShopLabel(selectedShop)}</div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setSelectedShop(null)}>
              Zmień
            </Button>
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-3">
        <Button className="shadow-sm" disabled={nextDisabledStep2} onClick={onNext}>
          Dalej
        </Button>
      </div>
    </>
  )
}
