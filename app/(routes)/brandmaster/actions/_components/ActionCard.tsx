"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { CalendarDaysIcon, ClockIcon, MapPinIcon, PencilIcon, XCircleIcon } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { formatTime, parseIso } from "../date-utils"
import type { ActionStatus, BrandmasterAction } from "../types"

function toEditorMonthParam(d: Date) {
  const yy = String(d.getFullYear() % 100).padStart(2, "0")
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  return `${yy}-${mm}`
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

export type ActionCardProps = {
  action: BrandmasterAction
  initials: string
  brandmasterName: string
  brandmasterSurname: string
}

export function ActionCard({ action, initials, brandmasterName, brandmasterSurname }: ActionCardProps) {
  const router = useRouter()
  const sinceDate = parseIso(action.since) ?? new Date()
  const untilDate = parseIso(action.until) ?? sinceDate
  const timeLabel = `${formatTime(sinceDate)}–${formatTime(untilDate)}`
  const showCancel = action.status === "ACCEPTED"
  const showEdit = action.status !== "ACCEPTED"
  const monthParam = toEditorMonthParam(sinceDate)

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-[96px_1fr] md:gap-4">
      <div className="md:pt-3">
        <div className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold tabular-nums shadow-sm">
          <ClockIcon className="size-4 text-muted-foreground" />
          {timeLabel}
        </div>
      </div>

      <Card className="group relative overflow-hidden border-border/70 shadow-sm transition-shadow hover:shadow-md">
        <div className="absolute left-0 top-0 h-full w-1 bg-primary/30 transition-colors group-hover:bg-primary/50" />
        <CardHeader className="space-y-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="truncate">{action.event.name}</CardTitle>
              <CardDescription className="truncate">{action.shop.name}</CardDescription>
            </div>
            <div className="shrink-0">
              <Badge variant={statusBadgeVariant(action.status)}>{statusLabel(action.status)}</Badge>
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
              <span className="inline-flex items-center gap-2">
                <CalendarDaysIcon className="size-3.5" />
                Utworzono:
                <span className="tabular-nums text-foreground/90">
                  {action.createdAt.slice(0, 19).replace("T", " ")}
                </span>
              </span>
            </div>

            <div className="shrink-0">
              <div className="flex items-center gap-2">
                <Avatar className="size-8">
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="hidden sm:block">
                  <div className="text-sm font-medium leading-none">
                    {brandmasterName} {brandmasterSurname}
                  </div>
                  <div className="text-xs text-muted-foreground">Brandmaster</div>
                </div>
              </div>
            </div>
          </div>

          {showEdit || showCancel ? (
            <div className="flex flex-wrap justify-end gap-2 pt-1">
              {showEdit ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    router.push(`/brandmaster/editor?idAction=${action.idAction}&month=${monthParam}`)
                  }
                >
                  <PencilIcon className="size-4" />
                  Edytuj
                </Button>
              ) : null}
              {showCancel ? (
                <Button variant="destructive" size="sm">
                  <XCircleIcon className="size-4" />
                  Odwołaj
                </Button>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

