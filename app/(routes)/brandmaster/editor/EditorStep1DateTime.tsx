"use client"

import * as React from "react"
import { CalendarDaysIcon, TimerIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { pl } from "react-day-picker/locale"
import { cn } from "@/lib/utils"

import { toDateKey } from "@/lib/dates/date-utils"
import { formatDatePL } from "./editor-utils"

export type EditorStep1DateTimeProps = {
  startTime: string
  setStartTime: (v: string) => void
  endTime: string
  setEndTime: (v: string) => void
  startNorm: { ok: true; value: string } | { ok: false; reason: string }
  endNorm: { ok: true; value: string } | { ok: false; reason: string }
  allowMultiDates: boolean
  setAllowMultiDates: (v: boolean) => void
  isEditMode: boolean
  isMultiDatesEffective: boolean
  selectedDates: Date[]
  setSelectedDates: (v: Date[]) => void
  calendarMonth: Date
  onCalendarMonthChange: (month: Date) => void
  monthActionsLoading: boolean
  plannedActionDates: Date[]
  editingActionDate: Date | null
  nextDisabledStep1: boolean
  onNext: () => void
}

const CALENDAR_ACTION_MODIFIERS_CLASS_NAMES = {
  hasAction:
    "[&_button]:after:absolute [&_button]:after:bottom-1 [&_button]:after:left-1/2 [&_button]:after:-translate-x-1/2 [&_button]:after:size-1 [&_button]:after:rounded-full [&_button]:after:bg-violet-500",
  editingAction:
    "[&_button]:bg-amber-500/15 [&_button]:ring-2 [&_button]:ring-inset [&_button]:ring-amber-500/55",
} as const

function CalendarLoadingSkeleton() {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/85 p-3 backdrop-blur-[1px]">
      <div className="grid w-full max-w-[280px] grid-cols-7 gap-1.5">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="aspect-square animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    </div>
  )
}

export default function EditorStep1DateTime({
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  startNorm,
  endNorm,
  allowMultiDates,
  setAllowMultiDates,
  isEditMode,
  isMultiDatesEffective,
  selectedDates,
  setSelectedDates,
  calendarMonth,
  onCalendarMonthChange,
  monthActionsLoading,
  plannedActionDates,
  editingActionDate,
  nextDisabledStep1,
  onNext,
}: EditorStep1DateTimeProps) {
  const actionModifiers = React.useMemo(() => {
    const modifiers: Record<string, Date[]> = {
      hasAction: plannedActionDates,
    }
    if (editingActionDate) {
      modifiers.editingAction = [editingActionDate]
    }
    return modifiers
  }, [plannedActionDates, editingActionDate])

  const sharedCalendarProps = {
    locale: pl,
    weekStartsOn: 1 as const,
    month: calendarMonth,
    onMonthChange: onCalendarMonthChange,
    modifiers: actionModifiers,
    modifiersClassNames: CALENDAR_ACTION_MODIFIERS_CLASS_NAMES,
  }
  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-1">
        <CardTitle className="inline-flex items-center gap-2">
          <CalendarDaysIcon className="size-5 text-muted-foreground" />
          Data i godziny
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="startTime">Rozpoczęcie</Label>
            <div className="relative">
              <TimerIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="startTime"
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
                {startNorm.ok ? `Zapisane jako: ${startNorm.value}` : startNorm.reason}
              </div>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="endTime">Koniec</Label>
            <div className="relative">
              <TimerIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="endTime"
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

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="text-sm font-medium">Wybierz datę</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {isMultiDatesEffective
                ? "Tryb multi: możesz wybrać kilka dni."
                : "Tryb single: wybierasz jeden dzień."}
            </div>
          </div>

          <label
            className={cn(
              "inline-flex items-center gap-2 rounded-2xl border-0 ring-1 ring-border/60 bg-card px-3 py-2 text-sm",
              isEditMode ? "opacity-60" : null
            )}
          >
            <Checkbox
              checked={allowMultiDates}
              disabled={isEditMode}
              onCheckedChange={(v: boolean | "indeterminate") => setAllowMultiDates(Boolean(v))}
            />
            Wybierz wiele dat
          </label>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative rounded-2xl border-0 ring-1 ring-border/60 bg-card p-2 shadow-sm">
            {monthActionsLoading ? <CalendarLoadingSkeleton /> : null}
            <div className="flex justify-center">
              {isMultiDatesEffective ? (
                <Calendar
                  mode="multiple"
                  {...sharedCalendarProps}
                  selected={selectedDates}
                  onSelect={(val) => setSelectedDates(val ?? [])}
                />
              ) : (
                <Calendar
                  mode="single"
                  {...sharedCalendarProps}
                  selected={selectedDates[0]}
                  onSelect={(val) => setSelectedDates(val ? [val] : [])}
                />
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-violet-500" />
                Zaplanowana akcja
              </span>
              {isEditMode ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-3 rounded-sm bg-amber-500/15 ring-2 ring-inset ring-amber-500/55" />
                  Edytowana akcja
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex-1">
            <div className="rounded-2xl border-0 ring-1 ring-border/60 bg-card p-4 shadow-sm">
              <div className="text-sm font-medium">Wybrane daty</div>
              <div className="mt-2 space-y-2">
                {selectedDates.length ? (
                  selectedDates
                    .slice()
                    .sort((a, b) => a.getTime() - b.getTime())
                    .slice(0, 6)
                    .map((d) => (
                      <div
                        key={toDateKey(d)}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2"
                      >
                        <div className="min-w-0 truncate text-sm">{formatDatePL(d)}</div>
                        <div className="text-xs text-muted-foreground tabular-nums">{toDateKey(d)}</div>
                      </div>
                    ))
                ) : (
                  <div className="text-sm text-muted-foreground">Nie wybrano daty.</div>
                )}
                {selectedDates.length > 6 ? (
                  <div className="text-xs text-muted-foreground">+{selectedDates.length - 6} kolejne…</div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button className="shadow-sm" disabled={nextDisabledStep1} onClick={onNext}>
            Dalej
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
