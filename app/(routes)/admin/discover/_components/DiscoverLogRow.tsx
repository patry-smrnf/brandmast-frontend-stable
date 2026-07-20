"use client"

import * as React from "react"
import { ChevronDownIcon, CopyIcon } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ServiceLogResponse } from "@/lib/api"
import { LogColorPicker } from "./LogColorPicker"
import {
  formatJsonForDisplay,
  formatLogTime,
  formatLogTimeShort,
  getLogLogin,
  levelBadgeVariant,
  LOG_MARK_COLOR_CLASS,
  logRowKey,
  type LogMarkColor,
} from "../discover-utils"

type DiscoverLogRowProps = {
  log: ServiceLogResponse
  color: LogMarkColor | null
  expanded: boolean
  onToggle: () => void
  onColorChange: (color: LogMarkColor | null) => void
  onTrackingIdClick?: (trackingId: string) => void
}

export function DiscoverLogRow({
  log,
  color,
  expanded,
  onToggle,
  onColorChange,
  onTrackingIdClick,
}: DiscoverLogRowProps) {
  const key = logRowKey(log)
  const mark = color ? LOG_MARK_COLOR_CLASS[color] : null
  const login = getLogLogin(log)

  const detailsJson = React.useMemo(() => {
    if (!log.details || Object.keys(log.details).length === 0) return null
    return formatJsonForDisplay(log.details)
  }, [log.details])

  async function copyJson() {
    try {
      await navigator.clipboard.writeText(formatJsonForDisplay(log))
      toast.success("Skopiowano JSON logu")
    } catch {
      toast.error("Nie udało się skopiować")
    }
  }

  async function copyDetails() {
    if (!detailsJson) return
    try {
      await navigator.clipboard.writeText(detailsJson)
      toast.success("Skopiowano details")
    } catch {
      toast.error("Nie udało się skopiować")
    }
  }

  return (
    <div
      data-log-key={key}
      className={cn(
        "min-w-0 border-b border-border/60 border-l-4 transition-colors",
        mark ? cn(mark.border, mark.row) : "border-l-transparent hover:bg-muted/40",
      )}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            onToggle()
          }
        }}
        className="grid min-w-0 cursor-pointer grid-cols-[auto_minmax(0,1fr)] gap-2 px-2 py-2 sm:grid-cols-[auto_8.5rem_4.5rem_9rem_minmax(0,1fr)] sm:items-start sm:gap-3 sm:px-3 lg:grid-cols-[auto_10rem_5rem_11rem_minmax(0,1fr)]"
      >
        <div className="flex items-start gap-1 pt-0.5" onClick={(e) => e.stopPropagation()}>
          <LogColorPicker value={color} onChange={onColorChange} />
          <ChevronDownIcon
            className={cn(
              "mt-1.5 size-3.5 shrink-0 text-muted-foreground transition-transform",
              expanded && "rotate-180",
            )}
            aria-hidden
          />
        </div>

        {/* Mobile stacked meta */}
        <div className="min-w-0 space-y-1 sm:contents">
          <div className="flex flex-wrap items-center gap-2 sm:contents">
            <time
              className="font-mono text-[11px] text-muted-foreground tabular-nums sm:pt-1 sm:text-xs"
              dateTime={log.createdAt ?? undefined}
              title={formatLogTime(log.createdAt)}
            >
              <span className="sm:hidden">{formatLogTime(log.createdAt)}</span>
              <span className="hidden sm:inline">{formatLogTimeShort(log.createdAt)}</span>
            </time>

            <div className="sm:pt-0.5">
              <Badge variant={levelBadgeVariant(log.level)} className="font-mono text-[10px] uppercase">
                {log.level ?? "—"}
              </Badge>
            </div>

            <div
              className="max-w-full truncate font-mono text-xs text-foreground/90 sm:pt-1"
              title={log.serviceName ?? undefined}
            >
              {log.serviceName ?? "—"}
            </div>
          </div>

          <div className="min-w-0 sm:pt-1">
            <p className="truncate text-sm text-foreground">
              {log.methodName ? (
                <span className="mr-1.5 font-mono text-xs text-muted-foreground">
                  {log.methodName}
                </span>
              ) : null}
              {login ? (
                <span className="mr-1.5 font-mono text-[11px] text-primary/90">@{login}</span>
              ) : null}
              <span className="wrap-break-word whitespace-normal sm:truncate sm:whitespace-nowrap">
                {log.message ?? "—"}
              </span>
            </p>
          </div>
        </div>
      </div>

      {expanded ? (
        <div className="min-w-0 space-y-3 overflow-hidden border-t border-border/50 bg-background/40 px-3 py-3 sm:px-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-medium text-muted-foreground">Document</p>
            <Button type="button" variant="outline" size="xs" onClick={copyJson}>
              <CopyIcon data-icon="inline-start" />
              Kopiuj JSON
            </Button>
          </div>

          <dl className="grid min-w-0 gap-2 text-xs sm:grid-cols-2 lg:grid-cols-3">
            <Field label="id" value={log.id != null ? String(log.id) : null} mono />
            <div className="min-w-0">
              <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                trackingId
              </dt>
              <dd className="mt-0.5">
                {log.trackingId ? (
                  <button
                    type="button"
                    className="max-w-full break-all text-left font-mono text-primary underline-offset-2 hover:underline"
                    title="Filtruj po trackingId (cały request)"
                    onClick={() => onTrackingIdClick?.(log.trackingId!)}
                  >
                    {log.trackingId}
                  </button>
                ) : (
                  <span className="font-mono">—</span>
                )}
              </dd>
            </div>
            <Field label="jobId" value={log.jobId} mono />
            <Field label="serviceName" value={log.serviceName} mono />
            <Field label="methodName" value={log.methodName} mono />
            <Field label="level" value={log.level} mono />
            <Field label="login" value={login} mono />
            <Field label="createdAt" value={formatLogTime(log.createdAt)} mono className="sm:col-span-2" />
            <Field label="message" value={log.message} className="sm:col-span-2 lg:col-span-3" />
          </dl>

          {detailsJson ? (
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-medium text-muted-foreground">details</p>
                <Button type="button" variant="ghost" size="xs" onClick={copyDetails}>
                  <CopyIcon data-icon="inline-start" />
                  Kopiuj details
                </Button>
              </div>
              <pre
                className={cn(
                  "max-h-[min(28rem,60vh)] max-w-full min-w-0 overflow-auto rounded-lg border border-border bg-muted/40 p-3",
                  "font-mono text-[11px] leading-relaxed break-all whitespace-pre-wrap text-foreground/90",
                  "[overflow-wrap:anywhere]",
                )}
              >
                {detailsJson}
              </pre>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Brak pola details.</p>
          )}
        </div>
      ) : null}
    </div>
  )
}

function Field({
  label,
  value,
  mono,
  className,
}: {
  label: string
  value?: string | null
  mono?: boolean
  className?: string
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "mt-0.5 max-w-full break-all whitespace-pre-wrap text-foreground [overflow-wrap:anywhere]",
          mono && "font-mono",
        )}
      >
        {value?.trim() ? value : "—"}
      </dd>
    </div>
  )
}
