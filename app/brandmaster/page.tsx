import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

type MetricRow = {
  label: string
  value: string
  hint?: string
}

function StatTile({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold leading-none tabular-nums">
        {value}
      </div>
      {hint ? (
        <div className="mt-1 text-xs text-muted-foreground/80">{hint}</div>
      ) : null}
    </div>
  )
}

function ProgressBar({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-primary transition-[width]"
        style={{ width: `${clamped}%` }}
        aria-label={`Postęp: ${clamped}%`}
      />
    </div>
  )
}

function MetricList({ rows }: { rows: MetricRow[] }) {
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.label} className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="truncate text-sm text-muted-foreground">
              {row.label}
            </div>
            {row.hint ? (
              <div className="truncate text-xs text-muted-foreground/80">
                {row.hint}
              </div>
            ) : null}
          </div>
          <div className="shrink-0 text-right text-sm font-semibold tabular-nums">
            {row.value}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function BrandmasterPage() {
  const data = {
    periodLabel: "Dzisiaj",
    shift: {
      worked: "5h",
      target: "80h 00m",
      progressPct: 3,
      start: "09:20",
      endPlanned: "17:20",
      breaks: "0h 18m",
      remaining: "7h 42m",
    },
    payout: {
      expected: "410 zł",
      base: "280 zł",
      bonus: "130 zł",
      hint: "Szacunek na podstawie obecnych wyników.",
      paceHint: "Jeśli utrzymasz tempo, bonus powinien rosnąć.",
    },
    sales: [
      { label: "Hilo", units: 14, progressPct: 70 },
      { label: "Hilo+", units: 9, progressPct: 45 },
      { label: "Velo", units: 6, progressPct: 30 },
    ],
    efficiency: {
      score: 82,
      vsYesterday: "+6",
      kpis: [
        { label: "Konwersja", value: "18.2%", progressPct: 73 },
        { label: "Średni czas rozmowy", value: "02:41", progressPct: 64 },
        { label: "Utrzymanie tempa", value: "Dobre", progressPct: 80 },
      ],
    },
    goals: {
      dailySalesTarget: 40,
      dailySalesSoFar: 29,
      hiloTarget: 20,
      hiloPlusTarget: 16,
      veloTarget: 10,
    },
    pace: {
      salesPerHour: "5.1",
      talksPerHour: "8.3",
      bestHour: "12:00–13:00",
      nextFocus: "Hilo+",
    },
    week: {
      days: [
        { label: "Pon", value: 62 },
        { label: "Wto", value: 71 },
        { label: "Śro", value: 54 },
        { label: "Czw", value: 68 },
        { label: "Pią", value: 0 },
        { label: "Sob", value: 0 },
        { label: "Nie", value: 0 },
      ],
      avgEfficiency: "67",
      totalSales: "112",
      totalWorked: "23h 10m",
    },
    activity: [
      { time: "13:12", text: "Sprzedaż: Hilo+" },
      { time: "12:58", text: "Umówione: spotkanie" },
      { time: "12:41", text: "Sprzedaż: Hilo" },
      { time: "12:06", text: "Odrzucone: brak zgody" },
      { time: "11:37", text: "Sprzedaż: Velo" },
    ],
  }

  const totalSales = data.sales.reduce((acc, s) => acc + s.units, 0)
  const dailyTargetPct =
    data.goals.dailySalesTarget > 0
      ? Math.round((totalSales / data.goals.dailySalesTarget) * 100)
      : 0
  const dailyRemaining = Math.max(0, data.goals.dailySalesTarget - totalSales)

  return (
    <main className="flex flex-1 flex-col bg-background">
      <div className="mx-auto w-full max-w-5xl px-4 py-6">
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">
              Panel Brandmastera · {data.periodLabel}
            </div>
            <h1 className="truncate text-xl font-semibold tracking-tight">
              Podsumowanie dnia
            </h1>
          </div>

          <div className="shrink-0">
            <Button variant="outline" size="sm">
              Odśwież
            </Button>
          </div>
        </header>

        <Separator className="my-5" />

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="sm:col-span-2">
            <CardHeader className="space-y-1">
              <CardTitle>Czas pracy</CardTitle>
              <CardDescription>
                Start {data.shift.start} · Koniec (plan) {data.shift.endPlanned}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-3xl font-semibold tabular-nums leading-none">
                    {data.shift.worked}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Cel: {data.shift.target}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-sm font-medium tabular-nums">
                    {data.shift.progressPct}%
                  </div>
                  <div className="text-xs text-muted-foreground">wykonania</div>
                </div>
              </div>

              <ProgressBar value={data.shift.progressPct} />

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatTile label="Pozostało" value={data.shift.remaining} />
                <StatTile label="Przerwy" value={data.shift.breaks} />
                <StatTile label="Tempo" value={`${data.pace.talksPerHour}/h`} hint="rozmowy" />
                <StatTile label="Najlepsza godz." value={data.pace.bestHour} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-1">
              <CardTitle>Przewidywana wypłata</CardTitle>
              <CardDescription>{data.payout.hint}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-3xl font-semibold tabular-nums leading-none">
                  {data.payout.expected}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Dzisiaj (szacunek)
                </div>
              </div>

              <Separator />

              <MetricList
                rows={[
                  { label: "Podstawa", value: data.payout.base },
                  { label: "Bonus", value: data.payout.bonus },
                  { label: "Wskazówka", value: " ", hint: data.payout.paceHint },
                ]}
              />
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="space-y-1">
              <CardTitle>Sprzedaże</CardTitle>
              <CardDescription>Hilo · Hilo+ · Velo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-border bg-card px-4 py-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">
                      Cel dzienny (łącznie)
                    </div>
                    <div className="mt-1 text-lg font-semibold tabular-nums leading-none">
                      {totalSales}/{data.goals.dailySalesTarget} szt.
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground/80">
                      Brakuje: {dailyRemaining} · Skup się teraz:{" "}
                      <span className="text-foreground">{data.pace.nextFocus}</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-sm font-medium tabular-nums">
                      {dailyTargetPct}%
                    </div>
                    <div className="text-xs text-muted-foreground">celu</div>
                  </div>
                </div>
                <div className="mt-3">
                  <ProgressBar value={dailyTargetPct} />
                </div>
              </div>

              <div className="space-y-4">
                {data.sales.map((s) => (
                  <div key={s.label} className="space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-sm font-medium">{s.label}</div>
                      <div className="text-sm font-semibold tabular-nums">
                        {s.units} szt.
                      </div>
                    </div>
                    <ProgressBar value={s.progressPct} />
                  </div>
                ))}
              </div>

              <Separator />

              <MetricList
                rows={[
                  {
                    label: "Tempo sprzedaży",
                    value: `${data.pace.salesPerHour}/h`,
                    hint: "średnia z dzisiejszych danych",
                  },
                  { label: "Najbliższy cel", value: data.pace.nextFocus },
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-1">
              <CardTitle>Efektywność</CardTitle>
              <CardDescription>
                Wynik: {data.efficiency.score}/100 · vs wczoraj{" "}
                {data.efficiency.vsYesterday}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ProgressBar value={data.efficiency.score} />

              <Separator />

              <div className="space-y-3">
                {data.efficiency.kpis.map((kpi) => (
                  <div key={kpi.label} className="space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-sm text-muted-foreground">
                        {kpi.label}
                      </div>
                      <div className="text-sm font-semibold tabular-nums">
                        {kpi.value}
                      </div>
                    </div>
                    <ProgressBar value={kpi.progressPct} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <Separator className="my-5" />

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle>Najważniejsze teraz</CardTitle>
              <CardDescription>Priorytety i mikro-cele.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <StatTile
                  label="Cel łącznie"
                  value={`${data.goals.dailySalesTarget} szt.`}
                  hint="dzisiaj"
                />
                <StatTile
                  label="Brakuje"
                  value={`${dailyRemaining} szt.`}
                  hint="do celu"
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="rounded-xl border border-border bg-card px-4 py-3">
                  <div className="text-sm font-medium">1) Dobić Hilo+</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Największy wpływ na bonus w tej chwili.
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-card px-4 py-3">
                  <div className="text-sm font-medium">2) Trzymać tempo</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Nie wydłużaj rozmów bez potrzeby.
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-card px-4 py-3">
                  <div className="text-sm font-medium">3) Dobre domknięcie</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Krótkie podsumowanie + pytanie zamykające.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-1">
              <CardTitle>Szybkie statystyki</CardTitle>
              <CardDescription>Hardcoded – podłączymy API później.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <MetricList
                rows={[
                  { label: "Rozmowy", value: "47" },
                  { label: "Umówione", value: "9" },
                  { label: "Odrzucone", value: "12" },
                  { label: "Przerwy", value: data.shift.breaks },
                  { label: "Najczęstszy powód", value: "Brak zgody" },
                ]}
              />
            </CardContent>
          </Card>
        </section>

        <Separator className="my-5" />

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="space-y-1">
              <CardTitle>Tydzień (trend)</CardTitle>
              <CardDescription>Efektywność w % (ostatnie dni).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-7 gap-2">
                {data.week.days.map((d) => (
                  <div key={d.label} className="space-y-2">
                    <div className="text-center text-xs text-muted-foreground">
                      {d.label}
                    </div>
                    <div className="rounded-xl border border-border bg-card px-2 py-3">
                      <div className="mx-auto w-full max-w-[72px]">
                        <ProgressBar value={d.value} />
                      </div>
                      <div className="mt-2 text-center text-xs font-medium tabular-nums">
                        {d.value}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <StatTile label="Śr. efektywność" value={`${data.week.avgEfficiency}%`} />
                <StatTile label="Sprzedaże (tydzień)" value={data.week.totalSales} />
                <StatTile label="Czas pracy (tydzień)" value={data.week.totalWorked} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-1">
              <CardTitle>Ostatnia aktywność</CardTitle>
              <CardDescription>Najświeższe zdarzenia z dnia.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.activity.map((a) => (
                <div
                  key={`${a.time}-${a.text}`}
                  className="flex items-start justify-between gap-4 rounded-xl border border-border bg-card px-4 py-3"
                >
                  <div className="min-w-0 text-sm">{a.text}</div>
                  <div className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {a.time}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
