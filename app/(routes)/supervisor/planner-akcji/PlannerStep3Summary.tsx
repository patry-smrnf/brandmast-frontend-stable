"use client"

import * as React from "react"
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  CheckIcon,
  ChevronDownIcon,
  Loader2Icon,
  PlayIcon,
  RotateCcwIcon,
  StoreIcon,
  XCircleIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { toDateKey } from "@/lib/dates/date-utils"
import { formatDatePL } from "@/app/(routes)/brandmaster/editor/editor-utils"
import { getShopAddress } from "@/lib/shops/shop-utils"

import { getShopDisplayName } from "./planner-utils"
import type { ActionPlannerState } from "./use-action-planner-state"

const PREVIEW_LIMIT = 8

function ExpandableList({
  title,
  count,
  items,
  renderItem,
}: {
  title: string
  count: number
  items: unknown[]
  renderItem: (item: unknown, index: number) => React.ReactNode
}) {
  const [expanded, setExpanded] = React.useState(count <= PREVIEW_LIMIT)
  const needsToggle = count > PREVIEW_LIMIT
  const visibleItems = expanded ? items : items.slice(0, PREVIEW_LIMIT)

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 text-left"
        onClick={() => needsToggle && setExpanded((v) => !v)}
        disabled={!needsToggle}
      >
        <div>
          <div className="text-xs text-muted-foreground">{title}</div>
          <div className="mt-1 text-sm font-medium tabular-nums">{count}</div>
        </div>
        {needsToggle ? (
          <ChevronDownIcon
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform",
              expanded && "rotate-180",
            )}
          />
        ) : null}
      </button>
      <div className="mt-3 space-y-1.5">
        {visibleItems.map((item, i) => renderItem(item, i))}
        {!expanded && needsToggle ? (
          <p className="pt-1 text-xs text-muted-foreground">
            +{count - PREVIEW_LIMIT} kolejnych — kliknij nagłówek, aby rozwinąć
          </p>
        ) : null}
      </div>
    </div>
  )
}

type PlannerStep3SummaryProps = {
  state: ActionPlannerState
}

