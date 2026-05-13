"use client"

import * as React from "react"
import dynamic from "next/dynamic"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ShopResponse } from "@/lib/api/generated/types"
import { MapPinIcon } from "lucide-react"

import { EditorStep2MapSection, type EditorStep2MapSectionProps } from "./EditorStep2MapSection"
import type { EditorStep2ShopFieldsProps } from "@/app/(routes)/brandmaster/editor/EditorStep2ShopFields"

const EditorStep2ShopFields = dynamic<EditorStep2ShopFieldsProps>(
  () => import("@/app/(routes)/brandmaster/editor/EditorStep2ShopFields"),
  {
    loading: () => (
      <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        Ładowanie wyszukiwarki…
      </div>
    ),
  }
)

export type EditorStep2LocationProps = EditorStep2MapSectionProps & {
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
  onShopNext: () => void
}

export function EditorStep2Location({
  shopsLoading,
  shopMapBundle,
  selectedShop,
  onMarkerSelect,
  shopQuery,
  setShopQuery,
  showShopSuggestions,
  setShowShopSuggestions,
  hideShopSuggestionsTimeoutRef,
  filteredShops,
  setSelectedShop,
  nextDisabledStep2,
  onShopNext,
}: EditorStep2LocationProps) {
  return (
    <Card className="overflow-visible">
      <CardHeader className="space-y-1">
        <CardTitle className="inline-flex items-center gap-2">
          <MapPinIcon className="size-5 text-muted-foreground" />
          Lokalizacja
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <EditorStep2MapSection
          shopsLoading={shopsLoading}
          shopMapBundle={shopMapBundle}
          selectedShop={selectedShop}
          onMarkerSelect={onMarkerSelect}
        />

        <EditorStep2ShopFields
          shopQuery={shopQuery}
          setShopQuery={setShopQuery}
          shopsLoading={shopsLoading}
          showShopSuggestions={showShopSuggestions}
          setShowShopSuggestions={setShowShopSuggestions}
          hideShopSuggestionsTimeoutRef={hideShopSuggestionsTimeoutRef}
          filteredShops={filteredShops}
          selectedShop={selectedShop}
          setSelectedShop={setSelectedShop}
          nextDisabledStep2={nextDisabledStep2}
          onNext={onShopNext}
        />
      </CardContent>
    </Card>
  )
}
