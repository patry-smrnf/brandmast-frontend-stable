"use client"

import { CalendarDaysIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatPlDatePoland, parseIso } from "@/lib/dates/date-utils"

import { bmCardClass } from "../../brandmaster-ui"
import type { BrandmasterNowosc } from "../brandmaster-nowosci-data"

function formatAddedAtLabel(addedAt: string) {
  const date = parseIso(`${addedAt}T12:00:00`)
  if (!date) return addedAt
  return formatPlDatePoland(date)
}

export function NowoscCard({ item }: { item: BrandmasterNowosc }) {
  const dateLabel = formatAddedAtLabel(item.addedAt)

  return (
    <Card className={bmCardClass}>
      <CardHeader className="space-y-2 px-4 py-3.5 sm:px-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <CardTitle className="min-w-0 text-sm font-semibold leading-snug sm:text-base">
            {item.title}
          </CardTitle>
          <Badge
            variant="outline"
            className="w-fit shrink-0 gap-1.5 rounded-xl font-normal tabular-nums"
          >
            <CalendarDaysIcon className="size-3" aria-hidden />
            {dateLabel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0 sm:px-5 sm:pb-5">
        <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
      </CardContent>
    </Card>
  )
}