export default function PlannerStep3Summary({ state }: PlannerStep3SummaryProps) {
  const {
    selectedShops,
    selectedShopIds,
    sortedSelectedDates,
    startNorm,
    endNorm,
    startTime,
    endTime,
    totalActions,
    planBlocked,
    executionPhase,
    tasks,
    currentTaskKey,
    startPlanning,
    resetPlanning,
    completedCount,
    errorCount,
    progressPercent,
    setStep,
  } = state

  const isRunning = executionPhase === "running"
  const isDone = executionPhase === "done"
  const showExecution = executionPhase !== "idle"

  const currentTask = tasks.find((t) => t.key === currentTaskKey)

  if (showExecution) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="space-y-1">
          <CardTitle className="inline-flex items-center gap-2">
            {isRunning ? (
              <Loader2Icon className="size-5 animate-spin text-primary" />
            ) : isDone && errorCount === 0 ? (
              <CheckCircle2Icon className="size-5 text-emerald-500" />
            ) : (
              <AlertTriangleIcon className="size-5 text-amber-500" />
            )}
            {isRunning ? "Planowanie akcji…" : "Podsumowanie planowania"}
          </CardTitle>
          <CardDescription>
            {isRunning
              ? "Tworzenie akcji dla każdego sklepu i daty."
              : `Zakończono: ${completedCount} sukcesów, ${errorCount} błędów.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="text-muted-foreground">Postęp</span>
              <span className="font-medium tabular-nums">
                {completedCount + errorCount} / {tasks.length}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300 ease-out",
                  isDone && errorCount > 0 ? "bg-amber-500" : "bg-primary",
                )}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="success" className="tabular-nums">
                OK: {completedCount}
              </Badge>
              {errorCount > 0 ? (
                <Badge variant="destructive" className="tabular-nums">
                  Błędy: {errorCount}
                </Badge>
              ) : null}
              {isRunning ? (
                <Badge variant="secondary" className="tabular-nums">
                  Pozostało: {tasks.length - completedCount - errorCount}
                </Badge>
              ) : null}
            </div>
          </div>

          {isRunning && currentTask ? (
            <div
              className="animate-in fade-in slide-in-from-bottom-2 rounded-xl border border-primary/30 bg-primary/5 p-4 duration-300"
              key={currentTask.key}
            >
              <div className="flex items-start gap-3">
                <Loader2Icon className="mt-0.5 size-5 shrink-0 animate-spin text-primary" />
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-primary">
                    Planowane teraz
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold">{currentTask.shopName}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {currentTask.shopAddress || "—"}
                  </p>
                  <p className="mt-2 text-sm">{currentTask.dateLabel}</p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="max-h-[min(360px,45vh)] space-y-1.5 overflow-auto rounded-xl border border-border bg-muted/20 p-2">
            {tasks.map((task) => {
              const isActive = task.key === currentTaskKey
              return (
                <div
                  key={task.key}
                  className={cn(
                    "flex items-start gap-2.5 rounded-lg border px-3 py-2 transition-all duration-200",
                    task.status === "success" && "border-emerald-500/30 bg-emerald-500/5",
                    task.status === "error" && "border-destructive/30 bg-destructive/5",
                    task.status === "running" && "border-primary/40 bg-primary/5 shadow-sm",
                    task.status === "pending" && "border-border/60 bg-card/50 opacity-60",
                    isActive && "scale-[1.01]",
                  )}
                >
                  <div className="mt-0.5 shrink-0">
                    {task.status === "running" ? (
                      <Loader2Icon className="size-4 animate-spin text-primary" />
                    ) : task.status === "success" ? (
                      <CheckCircle2Icon className="size-4 text-emerald-500" />
                    ) : task.status === "error" ? (
                      <XCircleIcon className="size-4 text-destructive" />
                    ) : (
                      <div className="size-4 rounded-full border border-border" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{task.shopName}</div>
                    <div className="truncate text-xs text-muted-foreground">{task.dateLabel}</div>
                    {task.errorMessage ? (
                      <p className="mt-1 text-xs text-destructive">{task.errorMessage}</p>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>

          {isDone ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={resetPlanning}>
                <RotateCcwIcon className="size-4" />
                Wróć do podsumowania
              </Button>
              <Button onClick={() => setStep(1)}>Nowe planowanie</Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-1">
        <CardTitle className="inline-flex items-center gap-2">
          <CheckIcon className="size-5 text-muted-foreground" />
          Podsumowanie
        </CardTitle>
        <CardDescription>
          Sprawdź wybór przed planowaniem. Utworzysz{" "}
          <span className="font-medium text-foreground tabular-nums">{totalActions}</span> akcji.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:col-span-1">
            <div className="text-xs text-muted-foreground">Sklepy</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">{selectedShopIds.size}</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:col-span-1">
            <div className="text-xs text-muted-foreground">Daty</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">
              {sortedSelectedDates.length}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:col-span-1">
            <div className="text-xs text-muted-foreground">Akcje łącznie</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">{totalActions}</div>
          </div>
        </div>

        <ExpandableList
          title="Wybrane sklepy"
          count={selectedShops.length}
          items={selectedShops}
          renderItem={(s) => {
            const shop = s as (typeof selectedShops)[number]
            return (
              <div
                key={shop.id}
                className="flex items-start gap-2 rounded-lg border border-border bg-background px-3 py-2"
              >
                <StoreIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{getShopDisplayName(shop)}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {getShopAddress(shop) || "—"}
                  </div>
                </div>
              </div>
            )
          }}
        />

        <ExpandableList
          title="Wybrane daty"
          count={sortedSelectedDates.length}
          items={sortedSelectedDates}
          renderItem={(d) => {
            const date = d as Date
            return (
              <div
                key={toDateKey(date)}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2"
              >
                <div className="min-w-0 truncate text-sm">{formatDatePL(date)}</div>
                <div className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {toDateKey(date)}
                </div>
              </div>
            )
          }}
        />

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="text-xs text-muted-foreground">Godziny (dla każdego dnia)</div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-lg border border-border bg-background px-3 py-2 tabular-nums">
              {startNorm.ok ? startNorm.value : startTime}
            </span>
            <span className="text-muted-foreground">→</span>
            <span className="rounded-lg border border-border bg-background px-3 py-2 tabular-nums">
              {endNorm.ok ? endNorm.value : endTime}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => setStep(2)}>
            Wstecz
          </Button>
          <Button className="shadow-sm" disabled={planBlocked} onClick={() => void startPlanning()}>
            <PlayIcon className="size-4" />
            Planuj
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
