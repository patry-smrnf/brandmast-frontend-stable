"use client"

import * as React from "react"
import {
  CalendarDaysIcon,
  ListChecksIcon,
  MapPinIcon,
  MessageSquareTextIcon,
  PlusIcon,
  UserIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

type ActionStatus = "ACCEPTED" | "PENDING" | "REJECTED"

type BrandmasterAction = {
  idAction: number
  status: ActionStatus
  since: string
  until: string
  createdAt: string
  updatedAt: string
  shop: {
    idShop: number
    name: string
    address: string
    geoLat: string | null
    geoLng: string | null
    tpShopId: string
    tpIdent: string
  }
  event: {
    idEvent: number
    name: string
    tpEventId: string
  }
}

type ActionsPayload = {
  brandmaster: {
    idBrandmaster: number
    name: string
    surname: string
    account: {
      idAccount: number
      login: string
      createdAt: string
    }
  }
  actions: BrandmasterAction[]
}

const MOCK_RESPONSE: {
  message: string
  meta: { id: string; timestamp: string }
  success: boolean
  data: ActionsPayload
} = {
  message: "Poprawnie fetched akcje",
  meta: { id: "/api/action/bm/fetch", timestamp: "2026-04-29 22:25:15+02" },
  success: true,
  data: {
    brandmaster: {
      idBrandmaster: 6,
      name: "Patryk",
      surname: "Stępień",
      account: { idAccount: 6, login: "PLH7502", createdAt: "2026-02-05T03:37:23.465745Z" },
    },
    actions: [
      {
        idAction: 2656,
        status: "ACCEPTED",
        since: "2026-04-01T14:30:00Z",
        until: "2026-04-01T18:30:00Z",
        createdAt: "2026-04-01T14:32:05.227501Z",
        updatedAt: "2026-04-01T14:32:05.227499Z",
        shop: {
          idShop: 2169,
          name: "kat. 1_BCP CARREFOUR P.BRYSZ JEROZ. 1119",
          address: "AL. JEROZOLIMSKIE 11/19",
          geoLat: "52.23076600",
          geoLng: "21.01738900",
          tpShopId: "816b115c-7b06-5be8-a296-4bca10dda8b5",
          tpIdent: "314022",
        },
        event: {
          idEvent: 8,
          name: "Traditional Trade",
          tpEventId: "c3909934-7415-561b-ba9e-4fe60d4fca35",
        },
      },
      {
        idAction: 2748,
        status: "ACCEPTED",
        since: "2026-04-03T13:00:00Z",
        until: "2026-04-03T17:00:00Z",
        createdAt: "2026-04-03T13:15:56.315622Z",
        updatedAt: "2026-04-03T13:15:56.31562Z",
        shop: {
          idShop: 2093,
          name: "SHELL 7108",
          address: "ul. Jagiellońska 78",
          geoLat: "52.26921000",
          geoLng: "21.01988300",
          tpShopId: "869729fc-acdd-5205-b94d-ee7e6e8b7078",
          tpIdent: "238845197873",
        },
        event: {
          idEvent: 2,
          name: "Shell",
          tpEventId: "ca186405-a2ea-56bf-90d6-6794b63908cc",
        },
      },
      {
        idAction: 2751,
        status: "ACCEPTED",
        since: "2026-04-03T15:30:00Z",
        until: "2026-04-03T17:30:00Z",
        createdAt: "2026-04-03T15:53:16.686615Z",
        updatedAt: "2026-04-03T15:53:16.686611Z",
        shop: {
          idShop: 1947,
          name: "ŻABKA ZD637",
          address: "ul. Solec 22",
          geoLat: "0.00000000",
          geoLng: "0.00000000",
          tpShopId: "02357e0e-bcb2-5942-9c0b-7183c082ce46",
          tpIdent: "534874281938",
        },
        event: {
          idEvent: 1,
          name: "Zabka",
          tpEventId: "1f039a39-827b-5f4d-b31c-4926004ff234",
        },
      },
      {
        idAction: 2839,
        status: "ACCEPTED",
        since: "2026-04-08T12:30:00Z",
        until: "2026-04-08T14:00:00Z",
        createdAt: "2026-04-07T09:26:07.164597Z",
        updatedAt: "2026-04-08T12:28:51.566161Z",
        shop: {
          idShop: 2383,
          name: "BP 229",
          address: "Grochowska 149/151",
          geoLat: "52.24276200",
          geoLng: "21.09815500",
          tpShopId: "7ed1b9b2-0f44-5e7b-8f52-2a2125089a99",
          tpIdent: "170316",
        },
        event: {
          idEvent: 10,
          name: "BP",
          tpEventId: "07be5272-0dee-11eb-9eb7-ac1f6bbb31f6",
        },
      },
      {
        idAction: 3043,
        status: "ACCEPTED",
        since: "2026-04-10T15:00:00Z",
        until: "2026-04-10T16:00:00Z",
        createdAt: "2026-04-10T15:14:01.667677Z",
        updatedAt: "2026-04-10T15:14:01.667674Z",
        shop: {
          idShop: 1844,
          name: "ŻABKA Z5352",
          address: "Nowy Świat 35 lok. U1",
          geoLat: "52.23381700",
          geoLng: "21.01887600",
          tpShopId: "ecd6d37e-19f7-574c-81d9-7ed98cb5c9c4",
          tpIdent: "155200",
        },
        event: {
          idEvent: 1,
          name: "Zabka",
          tpEventId: "1f039a39-827b-5f4d-b31c-4926004ff234",
        },
      },
      {
        idAction: 3025,
        status: "ACCEPTED",
        since: "2026-04-10T16:30:00Z",
        until: "2026-04-10T21:00:00Z",
        createdAt: "2026-04-10T09:58:54.498016Z",
        updatedAt: "2026-04-10T16:30:07.591139Z",
        shop: {
          idShop: 1754,
          name: "ŻABKA Z7930",
          address: "ul. Świętokrzyska 31/33A lok.3",
          geoLat: "52.23542900",
          geoLng: "21.01048800",
          tpShopId: "e6e2b407-5ff3-5ce0-9e8d-d3d21f8134eb",
          tpIdent: "237675822050",
        },
        event: {
          idEvent: 1,
          name: "Zabka",
          tpEventId: "1f039a39-827b-5f4d-b31c-4926004ff234",
        },
      },
    ],
  },
}

function parseIso(iso: string) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d
}

