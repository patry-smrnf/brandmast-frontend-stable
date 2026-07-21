"use client"

import * as React from "react"
import {
  ChevronDownIcon,
  GaugeIcon,
  LayersIcon,
  PackageIcon,
  SparklesIcon,
  WalletIcon,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { brandmastApi, type OneTwoOneMagazynItem, type SampleStatsGloCounts } from "@/lib/api"

import {
  formatEfficiencyPl,
  type BonusLineItem,
  type BrandmasterBonusBreakdown,
  type QualitativeBonusBreakdown,
  type QualitativeVeloProgress,
  type RegularBonusBreakdown,
  type TierProgressHint,
} from "./brandmaster-bonus-utils"
import type { MojstanDisplayItem } from "./brandmaster-mojstan-utils"
import { formatHoursPl, formatMoneyPl, HOURLY_TOUR_BONUS_LABEL } from "./cas-action-utils"
import { BonusExtrasSection } from "./brandmaster-bonus-extras-section"
import { useBrandmasterBonusExtras } from "./use-brandmaster-bonus-extras"

const CURRENT_MONTH_GLO_METRICS = [
  { key: "hilo" as const, label: "Hilo" },
  { key: "hiloPlus" as const, label: "Hilo+" },
  { key: "hyperPro" as const, label: "Hyper Pro" },
] as const

function BonusLineRows({ items }: { items: BonusLineItem[] }) {
  if (items.length === 0) {
    return <p className="text-xs text-muted-foreground">Brak pozycji w tej kategorii.</p>
  }
  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li
          key={`${item.label}-${item.ratePerUnit}`}
          className="flex items-start justify-between gap-2 text-xs"
        >
          <span className="min-w-0 text-muted-foreground">
            {item.label}
            <span className="tabular-nums text-foreground/80">
              {" "}
              · {item.quantity} × {item.ratePerUnit} zł
            </span>
          </span>
          <span className="shrink-0 font-medium tabular-nums">{formatMoneyPl(item.amount)}</span>
        </li>
      ))}
    </ul>
  )
}

function TierProgressBar({
  label,
  currentValue,
  progressPercent,
  gapLabel,
}: {
  label: string
  currentValue: string
  progressPercent: number | null
  gapLabel: string | null
}) {
  const percent = progressPercent ?? 0
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="shrink-0 font-medium tabular-nums text-foreground">{currentValue}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      {gapLabel ? (
        <p className="text-[10px] leading-snug text-muted-foreground">{gapLabel}</p>
      ) : null}
    </div>
  )
}

function RegularTierProgress({
  progress,
  gloEfficiency,
  veloEfficiency,
}: {
  progress: TierProgressHint
  gloEfficiency: number
  veloEfficiency: number
}) {
  return (
    <div className="space-y-2.5 rounded-md border border-border/70 bg-background/60 px-2.5 py-2">
      <p className="text-[11px] font-medium text-foreground">
        Lapiesz sie na: <span className="text-muted-foreground">{progress.currentLabel}</span>
      </p>

      {progress.nextGloThreshold != null && progress.gloEfficiencyGap != null ? (
        <TierProgressBar
          label="Efektywność Glo"
          currentValue={formatEfficiencyPl(gloEfficiency)}
          progressPercent={progress.gloProgressPercent}
          gapLabel={`Brakuje ${formatEfficiencyPl(progress.gloEfficiencyGap)} do Glo ≥ ${formatEfficiencyPl(progress.nextGloThreshold)}`}
        />
      ) : (
        <p className="text-[10px] text-muted-foreground">
          Najwyższy stopień Glo w bieżącym paśmie Velo.
        </p>
      )}

      {progress.nextVeloThreshold != null && progress.veloEfficiencyGap != null ? (
        <TierProgressBar
          label="Efektywność Velo"
          currentValue={formatEfficiencyPl(veloEfficiency)}
          progressPercent={progress.veloProgressPercent}
          gapLabel={`Brakuje ${formatEfficiencyPl(progress.veloEfficiencyGap)} do ${progress.nextVeloBandLabel ?? `Velo ≥ ${formatEfficiencyPl(progress.nextVeloThreshold)}`}`}
        />
      ) : null}
    </div>
  )
}

