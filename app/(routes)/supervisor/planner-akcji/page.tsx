"use client"

import { ChevronLeftIcon, CalendarRangeIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { isCasConnected } from "@/lib/config"
import { cn } from "@/lib/utils"

import { CasDisconnectedBanner } from "../_components/CasDisconnectedBanner"
import PlannerStep1Shops from "./PlannerStep1Shops"
import PlannerStep2Dates from "./PlannerStep2Dates"
import PlannerStep3Summary from "./PlannerStep3Summary"
import { useActionPlannerState } from "./use-action-planner-state"

const STEPS = [
  { n: 1 as const, label: "Sklepy" },
  { n: 2 as const, label: "Daty" },
  { n: 3 as const, label: "Podsumowanie" },
]

export default function PlannerAkcjiPage() {
  const casConnected = isCasConnected()
  const state = useActionPlannerState()
  const { step, stepTitle, goBack, executionPhase } = state
  const isLocked = executionPhase !== "idle"

  if (!casConnected) {
    return (
      <main className="flex flex-1 flex-col bg-background pb-24">
        <div className="mx-auto w-full min-w-0 max-w-5xl px-4 py-6">
          <CasDisconnectedBanner />
          <header className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarRangeIcon className="size-3.5" />
                  <span className="font-medium text-foreground">Planner Akcji</span>
                </span>
              </div>
              <div className="mt-2 text-lg font-semibold tracking-tight">
                Tworzenie akcji CAS
              </div>
              <p className="mt-1 max-w-prose text-sm text-muted-foreground">
                Planner wymaga aktywnego połączenia z CAS. Połącz CAS w ustawieniach, aby
                tworzyć puste akcje w Tour Plannerze.
              </p>
            </div>
          </header>
        </div>
      </main>
    )
  }

  return (
    <main className="flex flex-1 flex-col bg-background pb-24">
      <div className="mx-auto w-full min-w-0 max-w-5xl px-4 py-6">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CalendarRangeIcon className="size-3.5" />
                <span className="font-medium text-foreground">Planner Akcji</span>
              </span>
            </div>
            <div className="mt-2 text-lg font-semibold tracking-tight">{stepTitle(step)}</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Krok <span className="tabular-nums">{step}</span> / 3
            </div>
          </div>

          {step > 1 && !isLocked ? (
            <Button variant="outline" size="sm" onClick={goBack}>
              <ChevronLeftIcon className="size-3.5" />
              Wstecz
            </Button>
          ) : null}
        </header>

        <nav
          className="mt-5 flex gap-1 rounded-xl border border-border bg-muted/40 p-1"
          aria-label="Kroki planowania"
        >
          {STEPS.map(({ n, label }) => {
            const isActive = step === n
            const isDone = step > n
            const isDisabled = isLocked && n !== 3
            return (
              <div
                key={n}
                className={cn(
                  "flex flex-1 items-center justify-center rounded-lg px-2 py-2 text-center text-[11px] font-medium transition-colors sm:text-xs",
                  isActive && "bg-background text-foreground shadow-sm",
                  isDone && !isActive && "text-muted-foreground",
                  !isActive && !isDone && "text-muted-foreground/70",
                  isDisabled && "pointer-events-none opacity-50",
                )}
                aria-current={isActive ? "step" : undefined}
              >
                <span className="tabular-nums">{n}.</span>
                <span className="ml-1 truncate">{label}</span>
              </div>
            )
          })}
        </nav>

        <Separator className="my-5" />

        {step === 1 ? (
          <PlannerStep1Shops state={state} />
        ) : step === 2 ? (
          <PlannerStep2Dates state={state} />
        ) : (
          <PlannerStep3Summary state={state} />
        )}
      </div>
    </main>
  )
}
