"use client"

import * as React from "react"
import { ChevronDownIcon, Link2Icon, Loader2Icon } from "lucide-react"
import { toast } from "sonner"

import { Checkbox } from "@/components/ui/checkbox"
import { brandmastApi, getApiErrorMessage } from "@/lib/api"
import type { CasDetails } from "@/lib/api"
import {
  getCasStatusPresentationFromRaw,
  normalizeCasActionStatus,
  type NormalizedCasActionStatus,
} from "@/lib/cas-status"
import { cn } from "@/lib/utils"

import type { SvCasStatusPatch } from "../use-sv-actions"

const CAS_API_STATUS_ACCEPTED = "ACCEPTED"
const CAS_API_STATUS_EDITABLE = "EDITABLE"

function casCheckboxChecked(status: string | undefined): boolean {
  return normalizeCasActionStatus(status) === "accepted"
}

function isCasStatusToggleable(status: string | undefined): boolean {
  const normalized = normalizeCasActionStatus(status)
  return normalized === "accepted" || normalized === "editable"
}

function countByStatus(items: CasDetails[], status: NormalizedCasActionStatus): number {
  return items.filter((item) => normalizeCasActionStatus(item.status) === status).length
}

function casRowKey(item: CasDetails, index: number): string {
  return item.externalUuid?.trim() || item.ident?.trim() || `${item.name ?? "cas"}-${index}`
}

type CasDetailRowProps = {
  item: CasDetails
  pending: boolean
  onToggle: (item: CasDetails, nextChecked: boolean) => void
}

function CasDetailRow({ item, pending, onToggle }: CasDetailRowProps) {
  const title = item.name?.trim() || "—"
  const ident = item.ident?.trim()
  const statusRaw = item.status?.trim()
  const hasStatus = Boolean(statusRaw)
  const statusPres = hasStatus ? getCasStatusPresentationFromRaw(statusRaw) : null
  const checked = casCheckboxChecked(statusRaw)
  const canToggle = isCasStatusToggleable(statusRaw) && Boolean(item.externalUuid?.trim())

  return (
    <li className="relative flex items-start gap-2 py-2 pl-2.5 pr-2 sm:py-2.5 sm:pl-3 sm:pr-2.5">
      {statusPres ? (
        <span
          className={cn("absolute inset-y-2 left-0 w-0.5 rounded-full sm:inset-y-2.5", statusPres.accentClass)}
          aria-hidden
        />
      ) : null}

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium leading-tight text-foreground">{title}</p>
        {ident ? (
          <p className="mt-0.5 truncate font-mono text-[10px] leading-none tracking-tight text-muted-foreground lowercase">
            {ident.toLowerCase()}
          </p>
        ) : null}
      </div>

      {hasStatus && statusPres ? (
        <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
          <span className="max-w-[5.5rem] truncate text-right text-[10px] leading-tight text-muted-foreground sm:max-w-none">
            {statusPres.labelPl}
          </span>
          {pending ? (
            <span className="flex size-4 shrink-0 items-center justify-center" aria-hidden>
              <Loader2Icon className="size-3.5 animate-spin text-muted-foreground" />
            </span>
          ) : (
            <span
              className="relative z-10 shrink-0"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <Checkbox
                checked={checked}
                disabled={!canToggle}
                aria-label={`Status CAS: ${statusPres.labelPl}`}
                className="size-4 shrink-0"
                onCheckedChange={(next) => {
                  if (typeof next !== "boolean" || !canToggle) return
                  onToggle(item, next)
                }}
              />
            </span>
          )}
        </div>
      ) : null}
    </li>
  )
}

export type SupervisorActionCasDetailsProps = {
  idAction: number
  items: CasDetails[]
  onCasStatusPatched: (patch: SvCasStatusPatch) => void
}

