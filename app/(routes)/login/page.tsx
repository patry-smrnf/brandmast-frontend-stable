"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { isAxiosError } from "axios"

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
import { brandmastApi, roleStore, tokenStore, type UserRole } from "@/lib/api"

export default function LoginPage() {
  const router = useRouter()

  const [login, setLogin] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canSubmit = useMemo(() => {
    if (login.trim().length === 0) return false
    if (showPassword && password.trim().length === 0) return false
    return true
  }, [login, password, showPassword])
  const isSubmitDisabled = !canSubmit || isSubmitting

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const normalizedLogin = login.trim()
    const normalizedPassword = password.trim()

    if (!normalizedLogin) {
      toast.error("Podaj login.")
      return
    }
    if (showPassword && !normalizedPassword) {
      toast.error("Podaj hasło.")
      return
    }

    setIsSubmitting(true)
    const toastId = toast.loading("Logowanie…")
    try {
      const res = await brandmastApi.login({
        login: normalizedLogin,
        ...(showPassword ? { password: normalizedPassword } : {}),
      })

      if (res.success) {
        const token = res.data?.token
        if (token) tokenStore.set(token)
        const role = res.data?.accountDetails?.role
        if (role === "brandmaster" || role === "supervisor") {
          roleStore.set(role satisfies UserRole)
        } else {
          roleStore.clear()
        }
        toast.success("Zalogowano.", { id: toastId })
        router.push("/")
        return
      }

      const isPasswordRequired =
        res.errorCode === "validation.business" &&
        res.message === "Password is required"

      if (isPasswordRequired) {
        setShowPassword(true)
        toast.info("To konto wymaga hasła — wpisz je i spróbuj ponownie.", {
          id: toastId,
        })
        return
      }

      toast.error(res.message ?? "Nie udało się zalogować.", { id: toastId })
    } catch (err) {
      if (isAxiosError(err)) {
        const maybeData = err.response?.data as
          | { errorCode?: string; message?: string; success?: boolean }
          | undefined

        const isPasswordRequired =
          maybeData?.errorCode === "validation.business" &&
          maybeData?.message === "Password is required"

        if (isPasswordRequired) {
          setShowPassword(true)
          toast.info("To konto wymaga hasła — wpisz je i spróbuj ponownie.", {
            id: toastId,
          })
          return
        }

        toast.error(maybeData?.message ?? "Nie udało się zalogować.", {
          id: toastId,
        })
        return
      }

      toast.error("Błąd sieci podczas logowania.", { id: toastId })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <Card className="shadow-md">
          <CardHeader className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2">
                <div className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
                  <span className="text-sm font-semibold tracking-tight">:p</span>
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-semibold">Brandmastuj</div>
                  <div className="text-xs text-muted-foreground"> Stable
                  </div>
                </div>
              </div>
            </div>

            <div>
              <CardTitle>Login</CardTitle>
              <CardDescription>
                Uzyj swoj login PLH i ewentualnie haslo
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-1.5">
                <Label htmlFor="login">Login</Label>
                <Input
                  id="login"
                  name="login"
                  type="text"
                  placeholder="PLH0000"
                  autoComplete="login"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                />
              </div>

              {showPassword ? (
                <div className="space-y-1.5">
                  <Label htmlFor="password">Hasło</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              ) : null}

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitDisabled}
                suppressHydrationWarning
              >
                Zaloguj
              </Button>
            </form>

            <div className="space-y-4">
              <p className="text-center text-xs text-muted-foreground">
                Nie masz konta?{" "}
                <Link
                  href="#"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Skontaktuj sie ze mna na whatsapp 
                </Link>
                .
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Brandmastuj. Wszelkie prawa ukradzione.
        </p>
      </div>
    </div>
  )
}
