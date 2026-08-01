"use client"

import * as React from "react"
import {
  AlertTriangleIcon,
  CalendarDaysIcon,
  CheckIcon,
  ChevronDownIcon,
  ClockIcon,
  ListIcon,
  MapPinIcon,
  PackageIcon,
  PlusCircleIcon,
  RefreshCwIcon,
  SmartphoneIcon,
} from "lucide-react"

import { CompactGroupedList } from "@/components/data-display/CompactGroupedList"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  brandmastApi,
  type OneTwoOneAplikacjaZgloszenie,
  type TourPlannerActionListItem,
} from "@/lib/api"
import { isAxiosError } from "axios"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
  formatCasAddress,
  formatCasTime,
  getCasActionTitle,
  parseCasDatetime,
} from "../cas-action-utils"
import { formatPlDatePoland, nowInPoland, parseIso } from "@/lib/dates/date-utils"

import { getRegionLabel } from "../121Sampling/121-sampling-utils"
import { bmSegmentedTab, bmSegmentedTrack } from "../brandmaster-ui"
import { use121ResolvedTeam } from "../121Sampling/use-121-resolved-team"
import {
  buildZgloszeniaAplikacjeAddRequests,
  formatAplikacjaDateTime,
  getProductName,
  isValidConsumerEmail,
  parseConsumerEmails,
  type AplikacjeView,
} from "./121-aplikacje-utils"
import { use121AplikacjeList } from "./use-121-aplikacje-list"
import { use121SubmitAplikacje } from "./use-121-submit-aplikacje"

function readApiError(err: unknown): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined
    return data?.message ?? err.message ?? "Błąd sieci."
  }
  if (err instanceof Error) return err.message
  return "Nieznany błąd."
}

function ViewSwitcher({
  view,
  onChange,
}: {
  view: AplikacjeView
  onChange: (view: AplikacjeView) => void
}) {
  return (
    <div
      className={bmSegmentedTrack}
      role="tablist"
      aria-label="Widok 121 Aplikacje"
    >
      <button
        type="button"
        role="tab"
        aria-selected={view === "list"}
        className={cn(bmSegmentedTab(view === "list"), "min-h-10 gap-1.5")}
        onClick={() => onChange("list")}
      >
        <ListIcon className="size-3.5 shrink-0" aria-hidden />
        <span className="truncate">Lista aplikacji</span>
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={view === "submit"}
        className={cn(bmSegmentedTab(view === "submit"), "min-h-10 gap-1.5")}
        onClick={() => onChange("submit")}
      >
        <PlusCircleIcon className="size-3.5 shrink-0" aria-hidden />
        <span className="truncate">Dodaj aplikację</span>
      </button>
    </div>
  )
}

function ListLoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 2 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <div className="h-9 animate-pulse bg-muted/50" />
          <CardContent className="space-y-2 p-3">
            <div className="h-14 animate-pulse rounded-lg bg-muted/60" />
            <div className="h-14 animate-pulse rounded-lg bg-muted/60" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function AplikacjaListItem({
  item,
  productLabel,
}: {
  item: OneTwoOneAplikacjaZgloszenie
  productLabel: string
}) {
  return (
    <div className="px-3 py-3 sm:px-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <p className="truncate text-sm font-medium leading-tight">
            {item.nr_akcji_pelen?.trim() || "Bez numeru akcji"}
          </p>
          <p className="text-xs text-muted-foreground">
            Produkt: <span className="text-foreground">{productLabel}</span>
          </p>
        </div>
      </div>
      <dl className="mt-2 grid gap-1 text-xs text-muted-foreground">
        <div className="flex flex-wrap gap-x-1.5">
          <dt className="shrink-0">Wpisanie:</dt>
          <dd className="tabular-nums text-foreground/90">{formatAplikacjaDateTime(item.data_wpisu)}</dd>
        </div>
        {item.mail_konsumenta ? (
          <div className="flex flex-wrap gap-x-1.5">
            <dt className="shrink-0">E-mail:</dt>
            <dd className="truncate text-foreground/90">{item.mail_konsumenta}</dd>
          </div>
        ) : null}
        {item.login ? (
          <div className="flex flex-wrap gap-x-1.5">
            <dt className="shrink-0">Login:</dt>
            <dd className="truncate text-foreground/90">{item.login}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  )
}

function getActionRowKey(action: TourPlannerActionListItem): string {
  return action.ident?.trim() || action.uuid?.trim() || action.name?.trim() || "action"
}

function formatActionDateLabel(action: TourPlannerActionListItem): string {
  const start =
    parseCasDatetime(action.history?.start) ??
    (action.since ? parseIso(action.since.includes("T") ? action.since : `${action.since}T12:00:00`) : null)
  if (!start) return "—"
  return formatPlDatePoland(start)
}

function SubmitActionRow({
  action,
  selected,
  onSelect,
}: {
  action: TourPlannerActionListItem
  selected: boolean
  onSelect: () => void
}) {
  const title = getCasActionTitle(action)
  const ident = action.ident?.trim()
  const shopName = action.point?.name?.trim()
  const address = formatCasAddress(action.point?.address)
  const startLabel = formatCasTime(action.history?.start)
  const stopLabel = formatCasTime(action.history?.stop)

  return (
    <button
      type="button"
      className={cn(
        "w-full rounded-lg border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
        selected
          ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
          : "border-border/80 bg-muted/30 hover:bg-muted/45",
      )}
      onClick={onSelect}
      aria-pressed={selected}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border",
            selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background",
          )}
          aria-hidden
        >
          {selected ? <CheckIcon className="size-3" /> : null}
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="truncate text-sm font-medium leading-tight">{title}</p>
          {(ident || shopName) && (
            <p className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
              {ident ? (
                <span className="shrink-0 rounded-md border border-border/60 bg-background/80 px-1.5 py-0.5 font-mono text-[11px] leading-none tabular-nums">
                  {ident}
                </span>
              ) : null}
              {shopName ? <span className="min-w-0 truncate">{shopName}</span> : null}
            </p>
          )}
          <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 tabular-nums">
              <CalendarDaysIcon className="size-3 shrink-0" aria-hidden />
              {formatActionDateLabel(action)}
            </span>
            <span className="text-muted-foreground/45" aria-hidden>
              ·
            </span>
            <span className="inline-flex items-center gap-1 tabular-nums">
              <ClockIcon className="size-3 shrink-0" aria-hidden />
              {startLabel} – {stopLabel}
            </span>
          </p>
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <MapPinIcon className="mt-0.5 size-3 shrink-0" aria-hidden />
            <span className="line-clamp-2">{address}</span>
          </p>
        </div>
      </div>
    </button>
  )
}

function SubmitLoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-20 animate-pulse rounded-lg bg-muted/60" />
      ))}
    </div>
  )
}

function SelectedActionSummary({ action }: { action: TourPlannerActionListItem }) {
  const title = getCasActionTitle(action)
  const ident = action.ident?.trim()
  const shopName = action.point?.name?.trim()
  const startLabel = formatCasTime(action.history?.start)
  const stopLabel = formatCasTime(action.history?.stop)

  return (
    <div className="min-w-0 space-y-0.5">
      <p className="truncate text-sm font-medium text-foreground">{title}</p>
      <p className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
        {ident ? (
          <span className="shrink-0 rounded-md border border-primary/25 bg-primary/5 px-1.5 py-0.5 font-mono text-[11px] leading-none tabular-nums text-foreground/90">
            {ident}
          </span>
        ) : null}
        {shopName ? <span className="min-w-0 truncate">{shopName}</span> : null}
        <span className="text-muted-foreground/45" aria-hidden>
          ·
        </span>
        <span className="inline-flex items-center gap-1 tabular-nums">
          <CalendarDaysIcon className="size-3 shrink-0" aria-hidden />
          {formatActionDateLabel(action)}
        </span>
        <span className="text-muted-foreground/45" aria-hidden>
          ·
        </span>
        <span className="inline-flex items-center gap-1 tabular-nums">
          <ClockIcon className="size-3 shrink-0" aria-hidden />
          {startLabel}–{stopLabel}
        </span>
      </p>
    </div>
  )
}

