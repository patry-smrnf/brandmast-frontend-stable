"use client"

import { CalendarDaysIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatPlDatePoland, parseIso } from "@/lib/dates/date-utils"

import type { BrandmasterNowosc } from "../brandmaster-nowosci-data"

function formatAddedAtLabel(addedAt: string) {
  const date = parseIso(`${addedAt}T12:00:00`)
  if (!date) return addedAt
  return formatPlDatePoland(date)
}

export function NowoscCard({ item }: { item: BrandmasterNowosc }) {
  const dateLabel = formatAddedAtLabel(item.addedAt)

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="space-y-2 px-3.5 py-3 sm:px-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <CardTitle className="min-w-0 text-sm font-semibold leading-snug sm:text-base">
            {item.title}
          </CardTitle>
          <Badge
            variant="outline"
            className="w-fit shrink-0 gap-1.5 font-normal tabular-nums"
          >
            <CalendarDaysIcon className="size-3" aria-hidden />
            {dateLabel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-3.5 pb-3.5 pt-0 sm:px-4 sm:pb-4">
        <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
      </CardContent>
    </Card>
  )
}
