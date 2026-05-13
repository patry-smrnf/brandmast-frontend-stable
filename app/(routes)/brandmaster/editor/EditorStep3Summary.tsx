"use client"

import { CheckIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { ShopResponse } from "@/lib/api/generated/types"

import { toDateKey } from "../actions/date-utils"
import { buildShopLabel, formatDatePL } from "./editor-utils"

export type EditorStep3SummaryProps = {
  isEditMode: boolean
  selectedDates: Date[]
  startNorm: { ok: true; value: string } | { ok: false; reason: string }
  endNorm: { ok: true; value: string } | { ok: false; reason: string }
  startTime: string
  endTime: string
  selectedShop: ShopResponse | null
  onSubmit: () => void
}

export default function EditorStep3Summary({
  isEditMode,
  selectedDates,
  startNorm,
  endNorm,
  startTime,
  endTime,
  selectedShop,
  onSubmit,
}: EditorStep3SummaryProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-1">
        <CardTitle className="inline-flex items-center gap-2">
          <CheckIcon className="size-5 text-muted-foreground" />
          Podsumowanie
        </CardTitle>
        <CardDescription>Sprawdź dane przed {isEditMode ? "zapisem" : "utworzeniem"}.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 gap-3">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="text-xs text-muted-foreground">Daty</div>
            <div className="mt-2 space-y-2">
              {selectedDates
                .slice()
                .sort((a, b) => a.getTime() - b.getTime())
                .map((d) => (
                  <div
                    key={toDateKey(d)}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2"
                  >
                    <div className="min-w-0 truncate text-sm">{formatDatePL(d)}</div>
                    <div className="text-xs text-muted-foreground tabular-nums">{toDateKey(d)}</div>
                  </div>
                ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="text-xs text-muted-foreground">Godziny</div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <span className="rounded-lg border border-border bg-background px-3 py-2 tabular-nums">
                {startNorm.ok ? startNorm.value : startTime}
              </span>
              <span className="text-muted-foreground">→</span>
              <span className="rounded-lg border border-border bg-background px-3 py-2 tabular-nums">
                {endNorm.ok ? endNorm.value : endTime}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="text-xs text-muted-foreground">Sklep</div>
            <div className="mt-2">
              {selectedShop ? (
                <>
                  <div className="text-sm font-medium">{buildShopLabel(selectedShop)}</div>
                  <div className="mt-1 text-xs text-muted-foreground tabular-nums">
                    idShop: {selectedShop.id ?? "—"}
                  </div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">Nie wybrano.</div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button className="shadow-sm" onClick={onSubmit}>
            {isEditMode ? "Zapisz" : "Stwórz"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
