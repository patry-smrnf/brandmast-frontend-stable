"use client"

import { CalendarDaysIcon, TimerIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { toDateKey } from "@/lib/dates/date-utils"
import { formatDatePL } from "@/app/(routes)/brandmaster/editor/editor-utils"
import { pl } from "react-day-picker/locale"

import type { ActionPlannerState } from "./use-action-planner-state"

type PlannerStep2DatesProps = {
  state: ActionPlannerState
}

export default function PlannerStep2Dates({ state }: PlannerStep2DatesProps) {
  const {
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    startNorm,
    endNorm,
    selectedDates,
    setSelectedDates,
    sortedSelectedDates,
    step2NextBlocked,
    setStep,
  } = state

  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-1">
        <CardTitle className="inline-flex items-center gap-2">
          <CalendarDaysIcon className="size-5 text-muted-foreground" />
          Daty i godziny
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="planner-startTime">Rozpoczęcie (since)</Label>
            <div className="relative">
              <TimerIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="planner-startTime"
                type="text"
                autoComplete="off"
                spellCheck={false}
                placeholder="np. 8 lub 8:30"
                className="pl-10"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            {startTime ? (
              <div className="text-xs text-muted-foreground">
                {startNorm.ok ? `Ustawiony jako: ${startNorm.value}` : startNorm.reason}
              </div>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="planner-endTime">Koniec (until)</Label>
            <div className="relative">
              <TimerIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="planner-endTime"
                type="text"
                autoComplete="off"
                spellCheck={false}
                placeholder="np. 18 lub 18:45"
                className="pl-10"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
            {endTime ? (
              <div className="text-xs text-muted-foreground">
                {endNorm.ok ? `Zapisane jako: ${endNorm.value}` : endNorm.reason}
              </div>
            ) : null}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Te same godziny będą zastosowane dla każdego wybranego dnia.
        </p>

        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="rounded-xl border border-border bg-card p-2 shadow-sm">
            <div className="flex justify-center">
              <Calendar
                mode="multiple"
                locale={pl}
                weekStartsOn={1}
                defaultMonth={selectedDates[0] ?? new Date()}
                selected={selectedDates}
                onSelect={(val) => setSelectedDates(val ?? [])}
              />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-medium">Wybrane daty</div>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {sortedSelectedDates.length}
                </span>
              </div>
              <div className="mt-2 max-h-[min(320px,40vh)] space-y-2 overflow-auto">
                {sortedSelectedDates.length ? (
                  sortedSelectedDates.map((d) => (
                    <div
                      key={toDateKey(d)}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2"
                    >
                      <div className="min-w-0 truncate text-sm">{formatDatePL(d)}</div>
                      <div className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {toDateKey(d)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">Nie wybrano dat.</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={() => setStep(1)}>
            Wstecz
          </Button>
          <Button className="shadow-sm" disabled={step2NextBlocked} onClick={() => setStep(3)}>
            Dalej
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