export function SupervisorActionCasDetails({
  idAction,
  items,
  onCasStatusPatched,
}: SupervisorActionCasDetailsProps) {
  const [expanded, setExpanded] = React.useState(false)
  const [pendingUuid, setPendingUuid] = React.useState<string | null>(null)
  const pendingRef = React.useRef<string | null>(null)

  if (items.length === 0) return null

  const acceptedCount = countByStatus(items, "accepted")
  const editableCount = countByStatus(items, "editable")

  async function handleToggle(item: CasDetails, nextChecked: boolean) {
    const externalUuid = item.externalUuid?.trim()
    if (!externalUuid || pendingRef.current === externalUuid) return

    const previousStatus = item.status ?? ""
    const nextStatus = nextChecked ? CAS_API_STATUS_ACCEPTED : CAS_API_STATUS_EDITABLE

    pendingRef.current = externalUuid
    setPendingUuid(externalUuid)
    onCasStatusPatched({ idAction, externalUuid, status: nextStatus })

    try {
      const res = await brandmastApi.updateStatus({
        uuid: externalUuid,
        ident: nextStatus.toLowerCase(),
      })

      if (res.success === false) {
        onCasStatusPatched({ idAction, externalUuid, status: previousStatus })
        toast.error(res.message ?? "Nie udało się zaktualizować statusu CAS.")
        return
      }

      toast.success(nextChecked ? "Akcja CAS zaakceptowana." : "Akcja CAS oznaczona jako edytowalna.", {
        duration: 2200,
      })
    } catch (e) {
      onCasStatusPatched({ idAction, externalUuid, status: previousStatus })
      toast.error(getApiErrorMessage(e, "Nie udało się zaktualizować statusu CAS."))
    } finally {
      pendingRef.current = null
      setPendingUuid(null)
    }
  }

  return (
    <div
      className="-mx-2.5 mt-2.5 border-t border-border/60 sm:-mx-3"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="px-2.5 pt-2.5 sm:px-3 sm:pt-3">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setExpanded((v) => !v)
          }}
          aria-expanded={expanded}
          className={cn(
            "flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-[background-color,border-color,box-shadow] duration-200 motion-reduce:transition-none",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            expanded
              ? "border-primary/25 bg-primary/5 shadow-[inset_0_1px_0_0] shadow-primary/10"
              : "border-border/60 bg-muted/25 hover:border-border hover:bg-muted/40"
          )}
        >
          <span
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-md border transition-colors",
              expanded
                ? "border-primary/20 bg-primary/10 text-primary"
                : "border-border/50 bg-background/80 text-muted-foreground"
            )}
            aria-hidden
          >
            <Link2Icon className="size-3.5" />
          </span>

          <span className="min-w-0 flex-1">
            <span className="block text-xs font-semibold leading-tight text-foreground">Dane o akcji z CAS</span>
            <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] text-muted-foreground">
              <span>
                {items.length} {items.length === 1 ? "wpis" : items.length < 5 ? "wpisy" : "wpisów"}
              </span>
              {acceptedCount > 0 ? (
                <>
                  <span className="text-muted-foreground/40" aria-hidden>
                    ·
                  </span>
                  <span className="text-emerald-600/90 dark:text-emerald-400/90">
                    {acceptedCount} zaakcept.
                  </span>
                </>
              ) : null}
              {editableCount > 0 ? (
                <>
                  <span className="text-muted-foreground/40" aria-hidden>
                    ·
                  </span>
                  <span>{editableCount} edytow.</span>
                </>
              ) : null}
            </span>
          </span>

          <span
            className={cn(
              "flex size-6 shrink-0 items-center justify-center rounded-md bg-background/70 text-muted-foreground",
              expanded && "text-foreground"
            )}
            aria-hidden
          >
            <ChevronDownIcon
              className={cn(
                "size-3.5 transition-transform duration-200 motion-reduce:transition-none",
                expanded && "rotate-180"
              )}
            />
          </span>
        </button>

        <div
          className={cn(
            "grid transition-[grid-template-rows,opacity,margin] duration-200 ease-out motion-reduce:transition-none",
            expanded ? "mt-1.5 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          )}
        >
          <div className="overflow-hidden">
            <ul
              className="divide-y divide-border/50 overflow-hidden rounded-lg border border-border/50 bg-background/60"
              role="list"
            >
              {items.map((item, index) => (
                <CasDetailRow
                  key={casRowKey(item, index)}
                  item={item}
                  pending={pendingUuid === item.externalUuid?.trim()}
                  onToggle={handleToggle}
                />
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