function toDateKey(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function startOfDay(d: Date) {
  const c = new Date(d)
  c.setHours(0, 0, 0, 0)
  return c
}

function addDays(d: Date, days: number) {
  const c = new Date(d)
  c.setDate(c.getDate() + days)
  return c
}

function formatHeaderDate(d: Date) {
  const day = new Intl.DateTimeFormat("pl-PL", { day: "2-digit" }).format(d)
  const rest = new Intl.DateTimeFormat("pl-PL", {
    weekday: "long",
    month: "long",
    year: "numeric",
  }).format(d)
  return { day, rest }
}

function formatTime(d: Date) {
  return new Intl.DateTimeFormat("pl-PL", { hour: "2-digit", minute: "2-digit" }).format(d)
}

function statusBadgeVariant(status: ActionStatus): React.ComponentProps<typeof Badge>["variant"] {
  switch (status) {
    case "ACCEPTED":
      return "success"
    case "PENDING":
      return "warning"
    case "REJECTED":
      return "destructive"
    default:
      return "secondary"
  }
}

function statusLabel(status: ActionStatus) {
  switch (status) {
    case "ACCEPTED":
      return "Zaakceptowana"
    case "PENDING":
      return "Oczekuje"
    case "REJECTED":
      return "Odrzucona"
    default:
      return status
  }
}

function getInitialSelectedDateKey(_actions: BrandmasterAction[]) {
  // Always start on today's date; user changes the date by clicking a pill.
  return toDateKey(new Date())
}

function DayPill({
  date,
  isActive,
  hasAction,
  onClick,
}: {
  date: Date
  isActive: boolean
  hasAction: boolean
  onClick: () => void
}) {
  const weekday = new Intl.DateTimeFormat("pl-PL", { weekday: "short" }).format(date)
  const day = new Intl.DateTimeFormat("pl-PL", { day: "2-digit" }).format(date)
  const startRef = React.useRef<{ x: number; y: number } | null>(null)
  const movedRef = React.useRef(false)

  return (
    <button
      type="button"
      onPointerDown={(e) => {
        try {
          e.currentTarget.setPointerCapture(e.pointerId)
        } catch {
          // ignore (older browsers / already captured)
        }
        startRef.current = { x: e.clientX, y: e.clientY }
        movedRef.current = false
      }}
      onPointerMove={(e) => {
        const start = startRef.current
        if (!start) return
        const dx = Math.abs(e.clientX - start.x)
        const dy = Math.abs(e.clientY - start.y)
        if (dx > 8 || dy > 8) movedRef.current = true
      }}
      onPointerUp={(e) => {
        if (movedRef.current) return
        e.preventDefault()
        onClick()
      }}
      onPointerCancel={() => {
        startRef.current = null
        movedRef.current = false
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onClick()
        }
      }}
      className={cn(
        "relative flex w-[78px] shrink-0 touch-manipulation flex-col items-center justify-center gap-1 rounded-2xl border border-border bg-card px-3 py-3 text-center transition-colors",
        isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
        !isActive && hasAction ? "border-accent bg-accent/90 text-foreground hover:bg-accent/70" : null
      )}
    >
      {isActive ? (
        <span className="absolute left-2 top-1/2 h-7 w-1 -translate-y-1/2 rounded-full bg-primary" />
      ) : null}
      <div className="text-xs font-medium uppercase tracking-wide">{weekday}</div>
      <div className="text-lg font-semibold leading-none tabular-nums">{day}</div>
    </button>
  )
}

