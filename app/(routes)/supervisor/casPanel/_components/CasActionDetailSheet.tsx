"use client"

import * as React from "react"
import {
  ClockIcon,
  MapPinIcon,
  RefreshCwIcon,
  UserIcon,
} from "lucide-react"
import { toast } from "sonner"

import { fetchSampleStats } from "@/lib/api"
import type { SampleStatsFieldCounts } from "@/lib/api"
import type { TourPlannerActionListItem } from "@/lib/api/generated/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  CAS_ACTION_STATUSES,
  casStatusSupportsSampleStats,
  getCasStatusPresentationFromRaw,
  normalizeCasActionStatus,
  type CasActionStatus,
} from "@/lib/cas-status"
import { isCasActionStatus } from "../cas-panel-utils"
import { cn } from "@/lib/utils"

import {
  formatCasAddress,
  formatCasTime,
  getCasActionTitle,
} from "@/app/(routes)/brandmaster/cas-action-utils"
import { getBrandmasterDisplayName, getCasActionTimeLabel } from "../cas-panel-utils"
import { MobileBottomSheet } from "./MobileBottomSheet"
import { CasSampleStatsSkeleton, CasSampleStatsStrip } from "./CasSampleStatsStrip"

export type CasActionDetailSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  action: TourPlannerActionListItem | null
  onStatusChange: (ident: string, status: CasActionStatus) => Promise<{ synced: boolean }>
}

