"use client"

import * as React from "react"
import {
  AlertTriangleIcon,
  CalendarDaysIcon,
  CheckIcon,
  ChevronDownIcon,
  ClockIcon,
  FlaskConicalIcon,
  ListIcon,
  MapPinIcon,
  PackageIcon,
  PlusCircleIcon,
  RefreshCwIcon,
} from "lucide-react"

import { CompactGroupedList } from "@/components/data-display/CompactGroupedList"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { brandmastApi, type OneTwoOneSampling, type TourPlannerActionListItem } from "@/lib/api"
import { isAxiosError } from "axios"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  formatCasAddress,
  formatCasTime,
  getCasActionTitle,
  parseCasDatetime,
} from "../cas-action-utils"
import { formatPlDatePoland, nowInPoland, parseIso } from "@/lib/dates/date-utils"

import {
  buildZgloszeniaSamplingAddRequest,
  formatSamplingDateTime,
  getProductName,
  getRegionLabel,
  type SamplingView,
} from "./121-sampling-utils"
import { bmSegmentedTab, bmSegmentedTrack } from "../brandmaster-ui"
import { use121ResolvedTeam } from "./use-121-resolved-team"
import { use121SamplingList } from "./use-121-sampling-list"
import { use121SubmitSampling } from "./use-121-submit-sampling"

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
  view: SamplingView
  onChange: (view: SamplingView) => void
}) {
  return (
    <div
      className={bmSegmentedTrack}
      role="tablist"
      aria-label="Widok 121 Sampling"
    >
      <button
        type="button"
        role="tab"
        aria-selected={view === "list"}
        className={cn(bmSegmentedTab(view === "list"), "min-h-10 gap-1.5")}
        onClick={() => onChange("list")}
      >
        <ListIcon className="size-3.5 shrink-0" aria-hidden />
        <span className="truncate">Lista samplingow</span>
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={view === "submit"}
        className={cn(bmSegmentedTab(view === "submit"), "min-h-10 gap-1.5")}
        onClick={() => onChange("submit")}
      >
        <PlusCircleIcon className="size-3.5 shrink-0" aria-hidden />
        <span className="truncate">Dodaj sampling</span>
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

function SamplingListItem({
  item,
  productLabel,
  teamLabel,
}: {
  item: OneTwoOneSampling
  productLabel: string
  teamLabel: string | null
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
        {teamLabel ? (
          <Badge variant="secondary" className="max-w-[45%] shrink-0 truncate font-normal">
            {teamLabel}
          </Badge>
        ) : item.region_id != null ? (
          <Badge variant="secondary" className="shrink-0 font-normal tabular-nums">
            Region #{item.region_id}
          </Badge>
        ) : null}
      </div>
      <dl className="mt-2 grid gap-1 text-xs text-muted-foreground">
        <div className="flex flex-wrap gap-x-1.5">
          <dt className="shrink-0">Wpisanie:</dt>
          <dd className="tabular-nums text-foreground/90">{formatSamplingDateTime(item.data_wpisu)}</dd>
        </div>
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
                  Zakończone akcje od początku {monthLabel} do dzisiaj, wybierz jedną.
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

export default function OneTwoOneSamplingPage() {
  const [view, setView] = React.useState<SamplingView>("list")
  const [selectedActionKey, setSelectedActionKey] = React.useState<string | null>(null)
  const [selectedProductId, setSelectedProductId] = React.useState<number | null>(null)
  const [savedTeamId, setSavedTeamId] = React.useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const resolvedTeam = use121ResolvedTeam()
  const list = use121SamplingList(resolvedTeam)
  const submit = use121SubmitSampling(view === "submit", resolvedTeam.teamId)

  React.useEffect(() => {
    if (resolvedTeam.teamId != null) setSavedTeamId(resolvedTeam.teamId)
  }, [resolvedTeam.teamId])

  const regionLabel = React.useMemo(
    () =>
      resolvedTeam.teamName ??
      getRegionLabel(resolvedTeam.teamId, resolvedTeam.teams),
    [resolvedTeam.teamName, resolvedTeam.teamId, resolvedTeam.teams],
  )

  const samplingTeamLabel = React.useCallback(
    (regionId: number | null | undefined) => getRegionLabel(regionId, list.teams),
    [list.teams],
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

  const submitValidation = React.useMemo(() => {
    if (!selectedAction || savedTeamId == null || selectedProductId == null) {
      return { canSubmit: false, error: null as string | null }
    }
    const result = buildZgloszeniaSamplingAddRequest(
      selectedAction,
      savedTeamId,
      selectedProductId,
    )
    if (!result.ok) return { canSubmit: false, error: result.message }
    return { canSubmit: true, error: null }
  }, [selectedAction, savedTeamId, selectedProductId])

  const canSubmit =
    submitValidation.canSubmit &&
    !isSubmitting &&
    !resolvedTeam.isLoading &&
    !submit.isLoading

  async function handleSubmit() {
    if (!selectedAction || savedTeamId == null || selectedProductId == null) {
      toast.error("Wybierz akcję, produkt i upewnij się, że zespół jest dopasowany.")
      return
    }

    const result = buildZgloszeniaSamplingAddRequest(
      selectedAction,
      savedTeamId,
      selectedProductId,
    )
    if (!result.ok) {
      toast.error(result.message)
      return
    }

    setIsSubmitting(true)
    const toastId = toast.loading("Wysyłanie zgłoszenia…")
    try {
      const res = await brandmastApi.addZgloszeniaSampling(result.body)
      if (res.success === false) {
        toast.error(res.message ?? "Nie udało się zgłosić samplingu.", { id: toastId })
        return
      }

      toast.success(res.message ?? "Zgłoszenie samplingowe zapisane.", { id: toastId })
      setSelectedActionKey(null)
      setSelectedProductId(null)
      list.refetch()
    } catch (e) {
      toast.error(readApiError(e), { id: toastId })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex flex-1 flex-col bg-background pb-24">
      <div className="mx-auto w-full max-w-lg px-3 py-4 sm:max-w-xl sm:px-4 sm:py-5">
        <header className="min-w-0 pr-11">
          <p className="text-xs text-muted-foreground">121 · Sampling</p>
          <h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl">Sampling</h1>
          <p className="mt-1 text-xs text-muted-foreground">
           Lista samplingow oraz mozliwosc dodawania nowych
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
          <section aria-label="Lista samplingow" className="space-y-4">
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
                      Zgłoszone samplingi
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {list.samplings.length}{" "}
                      {list.samplings.length === 1
                        ? "wpis"
                        : list.samplings.length > 1 && list.samplings.length < 5
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
                  emptyMessage="Brak zgłoszonych samplingów w Twoim regionie."
                  getItemKey={(item, index) =>
                    String(item.id ?? item.nr_akcji_pelen ?? `sampling-${index}`)
                  }
                  renderItem={(item) => (
                    <SamplingListItem
                      item={item}
                      productLabel={listProductName(item.oferta_samp_prod_1)}
                      teamLabel={samplingTeamLabel(item.region_id)}
                    />
                  )}
                />
              </>
            )}
          </section>
        ) : (
          <section aria-label="Zgłoś sampling" className="space-y-4">
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
                  Produkt Rivo / Virto
                </CardTitle>
                <CardDescription className="text-xs">
                  Wybierz paczke do samplingu
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
                  <p className="py-4 text-center text-xs text-muted-foreground">Brak produktów.</p>
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

            {submitValidation.error ? (
              <p className="text-center text-xs text-destructive">{submitValidation.error}</p>
            ) : null}

            <Button
              className="w-full"
              disabled={!canSubmit}
              onClick={() => void handleSubmit()}
            >
              {isSubmitting ? "Wysyłanie…" : "Zatwierdź zgłoszenie"}
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