function QualitativeVeloProgressHint({
  progress,
  veloEfficiency,
}: {
  progress: QualitativeVeloProgress
  veloEfficiency: number
}) {
  if (progress.reached) {
    return (
      <p className="text-[11px] leading-snug text-emerald-700 dark:text-emerald-400">
        Efektywność Velo ≥ {formatEfficiencyPl(progress.target)}
        jest do jakosciowy.
      </p>
    )
  }

  return (
    <div className="space-y-1.5 rounded-md border border-border/70 bg-background/60 px-2.5 py-2">
      <TierProgressBar
        label="Efektywność Velo"
        currentValue={formatEfficiencyPl(veloEfficiency)}
        progressPercent={progress.progressPercent}
        gapLabel={`Brakuje ${formatEfficiencyPl(progress.gap)} do Velo ≥ ${formatEfficiencyPl(progress.target)}`}
      />
    </div>
  )
}

function BonusSection({
  title,
  icon: Icon,
  tierLabel,
  total,
  children,
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  tierLabel: string
  total: number
  children: React.ReactNode
}) {
  return (
    <section className="space-y-2 rounded-lg border border-border/80 bg-muted/25 px-3 py-2.5">
      <BonusSectionHeader title={title} icon={Icon} tierLabel={tierLabel} total={total} />
      {children}
    </section>
  )
}

function BonusSectionHeader({
  title,
  icon: Icon,
  tierLabel,
  total,
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  tierLabel: string
  total: number
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0 space-y-0.5">
        <p className="flex items-center gap-1.5 text-xs font-semibold">
          <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
          {title}
        </p>
        <p className="text-[11px] leading-snug text-muted-foreground">{tierLabel}</p>
      </div>
      <p className="shrink-0 text-sm font-semibold tabular-nums">{formatMoneyPl(total)}</p>
    </div>
  )
}

function RegularBonusSection({
  regular,
  gloEfficiency,
  veloEfficiency,
}: {
  regular: RegularBonusBreakdown
  gloEfficiency: number
  veloEfficiency: number
}) {
  return (
    <BonusSection
      title="Bonus zwykły"
      icon={WalletIcon}
      tierLabel={regular.tierLabel}
      total={regular.total}
    >
      <RegularTierProgress
        progress={regular.tierProgress}
        gloEfficiency={gloEfficiency}
        veloEfficiency={veloEfficiency}
      />
      <BonusLineRows items={regular.items} />
      {regular.gloRatePerDevice === 0 && regular.veloRatePerUnit === 0 ? (
        <p className="text-[11px] leading-snug text-muted-foreground">
          Przy efektywności Velo poniżej 5,0 bonus za Glo wynosi 0 zł.
        </p>
      ) : null}
    </BonusSection>
  )
}

function QualitativeBonusSection({
  qualitative,
  veloEfficiency,
}: {
  qualitative: QualitativeBonusBreakdown
  veloEfficiency: number
}) {
  return (
    <BonusSection
      title="Bonus jakościowy"
      icon={SparklesIcon}
      tierLabel={qualitative.tierLabel}
      total={qualitative.total}
    >
      <QualitativeVeloProgressHint
        progress={qualitative.veloProgress}
        veloEfficiency={veloEfficiency}
      />
      <BonusLineRows items={qualitative.items} />
    </BonusSection>
  )
}

const MAGAZYN_LIST_SCROLL_CLASS =
  "max-h-52 overflow-y-auto overscroll-y-contain rounded-lg border border-border/80"

function MagazynWysylkiSkeleton() {
  return (
    <div className={cn(MAGAZYN_LIST_SCROLL_CLASS, "bg-background/60")}>
      <ul className="divide-y divide-border/50">
        {Array.from({ length: 5 }).map((_, i) => (
          <li key={i} className="flex items-center justify-between gap-3 px-2.5 py-2.5">
            <div className="h-3 max-w-[65%] flex-1 animate-pulse rounded bg-muted" />
            <div className="h-3.5 w-9 shrink-0 animate-pulse rounded bg-muted" />
          </li>
        ))}
      </ul>
    </div>
  )
}