export function CasActionDetailSheet({
  open,
  onOpenChange,
  action,
  onStatusChange,
}: CasActionDetailSheetProps) {
  const [statusDraft, setStatusDraft] = React.useState<CasActionStatus | "">("")
  const [isSavingStatus, setIsSavingStatus] = React.useState(false)
  const [statsLoading, setStatsLoading] = React.useState(false)
  const [stats, setStats] = React.useState<SampleStatsFieldCounts | null>(null)
  const [statsError, setStatsError] = React.useState<string | null>(null)
  const statsRequestRef = React.useRef(0)

  const normalizedStatus = normalizeCasActionStatus(action?.status)
  const pres = getCasStatusPresentationFromRaw(action?.status)
  const showStats = casStatusSupportsSampleStats(normalizedStatus)

  React.useEffect(() => {
    if (!open || !action) return
    const next = normalizeCasActionStatus(action.status)
    setStatusDraft(isCasActionStatus(next) ? next : "")
  }, [open, action])

  React.useEffect(() => {
    if (!open || !action || !showStats) {
      setStats(null)
      setStatsError(null)
      setStatsLoading(false)
      return
    }

    const hostessCode = action.brandmaster?.ident?.trim() ?? ""
    const currentAction = action.ident?.trim() ?? ""
    if (!hostessCode || !currentAction) {
      setStats(null)
      setStatsError("Brak kodu hostessy lub identyfikatora akcji.")
      return
    }

    const requestId = ++statsRequestRef.current
    setStatsLoading(true)
    setStatsError(null)
    setStats(null)

    void fetchSampleStats({ hostessCode, currentAction })
      .then((result) => {
        if (statsRequestRef.current !== requestId) return
        setStats(result.counts.currentAction)
      })
      .catch((e) => {
        if (statsRequestRef.current !== requestId) return
        setStatsError(e instanceof Error ? e.message : "Nie udało się pobrać wyników.")
      })
      .finally(() => {
        if (statsRequestRef.current === requestId) setStatsLoading(false)
      })
  }, [open, action, showStats])

  if (!action) return null

  const title = getCasActionTitle(action)
  const bmName = getBrandmasterDisplayName(action)
  const ident = action.ident?.trim()
  const hostessCode = action.brandmaster?.ident?.trim()

  async function handleStatusSave() {
    if (!ident || !statusDraft || statusDraft === normalizedStatus) return
    setIsSavingStatus(true)
    const toastId = toast.loading("Zapisywanie statusu…")
    try {
      const { synced } = await onStatusChange(ident, statusDraft)
      if (synced) {
        toast.success("Status zaktualizowany.", { id: toastId })
      } else {
        toast.message("Status zapisany lokalnie — synchronizacja z API wkrótce.", {
          id: toastId,
        })
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Nie udało się zapisać statusu.", {
        id: toastId,
      })
    } finally {
      setIsSavingStatus(false)
    }
  }

  const statusChanged = Boolean(statusDraft && statusDraft !== normalizedStatus)

  return (
    <MobileBottomSheet
      open={open}
      onOpenChange={onOpenChange}
      titleId="cas-action-detail-title"
      title={title}
      description="Szczegóły akcji z Tour Plannera"
      dismissible={!isSavingStatus}
      footer={
        <div className="space-y-2">
          <Separator className="bg-border/70" />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            disabled={isSavingStatus}
            onClick={() => onOpenChange(false)}
          >
            Zamknij
          </Button>
        </div>
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge variant={pres.badgeVariant} className="px-2.5 py-0.5 text-xs font-semibold">
          {pres.labelPl}
        </Badge>
        {ident ? (
          <span className="rounded-md border border-border/60 bg-muted/30 px-2 py-0.5 font-mono text-[11px] tabular-nums">
            {ident}
          </span>
        ) : null}
      </div>

      <Card className="shadow-xs ring-1 ring-border/50">
        <CardContent className="space-y-2.5 p-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <UserIcon className="size-3.5 text-muted-foreground" aria-hidden />
            {bmName}
            {hostessCode ? (
              <span className="text-xs font-normal text-muted-foreground">({hostessCode})</span>
            ) : null}
          </div>
          <Separator className="bg-border/70" />
          <DetailRow label="Event" value={action.event?.name?.trim() || "—"} />
          <DetailRow label="Sklep" value={action.point?.name?.trim() || "—"} />
          <DetailRow label="Adres" value={formatCasAddress(action.point?.address)} />
          <DetailRow
            label="Start / stop (historia)"
            value={`${formatCasTime(action.history?.start)} · ${formatCasTime(action.history?.stop)}`}
          />
          {action.history?.totalTime ? (
            <DetailRow label="Czas łącznie" value={action.history.totalTime} />
          ) : null}
          {action.territory?.ident ? (
            <DetailRow label="Terytorium" value={action.territory.ident} />
          ) : null}
        </CardContent>
      </Card>

      <div className="space-y-2 rounded-xl border border-border/70 bg-muted/15 p-3">
        <Label htmlFor="cas-status-select" className="text-xs text-muted-foreground">
          Status akcji
        </Label>
        <select
          id="cas-status-select"
          value={statusDraft}
          disabled={isSavingStatus || !ident}
          onChange={(e) => setStatusDraft(e.target.value as CasActionStatus)}
          className={cn(
            "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          {CAS_ACTION_STATUSES.map((status) => {
            const optionPres = getCasStatusPresentationFromRaw(status)
            return (
              <option key={status} value={status}>
                {optionPres.labelPl}
              </option>
            )
          })}
        </select>
        <Button
          type="button"
          size="sm"
          className="w-full"
          disabled={!statusChanged || isSavingStatus || !ident}
          onClick={() => void handleStatusSave()}
        >
          {isSavingStatus ? "Zapisywanie…" : "Zapisz status"}
        </Button>
      </div>

      {showStats ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-muted-foreground">Wyniki bieżącej akcji</p>
            {statsLoading ? (
              <RefreshCwIcon className="size-3.5 animate-spin text-muted-foreground" aria-hidden />
            ) : null}
          </div>
          {statsLoading ? (
            <CasSampleStatsSkeleton />
          ) : statsError ? (
            <p className="rounded-lg border border-dashed border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              {statsError}
            </p>
          ) : stats ? (
            <CasSampleStatsStrip stats={stats} />
          ) : null}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Statystyki próbek są dostępne dla akcji ze statusem „Rozpoczeta” lub „zakończona”.
        </p>
      )}
    </MobileBottomSheet>
  )
}

function DetailRow({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-0.5 text-xs sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="inline-flex min-w-0 items-center gap-1 font-medium text-foreground sm:text-end">
        {icon}
        <span className="min-w-0 wrap-break-word">{value}</span>
      </span>
    </div>
  )
}
