"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { isAxiosError } from "axios"
import {
  KeyRoundIcon,
  Loader2Icon,
  LockIcon,
  MapPinIcon,
  ShieldCheckIcon,
  ShieldIcon,
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
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { brandmastApi, clearSessionAndRedirectToLogin } from "@/lib/api"
import {
  getConfigState,
  needsBrandmasterConsent,
  setConfig,
} from "@/lib/config"
import { cn } from "@/lib/utils"

import { bmCardClass } from "../brandmaster-ui"

function readApiError(err: unknown): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined
    return data?.message ?? err.message ?? "Błąd sieci."
  }
  if (err instanceof Error) return err.message
  return "Nieznany błąd."
}

const SECURITY_POINTS = [
  {
    icon: LockIcon,
    title: "Sesja JWT i kontrola dostępu",
    body: "Po zalogowaniu działa podpisany token. Proxy nie wpuszcza do panelu bez ważnej sesji, a brandmaster i supervisor mają osobne strefy. Bez ważnego Bearer tokena endpointy zwracają 401, a zła rola to 403.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Automatyczne wylogowanie",
    body: "Gdy serwer uzna sesję za nieważną, token i ciasteczka są czyszczone, a aplikacja wraca na logowanie.",
  },
  {
    icon: UsersIcon,
    title: "Dane tylko w obrębie zespołu",
    body: "Brandmaster widzi i zmienia wyłącznie swoje akcje i bonusy",
  },
  {
    icon: KeyRoundIcon,
    title: "Sekrety poza kodem, baza po TLS",
    body: "Klucz podpisu JWT i dane do bazy pochodzą ze zmiennych środowiskowych, nie z repozytorium. Połączenie z bazą idzie z wymaganym SSL, a tożsamość na żądaniu bierze się z tokena, nie z ID w body ( w przeciwienstwie do niektorych systemow :ppp ) ",
  }
] as const

export function BrandmasterZgodyView() {
  const router = useRouter()
  const [rodoAccepted, setRodoAccepted] = React.useState(false)
  const [securityAcked, setSecurityAcked] = React.useState(false)
  const [saving, setSaving] = React.useState(false)

  const canSubmit = rodoAccepted && securityAcked && !saving

  async function onAccept() {
    if (!canSubmit) return

    setSaving(true)
    const toastId = toast.loading("Zapisywanie zgód…")
    try {
      const res = await brandmastApi.acceptZgody()
      if (!res.success) {
        toast.error(res.message ?? "Nie udało się zapisać zgód.", { id: toastId })
        return
      }

      const current = getConfigState().config
      if (current) {
        setConfig({
          ...current,
          brandmasterData: { ...current.brandmasterData, zgody: true },
        })
      }

      try {
        const cfg = await brandmastApi.fetchConfig()
        if (cfg.success && cfg.data) setConfig(cfg.data)
      } catch {
        // local optimistic update is enough to leave the gate
      }

      if (needsBrandmasterConsent(getConfigState().config)) {
        toast.error("Serwer nie potwierdził zapisu zgód. Spróbuj ponownie.", {
          id: toastId,
        })
        return
      }

      toast.success("Zgody zapisane.", { id: toastId })
      router.replace("/brandmaster")
    } catch (err) {
      toast.error(readApiError(err), { id: toastId })
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="flex flex-1 flex-col bg-background px-4 py-8 sm:py-10">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-4 sm:max-w-xl">
        <div className="inline-flex items-center gap-2">
          <div className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <ShieldIcon className="size-4" aria-hidden />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">Brandmastuj</div>
            <div className="text-xs text-muted-foreground">Zgody i bezpieczeństwo</div>
          </div>
        </div>

        <Card className={cn(bmCardClass, "shadow-md")}>
          <CardHeader className="space-y-2">
            <CardTitle>Zgody na przetwarzanie danych</CardTitle>
            <CardDescription>
              Zanim wejdziesz do aplikacji, potrzebna jest Twoja zgoda na przetwarzanie
              danych osobowych związanych z pracą z apka brandmast.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2 rounded-2xl bg-secondary/40 px-3 py-3 text-sm ring-1 ring-border/50">
              <p className="font-medium">Jakie dane sa przetwarzane</p>
              <p className="text-muted-foreground">
                Imię, nazwisko, login PLH, e-mail, dane zespołu oraz planowane i
                rozliczane akcje. Jeśli użyjesz mapy, chwilowo odczytana zostanie Twoja
                lokalizacja, żeby podpowiedzieć sklepy w okolicy.
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">Jak Brandmast chroni te dane</p>
              <ul className="space-y-2.5">
                {SECURITY_POINTS.map((point) => (
                  <li
                    key={point.title}
                    className="flex gap-3 rounded-2xl bg-muted/30 px-3 py-2.5 ring-1 ring-border/50"
                  >
                    <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                      <point.icon className="size-4" aria-hidden />
                    </span>
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-sm font-medium">{point.title}</p>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {point.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3 px-1 py-1">
                <Checkbox
                  id="zgoda-rodo"
                  className="mt-0.5"
                  checked={rodoAccepted}
                  disabled={saving}
                  onCheckedChange={(next) => setRodoAccepted(next === true)}
                />
                <Label htmlFor="zgoda-rodo" className="cursor-pointer text-sm font-normal leading-snug">
                  Wyrażam zgodę na przetwarzanie moich danych osobowych w celu
                  świadczenia aplikacji Brandmast (planowanie i rozliczanie akcji).
                </Label>
              </div>

              <div className="flex items-start gap-3 px-1 py-1">
                <Checkbox
                  id="zgoda-security"
                  className="mt-0.5"
                  checked={securityAcked}
                  disabled={saving}
                  onCheckedChange={(next) => setSecurityAcked(next === true)}
                />
                <Label
                  htmlFor="zgoda-security"
                  className="cursor-pointer text-sm font-normal leading-snug"
                >
                  Potwierdzam, że zapoznałem/am się z informacją o mechanikach
                  bezpieczeństwa Brandmast.
                </Label>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                type="button"
                className="w-full"
                size="lg"
                disabled={!canSubmit}
                onClick={() => void onAccept()}
              >
                {saving ? <Loader2Icon className="size-4 animate-spin" /> : null}
                <span className={saving ? "ml-2" : undefined}>
                  Akceptuję i wchodzę do aplikacji
                </span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                disabled={saving}
                onClick={() => clearSessionAndRedirectToLogin()}
              >
                Wyloguj
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
