"use client"

import * as React from "react"
import { isAxiosError } from "axios"
import {
  CalendarRangeIcon,
  DownloadIcon,
  FileSpreadsheetIcon,
  Loader2Icon,
  UsersIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { brandmastApi } from "@/lib/api"
import { toDateKey, toMonthKey } from "@/lib/dates/date-utils"

type ExportKind = "brandmasters" | "actions"

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.rel = "noopener"
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

async function readApiError(err: unknown): Promise<string> {
  if (isAxiosError(err)) {
    const data = err.response?.data
    if (data instanceof Blob) {
      try {
        const text = await data.text()
        if (!text.trim()) return err.message ?? "Błąd sieci."
        try {
          const json = JSON.parse(text) as { message?: string }
          return json.message ?? text
        } catch {
          return text
        }
      } catch {
        return err.message ?? "Błąd sieci."
      }
    }
    const json = data as { message?: string } | undefined
    return json?.message ?? err.message ?? "Błąd sieci."
  }
  if (err instanceof Error) return err.message
  return "Nieznany błąd."
}

function ExportStatusBanner({
  kind,
  label,
}: {
  kind: ExportKind
  label: string
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <Loader2Icon className="mt-0.5 size-5 shrink-0 animate-spin text-primary" aria-hidden />
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <p className="text-sm font-medium text-foreground">{label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {kind === "brandmasters"
                ? "Trwa przygotowanie listy brandmasterów, plik pobierze się automatycznie."
                : "Trwa przygotowanie raportu akcji, plik pobierze się automatycznie."}
            </p>
          </div>
          <div
            className="h-1.5 overflow-hidden rounded-full bg-muted"
            aria-hidden
          >
            <div className="h-full w-2/5 animate-pulse rounded-full bg-primary/80" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SupervisorExcelPage() {
  const todayKey = React.useMemo(() => toDateKey(new Date()), [])
  const monthStartKey = React.useMemo(() => `${toMonthKey(new Date())}-01`, [])

  const [startDate, setStartDate] = React.useState(monthStartKey)
  const [endDate, setEndDate] = React.useState(todayKey)
  const [exporting, setExporting] = React.useState<ExportKind | null>(null)

  const dateRangeInvalid = startDate > endDate

  async function runExport(kind: ExportKind) {
    if (exporting) return

    if (kind === "actions") {
      if (!startDate.trim() || !endDate.trim()) {
        toast.error("Wybierz datę początkową i końcową.")
        return
      }
      if (dateRangeInvalid) {
        toast.error("Data początkowa nie może być późniejsza niż końcowa.")
        return
      }
    }

    setExporting(kind)
    try {
      if (kind === "brandmasters") {
        const blob = await brandmastApi.exportBrandmastersExcel({ timeout: 120_000 })
        downloadBlob(blob, "brandmasters.xlsx")
        toast.success("Pobrano listę brandmasterów.")
      } else {
        const blob = await brandmastApi.exportActionsExcel(
          { startDate, endDate },
          { timeout: 120_000 },
        )
        downloadBlob(blob, "actions.xlsx")
        toast.success("Pobrano raport akcji.")
      }
    } catch (e) {
      toast.error(await readApiError(e))
    } finally {
      setExporting(null)
    }
  }

  const busy = exporting !== null

  return (
    <main className="flex flex-1 flex-col bg-background pb-24">
      <div className="mx-auto w-full min-w-0 max-w-3xl overflow-x-clip px-4 py-6 sm:px-5">
        <header className="space-y-1">
          <p className="text-xs text-muted-foreground">Panel Supervisora</p>
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight sm:text-2xl">
            <FileSpreadsheetIcon className="size-5 text-muted-foreground" aria-hidden />
            Eksport Excel
          </h1>
          <p className="max-w-prose text-sm text-muted-foreground">
            Modul EXCEL, generowanie plikow excel.
          </p>
        </header>

        <Separator className="my-5" />

        {exporting ? (
          <div className="mb-4">
            <ExportStatusBanner
              kind={exporting}
              label={
                exporting === "brandmasters"
                  ? "Generowanie Excel, brandmasterzy"
                  : "Generowanie Excel, akcje"
              }
            />
          </div>
        ) : null}

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="space-y-1">
              <div className="flex items-center gap-2">
                <UsersIcon className="size-4 text-muted-foreground" aria-hidden />
                <CardTitle className="text-lg">Brandmasterzy</CardTitle>
              </div>
              <CardDescription>
                Informacje o zespole, kasoterminale, PLH, maile itd
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                type="button"
                className="h-11 w-full sm:w-auto"
                disabled={busy}
                onClick={() => void runExport("brandmasters")}
              >
                {exporting === "brandmasters" ? (
                  <Loader2Icon className="size-4 animate-spin" aria-hidden />
                ) : (
                  <DownloadIcon className="size-4" aria-hidden />
                )}
                <span className="ml-2">
                  {exporting === "brandmasters" ? "Generowanie…" : "Pobierz brandmasters.xlsx"}
                </span>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-1">
              <div className="flex items-center gap-2">
                <CalendarRangeIcon className="size-4 text-muted-foreground" aria-hidden />
                <CardTitle className="text-lg">Akcje</CardTitle>
              </div>
              <CardDescription>
                Raport akcji w wybranym przedziale dat
              </CardDescription>
            </CardHeader>
            <CardContent className="min-w-0 space-y-4">
              <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="min-w-0 space-y-2">
                  <Label htmlFor="excel-start">Od dnia</Label>
                  <Input
                    id="excel-start"
                    type="date"
                    value={startDate}
                    max={endDate || undefined}
                    disabled={busy}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="tabular-nums"
                  />
                </div>
                <div className="min-w-0 space-y-2">
                  <Label htmlFor="excel-end">Do dnia</Label>
                  <Input
                    id="excel-end"
                    type="date"
                    value={endDate}
                    min={startDate || undefined}
                    disabled={busy}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="tabular-nums"
                  />
                </div>
              </div>

              {dateRangeInvalid ? (
                <p className="text-sm text-destructive" role="alert">
                  Data początkowa jest późniejsza niż końcowa, popraw zakres przed eksportem.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Zakres:{" "}
                  <span className="font-medium tabular-nums text-foreground">
                    {startDate}
                  </span>
                  {", "}
                  <span className="font-medium tabular-nums text-foreground">{endDate}</span>
                </p>
              )}

              <Button
                type="button"
                className="h-11 w-full sm:w-auto"
                disabled={busy || dateRangeInvalid}
                onClick={() => void runExport("actions")}
              >
                {exporting === "actions" ? (
                  <Loader2Icon className="size-4 animate-spin" aria-hidden />
                ) : (
                  <DownloadIcon className="size-4" aria-hidden />
                )}
                <span className="ml-2">
                  {exporting === "actions" ? "Generowanie…" : "Pobierz actions.xlsx"}
                </span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
