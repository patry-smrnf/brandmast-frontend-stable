"use client"

import * as React from "react"
import { isAxiosError } from "axios"
import { Loader2Icon, RefreshCwIcon, ShieldIcon, UsersIcon } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
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
import { Switch } from "@/components/ui/switch"
import { brandmastApi, tokenStore } from "@/lib/api"
import type { SettingResponse } from "@/lib/api/generated/types"
import { setConfig, useConfigState } from "@/lib/config/configStore"
import { cn } from "@/lib/utils"

function formatText(value: string | number | null | undefined, empty = "—") {
  if (value === null || value === undefined) return empty
  const s = String(value).trim()
  return s.length ? s : empty
}

function BoolBadge({ value }: { value: boolean | null | undefined }) {
  if (value === null || value === undefined) {
    return (
      <Badge variant="outline" className="font-normal">
        brak danych
      </Badge>
    )
  }
  return (
    <Badge variant={value ? "success" : "secondary"} className="font-normal">
      {value ? "Tak" : "Nie"}
    </Badge>
  )
}

function readApiError(err: unknown): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined
    return data?.message ?? err.message ?? "Błąd sieci."
  }
  if (err instanceof Error) return err.message
  return "Nieznany błąd."
}

type ActionFlagKey = "isEditingAllowed" | "isAddingAllowed" | "isDeteletingAllowed"

