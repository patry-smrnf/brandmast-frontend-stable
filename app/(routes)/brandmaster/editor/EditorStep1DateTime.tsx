"use client"

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
  nextDisabledStep1: boolean
  onNext: () => void
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
  nextDisabledStep1,
  onNext,
}: EditorStep1DateTimeProps) {
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
                {startNorm.ok ? `Zapiszę jako: ${startNorm.value}` : startNorm.reason}
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
                {endNorm.ok ? `Zapiszę jako: ${endNorm.value}` : endNorm.reason}
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
              "inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm",
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
          <div className="rounded-xl border border-border bg-card p-2 shadow-sm">
            <div className="flex justify-center">
              {isMultiDatesEffective ? (
                <Calendar
                  mode="multiple"
                  locale={pl}
                  weekStartsOn={1}
                  defaultMonth={selectedDates[0] ?? new Date()}
                  selected={selectedDates}
                  onSelect={(val) => setSelectedDates(val ?? [])}
                />
              ) : (
                <Calendar
                  mode="single"
                  locale={pl}
                  weekStartsOn={1}
                  defaultMonth={selectedDates[0] ?? new Date()}
                  selected={selectedDates[0]}
                  onSelect={(val) => setSelectedDates(val ? [val] : [])}
                />
              )}
            </div>
          </div>

          <div className="flex-1">
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
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
