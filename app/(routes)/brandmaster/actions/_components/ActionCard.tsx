"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangleIcon,
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  PencilIcon,
  Trash2Icon,
  XCircleIcon,
} from "lucide-react"
import { AlertDialog } from "radix-ui"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { getActionStatusPresentation } from "@/lib/action-status"

import { formatTime, parseIso } from "@/lib/dates/date-utils"
import type { BrandmasterAction } from "../types"

function toEditorMonthParam(d: Date) {
  const yy = String(d.getFullYear() % 100).padStart(2, "0")
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  return `${yy}-${mm}`
}

export type ActionCardProps = {
  action: BrandmasterAction
  initials: string
  brandmasterName: string
  brandmasterSurname: string
  editDisabled?: boolean
  deleteDisabled?: boolean
  onDelete?: () => void | Promise<void>
  onCancel?: () => void | Promise<void>
}

export function ActionCard({
  action,
  initials,
  brandmasterName,
  brandmasterSurname,
  editDisabled = false,
  deleteDisabled = false,
  onDelete,
  onCancel,
}: ActionCardProps) {
  const router = useRouter()
  const [deletePending, setDeletePending] = React.useState(false)
  const [cancelPending, setCancelPending] = React.useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = React.useState(false)
  const sinceDate = parseIso(action.since) ?? new Date()
  const untilDate = parseIso(action.until) ?? sinceDate
  const timeLabel = `${formatTime(sinceDate)}–${formatTime(untilDate)}`
  const pres = getActionStatusPresentation(action.status)
  const showCancel = pres.brandmasterShowCancel
  const showEdit = pres.brandmasterShowEdit
  const showDelete = pres.brandmasterShowDelete
  const deleteButtonDisabled = deletePending || deleteDisabled || !onDelete
  const cancelButtonDisabled = cancelPending || !onCancel
  const monthParam = toEditorMonthParam(sinceDate)

  async function handleDelete() {
    if (deleteButtonDisabled) return
    setDeletePending(true)
    try {
      await onDelete()
    } finally {
      setDeletePending(false)
    }
  }

  function openCancelDialog() {
    if (cancelButtonDisabled) return
    setCancelDialogOpen(true)
  }

  async function confirmCancelAction() {
    if (!onCancel || cancelPending) return
    setCancelPending(true)
    try {
      await onCancel()
      setCancelDialogOpen(false)
    } finally {
      setCancelPending(false)
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[96px_1fr] md:gap-4">
        <div className="md:pt-3">
          <div className="inline-flex items-center gap-1.5 rounded-2xl bg-card px-3 py-2 text-sm font-semibold tabular-nums shadow-sm ring-1 ring-border/50">
            <ClockIcon className="size-4 text-primary" />
            {timeLabel}
          </div>
        </div>

        <Card className="group relative overflow-hidden rounded-2xl border-0 bg-card shadow-md ring-1 ring-border/60 transition-shadow hover:shadow-lg">
          <div className="absolute left-0 top-0 h-full w-1.5 bg-primary/40 transition-colors group-hover:bg-primary/60" />
          <CardHeader className="space-y-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <CardTitle className="truncate">{action.event.name}</CardTitle>
                <CardDescription className="truncate">{action.shop.name}</CardDescription>
              </div>
              <div className="shrink-0">
                <Badge variant={pres.badgeVariant}>{pres.labelPl}</Badge>
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

            {(showEdit || showCancel || showDelete) ? (
              <div className="flex flex-wrap justify-end gap-2 pt-1">
                {showEdit ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={editDisabled}
                    onClick={() =>
                      router.push(`/brandmaster/editor?idAction=${action.idAction}&month=${monthParam}`)
                    }
                  >
                    <PencilIcon className="size-4" />
                    Edytuj
                  </Button>
                ) : null}
                {showDelete ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={deleteButtonDisabled}
                    onClick={() => void handleDelete()}
                  >
                    <Trash2Icon className="size-4" />
                    Usuń
                  </Button>
                ) : null}
                {showCancel ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={cancelButtonDisabled}
                    onClick={openCancelDialog}
                  >
                    <XCircleIcon className="size-4" />
                    Odwołaj
                  </Button>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <AlertDialog.Root open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay
            className={cn(
              "fixed inset-0 z-50 bg-black/50 backdrop-blur-[1px]",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
            )}
          />
          <AlertDialog.Content
            className={cn(
              "fixed left-1/2 top-1/2 z-50 grid max-h-[min(90dvh,32rem)] w-[calc(100vw-1.5rem)] max-w-md -translate-x-1/2 -translate-y-1/2 gap-0 overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-md outline-none",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
              "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
            )}
          >
            <div className="max-h-[min(90dvh,32rem)] overflow-y-auto overscroll-contain">
              <div className="flex gap-3 border-b border-border/60 bg-muted/30 p-4 sm:p-5">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background shadow-sm">
                  <AlertTriangleIcon className="size-5 text-destructive" aria-hidden />
                </div>
                <div className="min-w-0 space-y-1.5 pt-0.5">
                  <AlertDialog.Title className="text-base font-semibold leading-tight tracking-tight sm:text-lg">
                    Odwołać tę akcję?
                  </AlertDialog.Title>
                  <AlertDialog.Description className="text-sm leading-relaxed text-muted-foreground">
                    Tej decyzji nie da się cofnąć. Po odwołaniu akcja przestanie obowiązywać w wybranym
                    terminie.
                  </AlertDialog.Description>
                  <p className="truncate pt-1 text-sm font-medium text-foreground" title={action.event.name}>
                    {action.event.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground" title={action.shop.name}>
                    {action.shop.name}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 border-t border-border/60 bg-card p-4 sm:flex-row sm:justify-end sm:p-5">
                <AlertDialog.Cancel asChild>
                  <Button type="button" variant="outline" className="w-full sm:w-auto" disabled={cancelPending}>
                    Anuluj
                  </Button>
                </AlertDialog.Cancel>
                <Button
                  type="button"
                  variant="destructive"
                  className="w-full sm:w-auto"
                  disabled={cancelPending}
                  onClick={() => void confirmCancelAction()}
                >
                  {cancelPending ? "Trwa odwoływanie…" : "Tak, odwołaj"}
                </Button>
              </div>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  )
}