function MagazynWysylkiSection({ hasOneTwoOne }: { hasOneTwoOne: boolean }) {
  const [expanded, setExpanded] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [items, setItems] = React.useState<OneTwoOneMagazynItem[]>([])
  const [error, setError] = React.useState<string | null>(null)
  const [fetched, setFetched] = React.useState(false)
  const requestRef = React.useRef(0)

  const fetchMagazyn = React.useCallback(() => {
    const requestId = ++requestRef.current
    setLoading(true)
    setError(null)

    void (async () => {
      try {
        const res = await brandmastApi.fetchMagazyn()
        if (requestRef.current !== requestId) return

        if (res.success === false) {
          setError(res.message ?? "Nie udało się pobrać magazynu wysyłki.")
          setItems([])
        } else {
          setItems(res.data ?? [])
        }
        setFetched(true)
      } catch (e) {
        if (requestRef.current !== requestId) return
        setError(e instanceof Error ? e.message : "Nie udało się pobrać magazynu wysyłki.")
        setItems([])
        setFetched(true)
      } finally {
        if (requestRef.current === requestId) {
          setLoading(false)
        }
      }
    })()
  }, [])

  const handleToggle = React.useCallback(() => {
    const nextExpanded = !expanded
    setExpanded(nextExpanded)

    if (!nextExpanded || !hasOneTwoOne || loading) return
    if (fetched && !error) return

    fetchMagazyn()
  }, [expanded, hasOneTwoOne, loading, fetched, error, fetchMagazyn])

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border/80 bg-muted/20 transition-colors",
        expanded && "border-border bg-muted/30",
      )}
    >
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 px-2.5 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        onClick={handleToggle}
        aria-expanded={expanded}
      >
        <span className="text-[11px] font-medium text-foreground">Magazyn wysyłki</span>
        <ChevronDownIcon
          className={cn(
            "size-3.5 shrink-0 text-muted-foreground transition-transform",
            expanded && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out",
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="border-t border-border/60 px-2.5 py-2">
            {!hasOneTwoOne ? (
              <p className="text-xs leading-snug text-muted-foreground">
                Skonfiguruj 121 w ustawieniach, żeby wyświetlić magazyn wysyłki
              </p>
            ) : loading ? (
              <MagazynWysylkiSkeleton />
            ) : error ? (
              <p className="text-xs leading-snug text-destructive">{error}</p>
            ) : items.length === 0 ? (
              <p className="text-xs leading-snug text-muted-foreground">
                Brak produktów w magazynie wysyłki.
              </p>
            ) : (
              <div
                className={cn(MAGAZYN_LIST_SCROLL_CLASS, "bg-background/60")}
                role="region"
                aria-label="Lista produktów magazynu wysyłki"
              >
                <ul className="divide-y divide-border/50">
                  {items.map((item) => {
                    const isActive = item.active == null || item.active === 1
                    return (
                      <li
                        key={item.idProduktu ?? item.nazwa}
                        className={cn(
                          "flex items-baseline justify-between gap-3 px-2.5 py-2 text-xs",
                          !isActive && "opacity-60",
                        )}
                      >
                        <span className="min-w-0 truncate font-medium text-muted-foreground">
                          {item.nazwa?.trim() || "Produkt"}
                        </span>
                        <span className="shrink-0 font-semibold tabular-nums text-foreground">
                          {item.ilosc ?? 0}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function StanyCard({
  hasOneTwoOne,
  items,
  loading,
}: {
  hasOneTwoOne: boolean
  items: MojstanDisplayItem[]
  loading?: boolean
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="space-y-0.5 px-3.5 py-3 pb-2 sm:px-4">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <LayersIcon className="size-3.5 text-muted-foreground" aria-hidden />
          Stany
        </CardTitle>
        <CardDescription className="text-xs">Twój stan (121)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2.5 px-3.5 pb-3.5 sm:px-4 sm:pb-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-10 animate-pulse rounded-lg border border-border/60 bg-muted/40"
              />
            ))}
          </div>
        ) : !hasOneTwoOne ? (
          <p className="rounded-lg border border-dashed border-border/80 bg-muted/20 px-3 py-4 text-center text-xs leading-snug text-muted-foreground">
            Skonfiguruj 121 w ustawieniach, żeby wyświetlić stan
          </p>
        ) : items.length === 0 ? (
          <p className="text-xs leading-snug text-muted-foreground">
            Brak danych stanu magazynowego.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-2">
            {items.map((item) => (
              <li
                key={item.label}
                className="flex items-baseline justify-between gap-2 rounded-lg border border-border/80 bg-muted/30 px-2.5 py-2 text-xs"
              >
                <span className="min-w-0 truncate font-medium text-muted-foreground">
                  {item.label}
                </span>
                <span className="shrink-0 text-base font-semibold tabular-nums leading-none text-foreground">
                  {item.quantity}
                </span>
              </li>
            ))}
          </ul>
        )}
        <MagazynWysylkiSection hasOneTwoOne={hasOneTwoOne} />
      </CardContent>
    </Card>
  )
}

export function GloSamplesCard({
  glo,
  monthLabel,
  veloNet,
  awaryjne,
  hasOneTwoOne,
  oneTwoOneLoading,
}: {
  glo: SampleStatsGloCounts
  monthLabel: string
  veloNet?: number
  awaryjne?: { glo: number; velo: number }
  hasOneTwoOne: boolean
  oneTwoOneLoading?: boolean
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="space-y-0.5 px-3.5 py-3 pb-2 sm:px-4">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <PackageIcon className="size-3.5 text-muted-foreground" aria-hidden />
          Wyniki
        </CardTitle>
        <CardDescription className="text-xs" suppressHydrationWarning>
          Bieżący miesiąc · {monthLabel}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2.5 px-3.5 pb-3.5 sm:px-4 sm:pb-4">
        <div className="grid grid-cols-3 gap-2">
          {CURRENT_MONTH_GLO_METRICS.map(({ key, label }) => (
            <div
              key={key}
              className="rounded-lg border border-border/80 bg-muted/30 px-2 py-2.5 text-center"
            >
              <p className="text-[11px] font-medium leading-tight text-muted-foreground">
                {label}
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums leading-none sm:text-2xl">
                {glo[key]}
              </p>
            </div>
          ))}
        </div>
        {veloNet != null ? (
          <p className="text-center text-xs text-muted-foreground">
            Velo:{" "}
            <span className="font-semibold tabular-nums text-foreground">{veloNet}</span>
          </p>
        ) : null}
        <div className="rounded-lg border border-border/80 bg-muted/25 px-2.5 py-2">
          <p className="text-[11px] font-medium text-muted-foreground">Awaryjne/Tickety</p>
          {oneTwoOneLoading ? (
            <div className="mt-1 flex items-center gap-3">
              <div className="h-3.5 w-12 animate-pulse rounded bg-muted" />
              <div className="h-3.5 w-14 animate-pulse rounded bg-muted" />
            </div>
          ) : !hasOneTwoOne ? (
            <p className="mt-1 text-xs leading-snug text-muted-foreground">
              Skonfiguruj 121 w ustawieniach, żeby wyświetlić awaryjne i tickety
            </p>
          ) : (
            <div className="mt-1 flex items-center gap-3 text-xs">
              <span className="text-muted-foreground">
                GLO{" "}
                <span className="font-semibold tabular-nums text-foreground">
                  {awaryjne?.glo ?? 0}
                </span>
              </span>
              <span className="text-muted-foreground">
                VELO{" "}
                <span className="font-semibold tabular-nums text-foreground">
                  {awaryjne?.velo ?? 0}
                </span>
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function EfficiencyCard({
  bonus,
  monthLabel,
}: {
  bonus: BrandmasterBonusBreakdown
  monthLabel: string
}) {
  const { efficiency: e } = bonus
  const formatTimeDivisor = (value: number) =>
    value > 0 ? value.toLocaleString("pl-PL", { maximumFractionDigits: 2 }) : "-"
  const veloTimeDivisorLabel = formatTimeDivisor(e.veloTimeDivisor)
  const gloTimeDivisorLabel = formatTimeDivisor(e.gloTimeDivisor)

  return (
    <Card className="shadow-sm">
      <CardHeader className="space-y-0.5 px-3.5 py-3 pb-2 sm:px-4">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <GaugeIcon className="size-3.5 text-muted-foreground" aria-hidden />
          Efektywność
        </CardTitle>
        <CardDescription className="text-xs" suppressHydrationWarning>
          {monthLabel} · efektywność 
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2.5 px-3.5 pb-3.5 sm:px-4 sm:pb-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-border/80 bg-muted/30 px-2.5 py-2.5">
            <p className="text-[11px] font-medium text-muted-foreground">Velo</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums leading-none">
              {formatEfficiencyPl(e.veloEfficiency)}
            </p>
            <p className="mt-1 text-[10px] leading-snug text-muted-foreground">
              {e.veloCount} ÷ {veloTimeDivisorLabel}
            </p>
          </div>
          <div className="rounded-lg border border-border/80 bg-muted/30 px-2.5 py-2.5">
            <p className="text-[11px] font-medium text-muted-foreground">Glo</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums leading-none">
              {formatEfficiencyPl(e.gloEfficiency)}
            </p>
            <p className="mt-1 text-[10px] leading-snug text-muted-foreground">
              {e.gloCount} ÷ {gloTimeDivisorLabel}
            </p>
          </div>
        </div>
        <p className="text-[11px] leading-snug text-muted-foreground">
          Schematyka liczenia efektywności: Sprzedaz / (czas / 4)
        </p>
      </CardContent>
    </Card>
  )
}

export function PayoutCard({
  basePayout,
  hourlyTourPayout,
  totalRemainderMinutes,
  bonusBreakdown,
  hourlyRate,
  totalDurationHours,
  totalBaseHours,
  monthLabel,
  includeExtras = true,
  expanded,
  onToggle,
}: {
  basePayout: number
  hourlyTourPayout: number
  totalRemainderMinutes: number
  bonusBreakdown: BrandmasterBonusBreakdown | null
  hourlyRate: number
  totalDurationHours: number
  totalBaseHours: number
  monthLabel: string
  includeExtras?: boolean
  expanded: boolean
  onToggle: () => void
}) {
  const bonusExtras = useBrandmasterBonusExtras(includeExtras)
  const qualitativeBonus = bonusBreakdown?.qualitative.total ?? 0
  const extrasAmount = includeExtras ? bonusExtras.extrasTotal : 0
  const displayedPayout =
    basePayout + hourlyTourPayout + qualitativeBonus + extrasAmount

  return (
    <Card className="overflow-hidden shadow-sm">
      <button
        type="button"
        className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <CardHeader className="space-y-0.5 px-3.5 py-3 pb-2 sm:px-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <WalletIcon className="size-3.5 text-muted-foreground" aria-hidden />
                Przewidywalna wypłata
              </CardTitle>
              <CardDescription className="text-xs" suppressHydrationWarning>
                Stawka {hourlyRate} zł + bonus · {monthLabel}
              </CardDescription>
            </div>
            <ChevronDownIcon
              className={cn(
                "mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform",
                expanded && "rotate-180",
              )}
              aria-hidden
            />
          </div>
        </CardHeader>
        <CardContent className="px-3.5 pb-3 pt-0 sm:px-4">
          <p className="text-2xl font-semibold tabular-nums leading-none sm:text-3xl">
            {formatMoneyPl(displayedPayout)}
          </p>
          <p className="mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
            <span>
              Podstawa: {formatMoneyPl(basePayout)} ({formatHoursPl(totalBaseHours)})
            </span>
            {hourlyTourPayout > 0 ? (
              <span className="font-medium text-foreground/90">
                {HOURLY_TOUR_BONUS_LABEL}: {formatMoneyPl(hourlyTourPayout)}
              </span>
            ) : null}
            {bonusBreakdown ? (
              <span className="font-medium text-foreground/90">
                Bonus: {formatMoneyPl(qualitativeBonus)}
              </span>
            ) : null}
            {includeExtras && !bonusExtras.loading && extrasAmount !== 0 ? (
              <span className="font-medium text-foreground/90">
                Dodatki: {formatMoneyPl(extrasAmount)}
              </span>
            ) : null}
          </p>
        </CardContent>
      </button>

      {expanded ? (
        <CardContent className="space-y-2.5 border-t border-border/80 px-3.5 pb-3.5 pt-2 sm:px-4 sm:pb-4">
          <div className="flex items-center justify-between gap-2 rounded-lg border border-border/80 bg-muted/25 px-3 py-2 text-xs">
            <span className="text-muted-foreground">
              Stawka godzinowa ({hourlyRate} zł × {formatHoursPl(totalBaseHours)}
              {totalDurationHours !== totalBaseHours
                ? ` z ${formatHoursPl(totalDurationHours)}`
                : ""}
              )
            </span>
            <span className="font-semibold tabular-nums">{formatMoneyPl(basePayout)}</span>
          </div>

          {hourlyTourPayout > 0 ? (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-border/80 bg-muted/25 px-3 py-2 text-xs">
              <span className="text-muted-foreground">
                {HOURLY_TOUR_BONUS_LABEL} ({totalRemainderMinutes} min × {hourlyRate} zł/h)
              </span>
              <span className="font-semibold tabular-nums">
                {formatMoneyPl(hourlyTourPayout)}
              </span>
            </div>
          ) : null}

          {bonusBreakdown ? (
            <>
              <RegularBonusSection
                regular={bonusBreakdown.regular}
                gloEfficiency={bonusBreakdown.efficiency.gloEfficiency}
                veloEfficiency={bonusBreakdown.efficiency.veloEfficiency}
              />
              <QualitativeBonusSection
                qualitative={bonusBreakdown.qualitative}
                veloEfficiency={bonusBreakdown.efficiency.veloEfficiency}
              />
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              Brak statystyk bonus nie został policzony (wymagany login z konfiguracji
              oraz ident ostatniej akcji).
            </p>
          )}

          {includeExtras ? <BonusExtrasSection extras={bonusExtras} /> : null}
        </CardContent>
      ) : (
        <CardContent className="border-t border-border/80 px-3.5 pb-3 pt-0 sm:px-4">
          <p className="py-2 text-xs text-muted-foreground">
            Kliknij, aby rozwinąć rozpiskę bonusu (zwykły i jakościowy).
          </p>
        </CardContent>
      )}
    </Card>
  )
}
