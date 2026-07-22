"use client"

import * as React from "react"
import { Loader2Icon, SearchIcon, XIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { brandmastApi, getApiErrorMessage, type BrandmastersResponse } from "@/lib/api"

type FindBrandmasterDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Optional: apply found login as Discover details filter. */
  onUseLogin?: (login: string) => void
}

export function FindBrandmasterDialog({
  open,
  onOpenChange,
  onUseLogin,
}: FindBrandmasterDialogProps) {
  const [login, setLogin] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [result, setResult] = React.useState<BrandmastersResponse | null>(null)
  const inputRef = React.useRef<HTMLInputElement | null>(null)

  React.useEffect(() => {
    if (!open) return
    setLogin("")
    setError(null)
    setResult(null)
    setLoading(false)
    const id = window.setTimeout(() => inputRef.current?.focus(), 50)
    return () => window.clearTimeout(id)
  }, [open])

  React.useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open, onOpenChange])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = login.trim()
    if (!q) {
      setError("Podaj login.")
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await brandmastApi.fetchAdminBrandmaster(q)
      if (res.success === false) {
        throw new Error(res.message || res.errorCode || "Nie znaleziono brandmastera")
      }
      if (!res.data) {
        throw new Error("Brak danych brandmastera.")
      }
      setResult(res.data)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  const foundLogin = result?.login?.trim()

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-[1px] sm:items-center sm:pb-4"
      role="presentation"
      onClick={() => onOpenChange(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="find-bm-title"
        className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-lg sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <h2 id="find-bm-title" className="text-base font-semibold tracking-tight">
              Znajdź BM
            </h2>
            <p className="text-xs text-muted-foreground">
              Wyszukaj brandmastera po loginie (admin).
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="Zamknij"
            onClick={() => onOpenChange(false)}
          >
            <XIcon className="size-3.5" />
          </Button>
        </div>

        <form className="mt-4 space-y-3" onSubmit={(e) => void onSubmit(e)}>
          <div className="space-y-1.5">
            <Label htmlFor="find-bm-login" className="text-xs text-muted-foreground">
              Login
            </Label>
            <Input
              ref={inputRef}
              id="find-bm-login"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="np. jan.kowalski"
              className="h-9 font-mono text-xs"
              autoComplete="off"
              spellCheck={false}
              disabled={loading}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm" disabled={loading || !login.trim()}>
              {loading ? (
                <Loader2Icon data-icon="inline-start" className="animate-spin" />
              ) : (
                <SearchIcon data-icon="inline-start" />
              )}
              Szukaj
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => onOpenChange(false)}
            >
              Anuluj
            </Button>
          </div>
        </form>

        {error ? (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {result ? (
          <div className="mt-4 space-y-3 rounded-xl border border-border/80 bg-muted/20 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-foreground">
                {[result.name, result.surname].filter(Boolean).join(" ") || "—"}
              </p>
              {result.has121 != null ? (
                <Badge variant={result.has121 ? "success" : "outline"} className="text-[10px]">
                  121 {result.has121 ? "tak" : "nie"}
                </Badge>
              ) : null}
            </div>
            <dl className="grid gap-2 text-xs sm:grid-cols-2">
              <Field label="login" value={result.login} mono />
              <Field
                label="brandmasterId"
                value={result.brandmasterId != null ? String(result.brandmasterId) : null}
                mono
              />
              <Field
                label="kasoterminal"
                value={result.kasoterminal != null ? String(result.kasoterminal) : null}
                mono
              />
              <Field label="TP uuid" value={result.tourplannerData?.uuid} mono />
              <Field
                label="TP email"
                value={result.tourplannerData?.email}
                className="sm:col-span-2"
              />
            </dl>
            {foundLogin && onUseLogin ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="w-full sm:w-auto"
                onClick={() => {
                  onUseLogin(foundLogin)
                  onOpenChange(false)
                }}
              >
                Filtruj logi po tym loginie
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  mono,
  className,
}: {
  label: string
  value?: string | null
  mono?: boolean
  className?: string
}) {
  return (
    <div className={className}>
      <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd
        className={
          mono
            ? "mt-0.5 break-all font-mono text-foreground"
            : "mt-0.5 break-all text-foreground"
        }
      >
        {value?.trim() ? value : "—"}
      </dd>
    </div>
  )
}
