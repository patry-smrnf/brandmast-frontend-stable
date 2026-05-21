"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangleIcon,
  CalendarDaysIcon,
  ListChecksIcon,
  PlusIcon,
  RefreshCwIcon,
  UserIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { brandmastApi } from "@/lib/api"
import { useConfigState } from "@/lib/config/configStore"
import { toast } from "sonner"

import { BrandmasterScheduledNotice } from "../BrandmasterScheduledNotice"
import { ActionCard } from "./_components/ActionCard"
import { DayPill } from "./_components/DayPill"
import { addDays, formatHeaderDate, parseIso, startOfDay, toDateKey, toMonthKey } from "@/lib/dates/date-utils"
import { useBmActions } from "./use-bm-actions"

function toEditorMonthParamFromMonthKey(monthKeyYYYYMM: string) {
  const m = /^(\d{4})-(\d{2})$/.exec(monthKeyYYYYMM)
  if (!m) return ""
  const yy = m[1].slice(2)
  const mm = m[2]
  return `${yy}-${mm}`
}

function buildCreateEditorHref(monthParam: string, dateKey: string) {
  const params = new URLSearchParams()
  if (monthParam) params.set("month", monthParam)
  params.set("day", dateKey)
  return `/brandmaster/editor?${params.toString()}`
}

function getInitialSelectedDateKey() {
  // Always start on today's date; user changes the date by clicking a pill.
  return toDateKey(new Date())
}

function actionDurationHours(sinceIso: string, untilIso: string): number {
  const start = parseIso(sinceIso)
  const end = parseIso(untilIso)
  if (!start || !end) return 0
  return Math.max(0, (end.getTime() - start.getTime()) / 3_600_000)
}

/** Wyświetlanie godzin z jedną cyfrą po przecinku (np. 7,5 h). */
function formatHoursPl(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) return "0 h"
  const rounded = Math.round(hours * 10) / 10
  const n = Number.isInteger(rounded) ? String(rounded) : String(rounded).replace(".", ",")
  return `${n} h`
}

function LoadingActionsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <CardHeader className="space-y-2">
            <div className="h-4 w-40 animate-pulse rounded-md bg-muted" />
            <div className="h-3 w-64 animate-pulse rounded-md bg-muted" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-3 w-1/2 animate-pulse rounded-md bg-muted" />
                <div className="h-3 w-2/3 animate-pulse rounded-md bg-muted" />
              </div>
            </div>
            <div className="h-9 w-full animate-pulse rounded-md bg-muted" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function BrandmasterActionsPage() {
  const router = useRouter()
  const { config } = useConfigState()
  const actionsCfg = config?.actionsConfig
  const isAddDisabled = actionsCfg?.isAddingAllowed === false
  const isEditDisabled = actionsCfg?.isEditingAllowed === false
  const isDeleteDisabled =
    actionsCfg?.isDeteletingAllowed === true
      ? false
      : actionsCfg?.isDeteletingAllowed === false || actionsCfg?.isDeletingAllowed === false

  const [selectedDateKey, setSelectedDateKey] = React.useState(() =>
    getInitialSelectedDateKey()
  )

  // Fixed, larger range so scrolling is smooth and never reflows the list mid-scroll.
  const DAYS_WINDOW = 365

  const selectedDate = React.useMemo(() => {
    const d = parseIso(`${selectedDateKey}T00:00:00`)
    return d ?? new Date()
  }, [selectedDateKey])

  const headerDate = React.useMemo(() => formatHeaderDate(selectedDate), [selectedDate])
  const selectedMonthKey = React.useMemo(() => toMonthKey(selectedDate), [selectedDate])
  const editorMonthParam = React.useMemo(
    () => toEditorMonthParamFromMonthKey(selectedMonthKey),
    [selectedMonthKey]
  )

  const { data, isLoading, error, refetch } = useBmActions(selectedMonthKey)

  const scrollerRef = React.useRef<HTMLDivElement | null>(null)
  const stepPxRef = React.useRef<number | null>(null)

  const [windowStart, setWindowStart] = React.useState(() =>
    addDays(selectedDate, -Math.floor(DAYS_WINDOW / 2))
  )

  const weekDays = React.useMemo(
    () => Array.from({ length: DAYS_WINDOW }, (_, i) => addDays(windowStart, i)),
    [windowStart]
  )

  const actionDateKeys = React.useMemo(() => {
    return new Set(
      data.actions
        .map((a) => parseIso(a.since))
        .filter(Boolean)
        .map((d) => toDateKey(d as Date))
    )
  }, [data.actions])

  const centerCalendarOnDateKey = React.useCallback(
    (dateKey: string) => {
      const d = parseIso(`${dateKey}T00:00:00`)
      const base = d ?? new Date()
      setSelectedDateKey(dateKey)
      setWindowStart(startOfDay(addDays(base, -Math.floor(DAYS_WINDOW / 2))))
      stepPxRef.current = null
    },
    [DAYS_WINDOW]
  )

  React.useLayoutEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return

    const children = Array.from(scroller.children) as HTMLElement[]
    if (children.length < 2) return

    if (!stepPxRef.current) {
      const step = children[1].offsetLeft - children[0].offsetLeft
      stepPxRef.current = step > 0 ? step : null
    }

    const step = stepPxRef.current
    if (!step) return

    const targetIndex = weekDays.findIndex((d) => toDateKey(d) === selectedDateKey)
    if (targetIndex < 0) return

    const containerWidth = scroller.getBoundingClientRect().width
    const pillWidth = children[0].getBoundingClientRect().width
    const desiredLeft = Math.max(0, targetIndex * step - (containerWidth / 2 - pillWidth / 2))

    scroller.scrollLeft = desiredLeft
  }, [selectedDateKey, weekDays])

  const actionsForSelectedDay = React.useMemo(() => {
    return data.actions
      .map((a) => ({ action: a, sinceDate: parseIso(a.since), untilDate: parseIso(a.until) }))
      .filter((x) => x.sinceDate && toDateKey(x.sinceDate) === selectedDateKey)
      .sort((a, b) => (a.sinceDate!.getTime() ?? 0) - (b.sinceDate!.getTime() ?? 0))
  }, [data.actions, selectedDateKey])

  const monthTotalHours = React.useMemo(() => {
    return data.actions.reduce((sum, a) => sum + actionDurationHours(a.since, a.until), 0)
  }, [data.actions])

  /** Suma godzin akcji, które **rozpoczynają się** w wybranym dniu lub później w tym samym miesiącu (dane już są z fetch dla miesiąca). */
  const hoursFromSelectedDayInMonth = React.useMemo(() => {
    return data.actions.reduce((sum, a) => {
      const d = parseIso(a.since)
      if (!d) return sum
      const key = toDateKey(d)
      if (key < selectedDateKey) return sum
      if (!key.startsWith(`${selectedMonthKey}-`)) return sum
      return sum + actionDurationHours(a.since, a.until)
    }, 0)
  }, [data.actions, selectedDateKey, selectedMonthKey])

  const initials = `${data.brandmaster.name[0] ?? ""}${data.brandmaster.surname[0] ?? ""}`.toUpperCase()

  const handleDeleteAction = React.useCallback(
    async (idAction: number) => {
      try {
        const res = await brandmastApi.deleteBmAction({ idAction })
        if (res?.success === false) {
          toast.error(typeof res.message === "string" ? res.message : "Nie udało się usunąć akcji.")
          return
        }
        toast.success("Akcja została usunięta.")
        refetch()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Nie udało się usunąć akcji.")
      }
    },
    [refetch]
  )

  const handleCancelAction = React.useCallback(
    async (idAction: number) => {
      try {
        const res = await brandmastApi.cancelBMAction({ idAction })
        if (res?.success === false) {
          toast.error(typeof res.message === "string" ? res.message : "Nie udało się odwołać akcji.")
          return
        }
        toast.success("Akcja została odwołana.")
        refetch()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Nie udało się odwołać akcji.")
      }
    },
    [refetch]
  )

  return (
    <main className="flex flex-1 flex-col bg-background pb-24">
      <div className="mx-auto w-full max-w-5xl px-4 py-6">
        <BrandmasterScheduledNotice />
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <UserIcon className="size-3.5" />
                <span className="truncate">
                  {data.brandmaster.name} {data.brandmaster.surname}
                </span>
              </span>
              <span className="text-muted-foreground/60">•</span>
              <span className="font-medium text-foreground">{data.brandmaster.account.login}</span>
              <span className="text-muted-foreground/60">•</span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDaysIcon className="size-3.5" />
                <span className="tabular-nums">{selectedMonthKey}</span>
              </span>
              {isLoading ? (
                <>
                  <span className="text-muted-foreground/60">•</span>
                  <span className="inline-flex items-center gap-1.5">
                    <RefreshCwIcon className="size-3.5 animate-spin" />
                    Ładowanie
                  </span>
                </>
              ) : null}
            </div>

            <div className="mt-3 flex items-baseline gap-3">
              <div className="text-4xl font-semibold tracking-tight tabular-nums">{headerDate.day}</div>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium capitalize text-foreground">{headerDate.rest}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {error ? (
                    <span className="inline-flex items-center gap-1.5">
                      <AlertTriangleIcon className="size-3.5 text-destructive" />
                      <span className="truncate">{error}</span>
                    </span>
                  ) : data.actions.length > 0 ? (
                    <span className="inline-flex items-start gap-1.5">
                      <ListChecksIcon className="mt-0.5 size-3.5 shrink-0" />
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span>
                          Akcje w tym miesiącu:{" "}
                          <span className="font-medium tabular-nums text-foreground">{data.actions.length}</span>
                        </span>
                        <span>
                        godziny akcji w tym miesiącu:{" "}
                          <span className="font-medium tabular-nums text-foreground">
                            {formatHoursPl(monthTotalHours)}
                          </span>
                        </span>
                        <span>
                          Godziny od wybranego dnia:{" "}
                          <span className="font-medium tabular-nums text-foreground">
                            {formatHoursPl(hoursFromSelectedDayInMonth)}
                          </span>
                        </span>
                      </span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5">
                      <ListChecksIcon className="size-3.5" />
                      Brak akcji w tym miesiącu
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="shrink-0">
            <Button
              size="sm"
              className="shadow-sm"
              disabled={isAddDisabled}
              onClick={() => router.push(buildCreateEditorHref(editorMonthParam, selectedDateKey))}
            >
              <PlusIcon className="size-3.5" />
              Dodaj akcję
            </Button>
          </div>
        </header>

        <Separator className="my-5" />

        <section aria-label="Kalendarz tygodnia" className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 text-sm font-medium">
              <CalendarDaysIcon className="size-4 text-muted-foreground" />
              Ten tydzień
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => centerCalendarOnDateKey(getInitialSelectedDateKey())}
            >
              Dzisiaj
            </Button>
          </div>

          <div
            ref={scrollerRef}
            className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 touch-pan-x overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {weekDays.map((d) => {
              const key = toDateKey(d)
              return (
                <DayPill
                  key={key}
                  date={d}
                  isActive={key === selectedDateKey}
                  hasAction={actionDateKeys.has(key)}
                  onClick={() => centerCalendarOnDateKey(key)}
                />
              )
            })}
          </div>
        </section>

        <Separator className="my-5" />

        <section aria-label="Dyspo" className="space-y-4">
          <div className="space-y-3">
            {isLoading ? (
              <LoadingActionsSkeleton />
            ) : actionsForSelectedDay.length === 0 ? (
              <Card>
                <CardHeader className="space-y-1">
                  <CardTitle>Spokojny dzien</CardTitle>
                  <CardDescription>Wybierz inny dzien lub dodaj nowa akcje</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-4">
                  <div className="text-sm text-muted-foreground">
                    ProTip: przewin sb w lewo lub prawo, powinno dzialacxd
                  </div>
                  <Button
                    disabled={isAddDisabled}
                    onClick={() => router.push(buildCreateEditorHref(editorMonthParam, selectedDateKey))}
                  >
                    <PlusIcon className="size-3.5" />
                    Dodaj
                  </Button>
                </CardContent>
              </Card>
            ) : (
              actionsForSelectedDay.map(({ action }) => (
                <ActionCard
                  key={action.idAction}
                  action={action}
                  initials={initials}
                  brandmasterName={data.brandmaster.name}
                  brandmasterSurname={data.brandmaster.surname}
                  editDisabled={isEditDisabled}
                  deleteDisabled={isDeleteDisabled}
                  onDelete={() => handleDeleteAction(action.idAction)}
                  onCancel={() => handleCancelAction(action.idAction)}
                />
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

