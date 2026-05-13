"use client"

import { Suspense } from "react"
import dynamic from "next/dynamic"
import { ChevronLeftIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

import { EditorStep2Location } from "./EditorStep2Location"
import { useEditorState } from "./use-editor-state"

const EditorStep1DateTime = dynamic(() => import("./EditorStep1DateTime"), {
  loading: () => (
    <div className="min-h-[320px] rounded-xl border border-border bg-muted/30 p-6 text-sm text-muted-foreground">
      Ładowanie kroku 1…
    </div>
  ),
})

const EditorStep3Summary = dynamic(() => import("./EditorStep3Summary"), {
  loading: () => (
    <div className="min-h-[240px] rounded-xl border border-border bg-muted/30 p-6 text-sm text-muted-foreground">
      Ładowanie podsumowania…
    </div>
  ),
})

export default function BrandmasterEditorPage() {
  return (
    <Suspense fallback={<div className="flex flex-1 items-center justify-center">Ładowanie…</div>}>
      <BrandmasterEditorInner />
    </Suspense>
  )
}

function BrandmasterEditorInner() {
  const s = useEditorState()

  return (
    <main className="flex flex-1 flex-col bg-background pb-24">
      <div className="mx-auto w-full max-w-5xl px-4 py-6">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">
              {s.isEditMode ? (
                <span className="inline-flex items-center gap-2">
                  <span className="rounded-full bg-accent px-2 py-0.5 font-medium text-foreground">Edycja</span>
                  <span className="tabular-nums">idAction: {s.idAction}</span>
                </span>
              ) : (
                <span className="rounded-full bg-accent px-2 py-0.5 font-medium text-foreground">Nowa akcja</span>
              )}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="text-lg font-semibold tracking-tight">{s.stepTitle(s.step)}</div>
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              Krok <span className="tabular-nums">{s.step}</span> / 3
              {s.loadingEditData ? <span className="ml-2">• Ładowanie danych…</span> : null}
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={s.goBack}>
            <ChevronLeftIcon className="size-3.5" />
            Wstecz
          </Button>
        </header>

        <Separator className="my-5" />

        {s.step === 1 ? (
          <EditorStep1DateTime
            startTime={s.startTime}
            setStartTime={s.setStartTime}
            endTime={s.endTime}
            setEndTime={s.setEndTime}
            startNorm={s.startNorm}
            endNorm={s.endNorm}
            allowMultiDates={s.allowMultiDates}
            setAllowMultiDates={s.setAllowMultiDates}
            isEditMode={s.isEditMode}
            isMultiDatesEffective={s.isMultiDatesEffective}
            selectedDates={s.selectedDates}
            setSelectedDates={s.setSelectedDates}
            nextDisabledStep1={s.nextDisabledStep1}
            onNext={() => s.setStep(2)}
          />
        ) : s.step === 2 ? (
          <EditorStep2Location
            shopsLoading={s.shopsLoading}
            shopMapBundle={s.shopMapBundle}
            selectedShop={s.selectedShop}
            onMarkerSelect={s.onShopMapMarkerSelect}
            shopQuery={s.shopQuery}
            setShopQuery={s.setShopQuery}
            showShopSuggestions={s.showShopSuggestions}
            setShowShopSuggestions={s.setShowShopSuggestions}
            hideShopSuggestionsTimeoutRef={s.hideShopSuggestionsTimeoutRef}
            filteredShops={s.filteredShops}
            setSelectedShop={s.setSelectedShop}
            nextDisabledStep2={s.nextDisabledStep2}
            onShopNext={() => s.setStep(3)}
          />
        ) : (
          <EditorStep3Summary
            isEditMode={s.isEditMode}
            selectedDates={s.selectedDates}
            startNorm={s.startNorm}
            endNorm={s.endNorm}
            startTime={s.startTime}
            endTime={s.endTime}
            selectedShop={s.selectedShop}
            onSubmit={() => {
              void s.onSubmit()
            }}
          />
        )}
      </div>
    </main>
  )
}