function SubmitActionsCard({
  actions,
  isLoading,
  monthLabel,
  selectedActionKey,
  selectedAction,
  onSelectAction,
}: {
  actions: TourPlannerActionListItem[]
  isLoading: boolean
  monthLabel: string
  selectedActionKey: string | null
  selectedAction: TourPlannerActionListItem | null
  onSelectAction: (key: string) => void
}) {
  const [expanded, setExpanded] = React.useState(true)

  function handleSelect(key: string) {
    onSelectAction(key)
    setExpanded(false)
  }

  return (
    <Card className="overflow-hidden rounded-2xl border-0 shadow-md ring-1 ring-border/60">
      <button
        type="button"
        className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <CardHeader className="space-y-2 px-3.5 py-3 pb-2 sm:px-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-1">
              <CardTitle className="text-sm font-semibold">Wybierz akcję</CardTitle>
              {expanded ? (
                <CardDescription className="text-xs">
                  Zakończone akcje od początku {monthLabel} do dzisiaj wybierz jedną.
                </CardDescription>
              ) : selectedAction ? (
                <div className="flex items-start gap-2 pt-0.5">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <CheckIcon className="size-3" aria-hidden />
                  </span>
                  <SelectedActionSummary action={selectedAction} />
                </div>
              ) : (
                <CardDescription className="text-xs">Nie wybrano akcji — rozwiń listę.</CardDescription>
              )}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5 pt-0.5">
              {!isLoading && actions.length > 0 ? (
                <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-normal tabular-nums">
                  {actions.length}
                </Badge>
              ) : null}
              <ChevronDownIcon
                className={cn(
                  "size-4 text-muted-foreground transition-transform duration-200",
                  expanded && "rotate-180",
                )}
                aria-hidden
              />
            </div>
          </div>
          {!expanded && selectedAction ? (
            <Badge variant="outline" className="w-fit gap-1 font-normal text-primary">
              <CheckIcon className="size-3" aria-hidden />
              Wybrana akcja
            </Badge>
          ) : null}
        </CardHeader>
      </button>

      {expanded ? (
        <CardContent className="space-y-2 border-t border-border/80 px-3.5 pb-3.5 pt-2 sm:px-4 sm:pb-4">
          {isLoading ? (
            <SubmitLoadingSkeleton />
          ) : actions.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">
              Brak zakończonych akcji w tym okresie.
            </p>
          ) : (
            <div
              className="max-h-[min(50dvh,16rem)] space-y-2 overflow-y-auto overscroll-contain pr-0.5 [scrollbar-width:thin]"
              role="listbox"
              aria-label="Lista akcji do wyboru"
            >
              {actions.map((action) => {
                const key = getActionRowKey(action)
                return (
                  <SubmitActionRow
                    key={key}
                    action={action}
                    selected={selectedActionKey === key}
                    onSelect={() => handleSelect(key)}
                  />
                )
              })}
            </div>
          )}
        </CardContent>
      ) : null}
    </Card>
  )
}