export default function BrandmasterActionsPage() {
  const { data } = MOCK_RESPONSE
  const [selectedDateKey, setSelectedDateKey] = React.useState(() =>
    getInitialSelectedDateKey(data.actions)
  )

  // Fixed, larger range so scrolling is smooth and never reflows the list mid-scroll.
  const DAYS_WINDOW = 365

  const selectedDate = React.useMemo(() => {
    const d = parseIso(`${selectedDateKey}T00:00:00`)
    return d ?? new Date()
  }, [selectedDateKey])

  const headerDate = React.useMemo(() => formatHeaderDate(selectedDate), [selectedDate])

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

  const initials = `${data.brandmaster.name[0] ?? ""}${data.brandmaster.surname[0] ?? ""}`.toUpperCase()

  return (
    <main className="flex flex-1 flex-col bg-background pb-24">
      <div className="mx-auto w-full max-w-5xl px-4 py-6">
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">
              Akcje · {data.brandmaster.name} {data.brandmaster.surname} ·{" "}
              <span className="font-medium text-foreground">{data.brandmaster.account.login}</span>
            </div>
            <div className="mt-2 flex items-baseline gap-3">
              <div className="text-4xl font-semibold tracking-tight tabular-nums">
                {headerDate.day}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium capitalize text-foreground">
                  {headerDate.rest}
                </div>
              </div>
            </div>
          </div>

          <div className="shrink-0">
            <Button size="sm">
              <PlusIcon className="size-3.5" />
              Dodaj akcję
            </Button>
          </div>
        </header>

        <Separator className="my-5" />

        <section aria-label="Kalendarz tygodnia" className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-medium">Ten tydzień</div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => centerCalendarOnDateKey(getInitialSelectedDateKey(data.actions))}
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
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold tracking-tight">Dyspo</h2>
              <p className="text-sm text-muted-foreground">
                {actionsForSelectedDay.length > 0
                  ? `Masz ${actionsForSelectedDay.length} ${
                      actionsForSelectedDay.length === 1 ? "akcję" : "akcje"
                    } tego dnia.`
                  : "Brak akcji na wybrany dzień."}
              </p>
            </div>
            <Button variant="outline" size="sm">
              Filtry
            </Button>
          </div>

          <div className="space-y-3">
            {actionsForSelectedDay.length === 0 ? (
              <Card>
                <CardHeader className="space-y-1">
                  <CardTitle>Spokojny dzien</CardTitle>
                  <CardDescription>Wybierz inny dzien lub dodaj nowa akcje</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-4">
                  <div className="text-sm text-muted-foreground">
                    ProTip: przewin sb w lewo lub prawo, powinno dzialacxd
                  </div>
                  <Button>
                    <PlusIcon className="size-3.5" />
                    Dodaj
                  </Button>
                </CardContent>
              </Card>
            ) : (
              actionsForSelectedDay.map(({ action, sinceDate, untilDate }) => {
                const since = sinceDate!
                const until = untilDate ?? sinceDate!
                const timeLabel = `${formatTime(since)}–${formatTime(until)}`

                return (
                  <div
                    key={action.idAction}
                    className="grid grid-cols-1 gap-3 md:grid-cols-[96px_1fr] md:gap-4"
                  >
                    <div className="md:pt-4">
                      <div className="text-sm font-semibold tabular-nums">{timeLabel}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        ID {action.idAction}
                      </div>
                    </div>

                    <Card className="relative overflow-hidden">
                      <div className="absolute left-0 top-0 h-full w-1 bg-primary/30" />
                      <CardHeader className="space-y-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <CardTitle className="truncate">{action.event.name}</CardTitle>
                            <CardDescription className="truncate">
                              {action.shop.name}
                            </CardDescription>
                          </div>
                          <div className="shrink-0">
                            <Badge variant={statusBadgeVariant(action.status)}>
                              {statusLabel(action.status)}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            <MapPinIcon className="size-4" />
                            <span className="text-foreground">{action.shop.address}</span>
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                          <div className="min-w-0 text-xs text-muted-foreground">
                            Utworzono:{" "}
                            <span className="tabular-nums text-foreground/90">
                              {action.createdAt.slice(0, 19).replace("T", " ")}
                            </span>
                          </div>

                          <div className="shrink-0">
                            <div className="flex items-center gap-2">
                              <Avatar className="size-8">
                                <AvatarFallback>{initials}</AvatarFallback>
                              </Avatar>
                              <div className="hidden sm:block">
                                <div className="text-sm font-medium leading-none">
                                  {data.brandmaster.name} {data.brandmaster.surname}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Brandmaster
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )
              })
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

