import Link from "next/link"
import { CompassIcon, ShieldIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function AdminPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <ShieldIcon className="size-5 text-muted-foreground" aria-hidden />
          <h1 className="text-2xl font-semibold tracking-tight">Panel admina</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Narzędzia administracyjne i podgląd logów serwisowych.
        </p>
      </header>

      <Card className="border-border/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CompassIcon className="size-4" aria-hidden />
            Discover
          </CardTitle>
          <CardDescription>
            Przeglądaj logi na żywo, filtruj po tekście i serviceName, oznaczaj wpisy kolorami.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/admin/discover">Otwórz Discover</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
