"use client"

import * as React from "react"
import {
  ChevronDownIcon,
  GaugeIcon,
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

import {
  formatEfficiencyPl,
  type BonusLineItem,
  type BrandmasterBonusBreakdown,
  type QualitativeBonusBreakdown,
  type RegularBonusBreakdown,
} from "./brandmaster-bonus-utils"
import { formatHoursPl, formatMoneyPl } from "./cas-action-utils"
import type { SampleStatsGloCounts } from "@/lib/api"

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

function RegularBonusSection({ regular }: { regular: RegularBonusBreakdown }) {
  return (
    <BonusSection
      title="Bonus zwykły"
      icon={WalletIcon}
      tierLabel={regular.tierLabel}
      total={regular.total}
    >
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
}: {
  qualitative: QualitativeBonusBreakdown
}) {
  return (
    <BonusSection
      title="Bonus jakościowy"
      icon={SparklesIcon}
      tierLabel={qualitative.tierLabel}
      total={qualitative.total}
    >
      <BonusLineRows items={qualitative.items} />
    </BonusSection>
  )
}

export function GloSamplesCard({
  glo,
  monthLabel,
  veloNet,
}: {
  glo: SampleStatsGloCounts
  monthLabel: string
  veloNet?: number
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
  const timeDivisorLabel =
    e.timeDivisor > 0
      ? e.timeDivisor.toLocaleString("pl-PL", { maximumFractionDigits: 2 })
      : "—"

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
              {e.veloCount} ÷ {timeDivisorLabel}
            </p>
          </div>
          <div className="rounded-lg border border-border/80 bg-muted/30 px-2.5 py-2.5">
            <p className="text-[11px] font-medium text-muted-foreground">Glo</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums leading-none">
              {formatEfficiencyPl(e.gloEfficiency)}
            </p>
            <p className="mt-1 text-[10px] leading-snug text-muted-foreground">
              {e.gloCount} ÷ {timeDivisorLabel}
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
  bonusBreakdown,
  predictedPayout,
  hourlyRate,
  totalRoundedHours,
  monthLabel,
  expanded,
  onToggle,
}: {
  basePayout: number
  bonusBreakdown: BrandmasterBonusBreakdown | null
  predictedPayout: number
  hourlyRate: number
  totalRoundedHours: number
  monthLabel: string
  expanded: boolean
  onToggle: () => void
}) {
  const bonusTotal = bonusBreakdown?.totalBonus ?? 0

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
            {formatMoneyPl(basePayout + (bonusBreakdown?.qualitative.total ?? 0) )}
          </p>
          <p className="mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
            <span>
              Podstawa: {formatMoneyPl(basePayout)} ({formatHoursPl(totalRoundedHours)})
            </span>
            {bonusBreakdown ? (
              <span className="font-medium text-foreground/90">
                Bonus: {formatMoneyPl(bonusBreakdown.qualitative.total)}
              </span>
            ) : null}
          </p>
        </CardContent>
      </button>

      {expanded ? (
        <CardContent className="space-y-2.5 border-t border-border/80 px-3.5 pb-3.5 pt-2 sm:px-4 sm:pb-4">
          <div className="flex items-center justify-between gap-2 rounded-lg border border-border/80 bg-muted/25 px-3 py-2 text-xs">
            <span className="text-muted-foreground">
              Stawka godzinowa ({hourlyRate} zł × {formatHoursPl(totalRoundedHours)})
            </span>
            <span className="font-semibold tabular-nums">{formatMoneyPl(basePayout)}</span>
          </div>

          {bonusBreakdown ? (
            <>
              <RegularBonusSection regular={bonusBreakdown.regular} />
              <QualitativeBonusSection qualitative={bonusBreakdown.qualitative} />
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              Brak statystyk próbek — bonus nie został policzony (wymagany login z konfiguracji
              oraz ident ostatniej akcji).
            </p>
          )}
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