export default function OneTwoOneAplikacjePage() {
  const [view, setView] = React.useState<AplikacjeView>("list")
  const [selectedActionKey, setSelectedActionKey] = React.useState<string | null>(null)
  const [selectedProductId, setSelectedProductId] = React.useState<number | null>(null)
  const [savedTeamId, setSavedTeamId] = React.useState<number | null>(null)
  const [consumerEmail, setConsumerEmail] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const resolvedTeam = use121ResolvedTeam()
  const list = use121AplikacjeList(resolvedTeam)
  const submit = use121SubmitAplikacje(view === "submit", resolvedTeam.teamId)

  React.useEffect(() => {
    if (resolvedTeam.teamId != null) setSavedTeamId(resolvedTeam.teamId)
  }, [resolvedTeam.teamId])

  const regionLabel = React.useMemo(
    () =>
      resolvedTeam.teamName ??
      getRegionLabel(resolvedTeam.teamId, resolvedTeam.teams),
    [resolvedTeam.teamName, resolvedTeam.teamId, resolvedTeam.teams],
  )

  const listProductName = React.useCallback(
    (productId: number | null | undefined) => getProductName(productId, list.products),
    [list.products],
  )

  const expandedMonthKeys = React.useMemo(() => {
    const hasCurrent = list.groups.some((g) => g.key === list.currentMonthKey)
    return hasCurrent ? [list.currentMonthKey] : list.groups.length ? [list.groups[0].key] : []
  }, [list.groups, list.currentMonthKey])

  const selectedAction = React.useMemo(() => {
    if (!selectedActionKey) return null
    return submit.actions.find((a) => getActionRowKey(a) === selectedActionKey) ?? null
  }, [submit.actions, selectedActionKey])

  const monthLabel = React.useMemo(
    () =>
      new Intl.DateTimeFormat("pl-PL", {
        timeZone: "Europe/Warsaw",
        month: "long",
        year: "numeric",
      }).format(nowInPoland()),
    [],
  )

  const parsedEmails = React.useMemo(
    () => parseConsumerEmails(consumerEmail),
    [consumerEmail],
  )

  const submitValidation = React.useMemo(() => {
    if (!selectedAction || selectedProductId == null) {
      return { canSubmit: false, error: null as string | null, emailCount: 0 }
    }
    const result = buildZgloszeniaAplikacjeAddRequests(
      selectedAction,
      selectedProductId,
      consumerEmail,
    )
    if (!result.ok) return { canSubmit: false, error: result.message, emailCount: parsedEmails.length }
    return { canSubmit: true, error: null, emailCount: result.emails.length }
  }, [selectedAction, selectedProductId, consumerEmail, parsedEmails.length])

  const canSubmit =
    submitValidation.canSubmit &&
    !isSubmitting &&
    !resolvedTeam.isLoading &&
    !submit.isLoading

  async function handleSubmit() {
    if (!selectedAction || selectedProductId == null) {
      toast.error("Wybierz akcję i produkt Rivo.")
      return
    }

    const result = buildZgloszeniaAplikacjeAddRequests(
      selectedAction,
      selectedProductId,
      consumerEmail,
    )
    if (!result.ok) {
      toast.error(result.message)
      return
    }

    const total = result.bodies.length
    setIsSubmitting(true)
    const toastId = toast.loading(
      total === 1 ? "Wysyłanie zgłoszenia…" : `Wysyłanie zgłoszeń (0/${total})…`,
    )
    try {
      let successCount = 0
      let lastError: string | null = null

      for (let i = 0; i < result.bodies.length; i++) {
        if (total > 1) {
          toast.loading(`Wysyłanie zgłoszeń (${i + 1}/${total})…`, { id: toastId })
        }
        try {
          const res = await brandmastApi.addZgloszeniaAplikacje(result.bodies[i])
          if (res.success === false) {
            lastError = res.message ?? "Nie udało się zgłosić aplikacji."
          } else {
            successCount++
          }
        } catch (e) {
          lastError = readApiError(e)
        }
      }

      if (successCount === total) {
        toast.success(
          total === 1
            ? "Zgłoszenie aplikacji zapisane."
            : `Zapisano ${successCount} zgłoszeń aplikacji.`,
          { id: toastId },
        )
        setSelectedActionKey(null)
        setSelectedProductId(null)
        setConsumerEmail("")
        list.refetch()
      } else if (successCount > 0) {
        toast.warning(
          `Zapisano ${successCount} z ${total} zgłoszeń.${lastError ? ` Ostatni błąd: ${lastError}` : ""}`,
          { id: toastId },
        )
        list.refetch()
      } else {
        toast.error(lastError ?? "Nie udało się zgłosić aplikacji.", { id: toastId })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex flex-1 flex-col bg-background pb-24">
      <div className="mx-auto w-full max-w-lg px-3 py-4 sm:max-w-xl sm:px-4 sm:py-5">
        <header className="min-w-0 pr-11">
          <p className="text-xs text-muted-foreground">121 · Aplikacje</p>
          <h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl">Aplikacje</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Zgloszone Aplikacje i dodawanie nowych
          </p>
        </header>

        <div className="mt-4">
          <ViewSwitcher view={view} onChange={setView} />
        </div>

        <Separator className="my-4" />

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 px-3"
            onClick={() => {
              resolvedTeam.refetch()
              if (view === "list") list.refetch()
              else submit.refetch()
            }}
            disabled={
              resolvedTeam.isLoading || (view === "list" ? list.isLoading : submit.isLoading)
            }
          >
            <RefreshCwIcon
              className={cn(
                "size-3.5",
                (resolvedTeam.isLoading ||
                  (view === "list" ? list.isLoading : submit.isLoading)) &&
                  "animate-spin",
              )}
            />
            Odśwież
          </Button>
          {regionLabel ? (
            <Badge variant="outline" className="font-normal">
              {regionLabel}
            </Badge>
          ) : null}
        </div>

        {view === "list" ? (
          <section aria-label="Lista aplikacji" className="space-y-4">
            {(resolvedTeam.error || list.error) ? (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
                <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>{list.error ?? resolvedTeam.error}</span>
              </div>
            ) : null}

            {list.isLoading ? (
              <ListLoadingSkeleton />
            ) : (
              <>
                <Card className="rounded-2xl border-0 shadow-md ring-1 ring-border/60">
                  <CardHeader className="space-y-0.5 px-3.5 py-3 sm:px-4">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                      Zgłoszone aplikacje
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {list.zgloszenia.length}{" "}
                      {list.zgloszenia.length === 1
                        ? "wpis"
                        : list.zgloszenia.length > 1 && list.zgloszenia.length < 5
                          ? "wpisy"
                          : "wpisów"}
                      {regionLabel ? ` · ${regionLabel}` : ""}
                    </CardDescription>
                  </CardHeader>
                </Card>

                <CompactGroupedList
                  groups={list.groups}
                  collapsible
                  defaultExpandedKeys={expandedMonthKeys}
                  emptyMessage={
                    regionLabel
                      ? `Brak zgłoszonych aplikacji${savedTeamId != null ? ` (${regionLabel})` : ""}.`
                      : "Brak zgłoszonych aplikacji."
                  }
                  getItemKey={(item, index) =>
                    String(item.id ?? item.nr_akcji_pelen ?? `aplikacja-${index}`)
                  }
                  renderItem={(item) => (
                    <AplikacjaListItem
                      item={item}
                      productLabel={listProductName(item.oferta_rivo_virto_prod_1)}
                    />
                  )}
                />
              </>
            )}
          </section>
        ) : (
          <section aria-label="Dodaj aplikację" className="space-y-4">
            {(resolvedTeam.error || submit.error) ? (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
                <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>{submit.error ?? resolvedTeam.error}</span>
              </div>
            ) : null}

            <SubmitActionsCard
              actions={submit.actions}
              isLoading={submit.isLoading}
              monthLabel={monthLabel}
              selectedActionKey={selectedActionKey}
              selectedAction={selectedAction}
              onSelectAction={setSelectedActionKey}
            />

            <Card className="rounded-2xl border-0 shadow-md ring-1 ring-border/60">
              <CardHeader className="space-y-0.5 px-3.5 py-3 sm:px-4">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <PackageIcon className="size-3.5 text-muted-foreground" aria-hidden />
                  Produkt Rivo
                </CardTitle>
                <CardDescription className="text-xs">
                  Wybierz paczke Rivo do zgłoszenia aplikacji.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 border-t border-border/80 px-3.5 pb-3.5 pt-2 sm:px-4 sm:pb-4">
                {submit.isLoading ? (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-11 animate-pulse rounded-lg bg-muted/60" />
                    ))}
                  </div>
                ) : submit.products.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    Brak paczek Rivo.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {submit.products.map((product) => {
                      const id = product.id
                      if (id == null) return null
                      const selected = selectedProductId === id
                      return (
                        <button
                          key={id}
                          type="button"
                          className={cn(
                            "flex min-h-11 items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                            selected
                              ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
                              : "border-border/80 bg-muted/30 hover:bg-muted/45",
                          )}
                          aria-pressed={selected}
                          onClick={() => setSelectedProductId(id)}
                        >
                          <span className="min-w-0 truncate font-medium">{product.nazwa?.trim() || `#${id}`}</span>
                          {selected ? (
                            <CheckIcon className="size-4 shrink-0 text-primary" aria-hidden />
                          ) : null}
                        </button>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-0 shadow-md ring-1 ring-border/60">
              <CardHeader className="space-y-0.5 px-3.5 py-3 sm:px-4">
                <CardTitle className="text-sm font-semibold">E-mail konsumenta</CardTitle>
                <CardDescription className="text-xs">
                  Możesz podać wiele adresów — oddziel je przecinkiem, spacją lub nową linią.
                </CardDescription>
              </CardHeader>
              <CardContent className="border-t border-border/80 px-3.5 pb-3.5 pt-2 sm:px-4 sm:pb-4">
                <div className="space-y-1.5">
                  <Label htmlFor="consumer-email" className="text-xs">
                    E-mail
                  </Label>
                  <textarea
                    id="consumer-email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder={"konsument@example.com\ninny@example.com"}
                    value={consumerEmail}
                    onChange={(e) => setConsumerEmail(e.target.value)}
                    rows={3}
                    className={cn(
                      "w-full max-w-full min-w-0 resize-y rounded-lg border border-input bg-background px-3 py-2 text-base shadow-xs transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
                    )}
                  />
                </div>
                {parsedEmails.length > 0 ? (
                  <div className="mt-3 space-y-1.5 rounded-lg border border-border/80 bg-muted/25 px-3 py-2.5">
                    <p className="text-xs font-medium text-muted-foreground">
                      Wykryte adresy ({parsedEmails.length})
                    </p>
                    <ul className="space-y-1">
                      {parsedEmails.map((email) => {
                        const valid = isValidConsumerEmail(email)
                        return (
                          <li key={email} className="flex min-w-0 items-start gap-1.5 text-xs">
                            {valid ? (
                              <CheckIcon className="mt-0.5 size-3 shrink-0 text-primary" aria-hidden />
                            ) : (
                              <AlertTriangleIcon
                                className="mt-0.5 size-3 shrink-0 text-destructive"
                                aria-hidden
                              />
                            )}
                            <span className={cn("min-w-0 break-all", !valid && "text-destructive")}>
                              {email}
                            </span>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {submitValidation.error ? (
              <p className="text-center text-xs text-destructive">{submitValidation.error}</p>
            ) : null}

            <Button
              className="w-full"
              disabled={!canSubmit}
              onClick={() => void handleSubmit()}
            >
              {isSubmitting
                ? "Wysyłanie…"
                : submitValidation.emailCount > 1
                  ? `Zatwierdź zgłoszenia (${submitValidation.emailCount})`
                  : "Zatwierdź zgłoszenie"}
            </Button>
            {selectedProductId != null || savedTeamId != null ? (
              <p className="text-center text-[11px] text-muted-foreground">
                {savedTeamId != null ? (
                  <>
                    Zespół: {regionLabel ?? `ID ${savedTeamId}`}
                    {selectedProductId != null ? " · " : null}
                  </>
                ) : null}
                {selectedProductId != null
                  ? `Produkt: ${getProductName(selectedProductId, submit.products)}`
                  : null}
              </p>
            ) : null}
          </section>
        )}
      </div>
    </main>
  )
}
