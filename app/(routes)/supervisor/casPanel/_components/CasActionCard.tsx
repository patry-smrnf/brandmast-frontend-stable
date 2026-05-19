"use client"

import { ArrowRightIcon, ClockIcon, MapPinIcon, UserIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { getCasStatusPresentationFromRaw } from "@/lib/cas-status"
import type { TourPlannerActionListItem } from "@/lib/api/generated/types"
import { cn } from "@/lib/utils"

import {
  formatCasAddress,
  getCasActionTitle,
} from "@/app/(routes)/brandmaster/cas-action-utils"
import {
  getBrandmasterDisplayName,
  getCasActionTimeLabel,
} from "../cas-panel-utils"

export type CasActionCardProps = {
  action: TourPlannerActionListItem
  onClick: () => void
}

export function CasActionCard({ action, onClick }: CasActionCardProps) {
  const pres = getCasStatusPresentationFromRaw(action.status)
  const title = getCasActionTitle(action)
  const bmName = getBrandmasterDisplayName(action)
  const shopName = action.point?.name?.trim() || "—"
  const address = formatCasAddress(action.point?.address)
  const timeLabel = getCasActionTimeLabel(action)
  const ident = action.ident?.trim()

  return (
    <article
      className="relative overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm transition-[box-shadow,transform] active:scale-[0.995]"
    >
      <div className={cn("absolute inset-y-0 left-0 w-1", pres.accentClass)} aria-hidden />
      <button
        type="button"
        onClick={onClick}
        className="w-full px-3 py-3 pl-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-1">
            <p className="truncate text-sm font-semibold leading-tight text-foreground">{title}</p>
            <p className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
              <UserIcon className="size-3 shrink-0" aria-hidden />
              <span className="font-medium text-foreground/90">{bmName}</span>
              <ArrowRightIcon className="size-3 shrink-0 opacity-60" aria-hidden />
              <span className="truncate">{shopName}</span>
            </p>
          </div>
          <Badge
            variant={pres.badgeVariant}
            className="shrink-0 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide sm:text-[11px]"
          >
            {pres.labelPl}
          </Badge>
        </div>

        <div className="mt-2 space-y-1 text-[11px] text-muted-foreground sm:text-xs">
          {ident ? (
            <p className="font-mono text-[10px] tabular-nums text-foreground/75 sm:text-[11px]">
              {ident}
            </p>
          ) : null}
          <p className="inline-flex items-center gap-1 tabular-nums">
            <ClockIcon className="size-3 shrink-0" aria-hidden />
            {timeLabel}
          </p>
          <p className="flex items-start gap-1.5">
            <MapPinIcon className="mt-0.5 size-3 shrink-0" aria-hidden />
            <span className="line-clamp-2">{address}</span>
          </p>
        </div>
      </button>
    </article>
  )
}