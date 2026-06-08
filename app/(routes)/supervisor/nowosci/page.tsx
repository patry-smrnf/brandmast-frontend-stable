"use client"

import * as React from "react"
import { SparklesIcon } from "lucide-react"

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

import { NowoscCard } from "./_components/NowoscCard"
import { getSupervisorNowosciSorted } from "./supervisor-nowosci-data"

export default function SupervisorNowosciPage() {
  const nowosci = React.useMemo(() => getSupervisorNowosciSorted(), [])

  return (
    <main className="flex flex-1 flex-col bg-background pb-24">
      <div className="mx-auto w-full max-w-lg px-3 py-4 sm:max-w-xl sm:px-4 sm:py-5">
        <header className="min-w-0 pr-11">
          <p className="text-xs text-muted-foreground">Panel Supervisora</p>
          <h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl">Nowości</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Najnowsze funkcje i zmiany w aplikacji
          </p>
        </header>

        <Separator className="my-4" />

        <section aria-label="Lista nowości" className="space-y-3">
          <Card className="border-border/80 shadow-sm">
            <CardHeader className="space-y-0.5 px-3.5 py-3 sm:px-4">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <SparklesIcon className="size-4 text-muted-foreground" aria-hidden />
                Co nowego
              </CardTitle>
              <CardDescription className="text-xs">
                {nowosci.length}{" "}
                {nowosci.length === 1 ? "wpis" : nowosci.length > 1 && nowosci.length < 5 ? "wpisy" : "wpisów"}
              </CardDescription>
            </CardHeader>
          </Card>

          {nowosci.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/80 bg-muted/20 px-3 py-6 text-center text-sm text-muted-foreground">
              Brak wpisów. Dodaj pierwszą nowość w pliku{" "}
              <span className="font-medium text-foreground">supervisor-nowosci-data.ts</span>.
            </div>
          ) : (
            nowosci.map((item) => <NowoscCard key={item.id} item={item} />)
          )}
        </section>
      </div>
    </main>
  )
}
