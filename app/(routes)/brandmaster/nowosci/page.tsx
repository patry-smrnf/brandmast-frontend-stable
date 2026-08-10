"use client"

import * as React from "react"
import { SparklesIcon } from "lucide-react"

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { BrandmasterScheduledNotice } from "../BrandmasterScheduledNotice"
import { bmCardClass, bmIconBubble } from "../brandmaster-ui"
import { NowoscCard } from "./_components/NowoscCard"
import { getBrandmasterNowosciSorted } from "./brandmaster-nowosci-data"

export default function BrandmasterNowosciPage() {
  const nowosci = React.useMemo(() => getBrandmasterNowosciSorted(), [])

  return (
    <main className="flex flex-1 flex-col bg-background pb-24">
      <div className="mx-auto w-full max-w-lg px-3 py-5 sm:max-w-xl sm:px-4 sm:py-6">
        <BrandmasterScheduledNotice />

        <header className="min-w-0 pr-11">
          <p className="text-xs font-medium text-muted-foreground">Panel Brandmastera</p>
          <h1 className="mt-0.5 truncate text-2xl font-bold tracking-tight sm:text-3xl">
            Nowości
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Najnowsze funkcje i zmiany w aplikacji
          </p>
        </header>

        <section aria-label="Lista nowości" className="mt-5 space-y-3.5">
          <Card className={bmCardClass}>
            <CardHeader className="space-y-0.5 px-4 py-3.5 sm:px-5">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <span className={bmIconBubble("violet")}>
                  <SparklesIcon className="size-3.5" aria-hidden />
                </span>
                Co nowego
              </CardTitle>
              <CardDescription className="text-xs">
                {nowosci.length}{" "}
                {nowosci.length === 1 ? "wpis" : nowosci.length > 1 && nowosci.length < 5 ? "wpisy" : "wpisów"}
              </CardDescription>
            </CardHeader>
          </Card>

          {nowosci.length === 0 ? (
            <div className="rounded-2xl bg-secondary/40 px-3 py-6 text-center text-sm text-muted-foreground ring-1 ring-dashed ring-border/70">
              Brak wpisów. Dodaj pierwszą nowość w pliku{" "}
              <span className="font-medium text-foreground">brandmaster-nowosci-data.ts</span>.
            </div>
          ) : (
            nowosci.map((item) => <NowoscCard key={item.id} item={item} />)
          )}
        </section>
      </div>
    </main>
  )
}