export default function SupervisorSettingsPage() {
  const { status, config, errorMessage } = useConfigState()

  const [bootLoading, setBootLoading] = React.useState(true)

  const [requirePwdOverride, setRequirePwdOverride] = React.useState<boolean | null>(null)
  const [requirePwdSaving, setRequirePwdSaving] = React.useState(false)

  const [accountPwd, setAccountPwd] = React.useState("")
  const [accountPwd2, setAccountPwd2] = React.useState("")
  const [accountPwdSaving, setAccountPwdSaving] = React.useState(false)

  const my = config?.myData
  const serverCasLogin = my?.casLogin == null ? "" : String(my.casLogin)
  const [casLoginDraft, setCasLoginDraft] = React.useState("")
  const [casPasswordDraft, setCasPasswordDraft] = React.useState("")
  const [casDetachSaving, setCasDetachSaving] = React.useState(false)
  const [casConnectSaving, setCasConnectSaving] = React.useState(false)
  const [actionSavingKey, setActionSavingKey] = React.useState<ActionFlagKey | null>(null)

  React.useEffect(() => {
    setCasLoginDraft(serverCasLogin)
  }, [serverCasLogin])

  const refreshConfig = React.useCallback(async (): Promise<SettingResponse | null> => {
    const res = await brandmastApi.fetchConfig()
    if (res.success && res.data) {
      setConfig(res.data)
      return res.data
    }
    toast.error(res.message ?? "Nie udało się odświeżyć konfiguracji.")
    return null
  }, [])

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!tokenStore.get()) {
        setBootLoading(false)
        return
      }
      try {
        await refreshConfig()
      } finally {
        if (!cancelled) setBootLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [refreshConfig])

  const [isClient, setIsClient] = React.useState(false)
  React.useEffect(() => {
    queueMicrotask(() => {
      setIsClient(true)
    })
  }, [])

  const busy = bootLoading || status === "loading"
  const requirePwd = requirePwdOverride ?? !!config?.myData?.requirePassword

  const hasServerCasLogin = Boolean(serverCasLogin.trim())
  const showConnectCas = casPasswordDraft.trim().length > 0

  const team = config?.teamData
  const territory = team?.territoryData
  const area = territory?.areaData
  const actions = config?.actionsConfig
  const access = config?.accessConfig

  const anyCasSaving = casDetachSaving || casConnectSaving
  const anyActionSaving = actionSavingKey !== null

  async function onRefresh() {
    setBootLoading(true)
    try {
      await refreshConfig()
    } finally {
      setBootLoading(false)
    }
  }

  async function onDetachCas() {
    setCasDetachSaving(true)
    try {
      const res = await brandmastApi.updateConfig({ casLogin: null, casPassword: null })
      if (!res.success) {
        toast.error(res.message ?? "Nie udało się odpiąć CAS.")
        return
      }
      toast.success("CAS został odpięty.")
      setCasPasswordDraft("")
      await refreshConfig()
    } catch (e) {
      toast.error(readApiError(e))
    } finally {
      setCasDetachSaving(false)
    }
  }

  async function onConnectCas() {
    const login = casLoginDraft.trim()
    const pwd = casPasswordDraft.trim()
    if (!login) {
      toast.error("Podaj login CAS.")
      return
    }
    if (!pwd) {
      toast.error("Podaj hasło CAS.")
      return
    }
    setCasConnectSaving(true)
    try {
      const res = await brandmastApi.updateConfig({ casLogin: login, casPassword: pwd })
      if (!res.success) {
        toast.error(res.message ?? "Nie udało się połączyć z CAS.")
        return
      }
      toast.success("Połączono z CAS.")
      setCasPasswordDraft("")
      await refreshConfig()
    } catch (e) {
      toast.error(readApiError(e))
    } finally {
      setCasConnectSaving(false)
    }
  }

  async function onActionToggle(key: ActionFlagKey, next: boolean) {
    setActionSavingKey(key)
    try {
      const body =
        key === "isEditingAllowed"
          ? { isEditingAllowed: next }
          : key === "isAddingAllowed"
            ? { isAddingAllowed: next }
            : { isDeteletingAllowed: next, isDeletingAllowed: next }
      const res = await brandmastApi.updateConfig(body)
      if (!res.success) {
        toast.error(res.message ?? "Nie udało się zapisać uprawnień akcji.")
        return
      }
      toast.success("Zapisano uprawnienia akcji.")
      await refreshConfig()
    } catch (e) {
      toast.error(readApiError(e))
    } finally {
      setActionSavingKey(null)
    }
  }

  async function onRequirePasswordChange(next: boolean) {
    setRequirePwdOverride(next)
    setRequirePwdSaving(true)
    try {
      const res = await brandmastApi.updateConfig({ requirePassword: next })
      if (!res.success) {
        setRequirePwdOverride(null)
        toast.error(res.message ?? "Nie udało się zmienić ustawienia.")
        return
      }
      toast.success(next ? "Wymagane hasło włączone." : "Wymagane hasło wyłączone.")
      await refreshConfig()
      setRequirePwdOverride(null)
    } catch (e) {
      setRequirePwdOverride(null)
      toast.error(readApiError(e))
    } finally {
      setRequirePwdSaving(false)
    }
  }

  async function onSaveAccountPassword() {
    if (accountPwd.length < 1) {
      toast.error("Wpisz nowe hasło.")
      return
    }
    if (accountPwd !== accountPwd2) {
      toast.error("Hasła nie są takie same.")
      return
    }
    setAccountPwdSaving(true)
    try {
      const res = await brandmastApi.updateConfig({ password: accountPwd })
      if (!res.success) {
        toast.error(res.message ?? "Nie udało się ustawić hasła.")
        return
      }
      toast.success("Hasło zostało zaktualizowane.")
      setAccountPwd("")
      setAccountPwd2("")
      await refreshConfig()
    } catch (e) {
      toast.error(readApiError(e))
    } finally {
      setAccountPwdSaving(false)
    }
  }

  return (
    <main className="flex flex-1 flex-col bg-background">
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-5">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            <div className="text-xs text-muted-foreground">Panel Supervisora</div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Ustawienia</h1>
            <p className="max-w-prose text-sm text-muted-foreground">
              Dane i uprawnienia z konfiguracji konta. Zmiany zapisują się od razu — po sukcesie lista
              odświeża się automatycznie.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              disabled={
                isClient &&
                (busy ||
                  requirePwdSaving ||
                  accountPwdSaving ||
                  anyCasSaving ||
                  anyActionSaving)
              }
              onClick={() => void onRefresh()}
            >
              {busy ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <RefreshCwIcon className="size-4" />
              )}
              <span className="ml-2">Odśwież</span>
            </Button>
          </div>
        </header>

        <Separator className="my-5" />

        {status === "error" && errorMessage ? (
          <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="space-y-1">
              <div className="flex items-center gap-2">
                <UsersIcon className="size-4 text-muted-foreground" aria-hidden />
                <CardTitle className="text-lg">Moje informacje</CardTitle>
              </div>
              <CardDescription>Login CAS, połączenie z CAS oraz przydział zespołu</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isClient && busy && !config ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2Icon className="size-4 animate-spin" />
                  Wczytywanie…
                </div>
              ) : null}

              <div className="space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Konto CAS
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sv-cas-login">Login CAS</Label>
                  <p className="text-xs text-muted-foreground">
                    Może być pusty przed pierwszym połączeniem. Zapis do serwera następuje przy
                    „Połącz z CAS” (wraz z hasłem).
                  </p>
                  <Input
                    id="sv-cas-login"
                    autoComplete="username"
                    value={casLoginDraft}
                    onChange={(e) => setCasLoginDraft(e.target.value)}
                    disabled={isClient && (busy || anyCasSaving)}
                    className="max-w-md"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sv-cas-pwd">Hasło CAS</Label>
                  <Input
                    id="sv-cas-pwd"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Wpisz tylko przy łączeniu z CAS"
                    value={casPasswordDraft}
                    onChange={(e) => setCasPasswordDraft(e.target.value)}
                    disabled={isClient && (busy || casConnectSaving)}
                    className="max-w-md"
                  />
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                  {hasServerCasLogin ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto"
                      disabled={isClient && (busy || anyCasSaving)}
                      onClick={() => void onDetachCas()}
                    >
                      {casDetachSaving ? <Loader2Icon className="size-4 animate-spin" /> : null}
                      <span className={cn(casDetachSaving ? "ml-2" : "")}>Odepnij CAS</span>
                    </Button>
                  ) : null}
                  {showConnectCas ? (
                    <Button
                      type="button"
                      size="sm"
                      className="w-full sm:w-auto"
                      disabled={isClient && (busy || anyCasSaving)}
                      onClick={() => void onConnectCas()}
                    >
                      {casConnectSaving ? <Loader2Icon className="size-4 animate-spin" /> : null}
                      <span className={cn(casConnectSaving ? "ml-2" : "")}>Połącz z CAS</span>
                    </Button>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                  <span>Połączenie z CAS:</span>
                  <BoolBadge value={access?.isCasConnected} />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  TEAM
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex flex-col gap-1 rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <span className="text-xs font-medium text-muted-foreground sm:text-sm">Terytorium</span>
                    <span className="text-sm font-medium sm:text-right">{formatText(territory?.ident)}</span>
                  </div>
                  <div className="flex flex-col gap-1 rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <span className="text-xs font-medium text-muted-foreground sm:text-sm">Obszar</span>
                    <span className="text-sm font-medium sm:text-right">{formatText(area?.ident)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg">Konfiguracja teamu</CardTitle>
              <CardDescription>
                Uprawnienia do akcji w aplikacji (edycja, dodawanie, usuwanie)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="text-sm font-medium">Edycja akcji</div>
                    <p className="text-xs text-muted-foreground">Czy brandmasterzy mogą edytować akcje</p>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {actionSavingKey === "isEditingAllowed" ? (
                      <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
                    ) : null}
                    <Switch
                      checked={!!actions?.isEditingAllowed}
                      disabled={isClient && (busy || anyActionSaving)}
                      onCheckedChange={(v) => void onActionToggle("isEditingAllowed", v === true)}
                      aria-label="Zezwól na edycję akcji"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="text-sm font-medium">Dodawanie akcji</div>
                    <p className="text-xs text-muted-foreground">Czy można dodawać nowe akcje</p>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {actionSavingKey === "isAddingAllowed" ? (
                      <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
                    ) : null}
                    <Switch
                      checked={!!actions?.isAddingAllowed}
                      disabled={isClient && (busy || anyActionSaving)}
                      onCheckedChange={(v) => void onActionToggle("isAddingAllowed", v === true)}
                      aria-label="Zezwól na dodawanie akcji"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="text-sm font-medium">Usuwanie akcji</div>
                    <p className="text-xs text-muted-foreground">Czy można usuwać akcje</p>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {actionSavingKey === "isDeteletingAllowed" ? (
                      <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
                    ) : null}
                    <Switch
                      checked={!!actions?.isDeteletingAllowed}
                      disabled={isClient && (busy || anyActionSaving)}
                      onCheckedChange={(v) => void onActionToggle("isDeteletingAllowed", v === true)}
                      aria-label="Zezwól na usuwanie akcji"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldIcon className="size-4 text-muted-foreground" aria-hidden />
                <CardTitle className="text-lg">Bezpieczeństwo</CardTitle>
              </div>
              <CardDescription>Hasło logowania do aplikacji</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <div className="text-sm font-medium">Wymagaj hasła</div>
                  <p className="text-xs text-muted-foreground">
                    Gdy włączone, aplikacja może wymagać podania hasła przy logowaniu
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {requirePwdSaving ? <Loader2Icon className="size-4 animate-spin text-muted-foreground" /> : null}
                  <Switch
                    checked={requirePwd}
                    disabled={isClient && (busy || requirePwdSaving)}
                    onCheckedChange={(v) => void onRequirePasswordChange(v === true)}
                    aria-label="Wymagaj hasła"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-sm font-medium">Hasło do konta</div>
                <p className="text-xs text-muted-foreground">
                  Ustaw nowe hasło logowania. Pozostaw puste, jeśli nie chcesz go teraz zmieniać.
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="sv-acc-pwd">Nowe hasło</Label>
                    <Input
                      id="sv-acc-pwd"
                      type="password"
                      autoComplete="new-password"
                      value={accountPwd}
                      onChange={(e) => setAccountPwd(e.target.value)}
                      disabled={isClient && (busy || accountPwdSaving)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sv-acc-pwd2">Powtórz hasło</Label>
                    <Input
                      id="sv-acc-pwd2"
                      type="password"
                      autoComplete="new-password"
                      value={accountPwd2}
                      onChange={(e) => setAccountPwd2(e.target.value)}
                      disabled={isClient && (busy || accountPwdSaving)}
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="w-full sm:w-auto"
                  disabled={isClient && (busy || accountPwdSaving)}
                  onClick={() => void onSaveAccountPassword()}
                >
                  {accountPwdSaving ? <Loader2Icon className="size-4 animate-spin" /> : null}
                  <span className={cn(accountPwdSaving ? "ml-2" : "")}>Zapisz hasło konta</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
