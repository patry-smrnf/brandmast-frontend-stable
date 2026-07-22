"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { ShieldAlertIcon } from "lucide-react"
import { AlertDialog } from "radix-ui"

import { Button } from "@/components/ui/button"
import { forceLogout, subscribeAuthSessionError } from "@/lib/api"
import { cn } from "@/lib/utils"

export function AuthSessionDialog() {
  const pathname = usePathname()
  const [open, setOpen] = React.useState(false)
  const [message, setMessage] = React.useState(
    "Sesja wygasła lub token jest nieprawidłowy."
  )

  React.useEffect(() => {
    return subscribeAuthSessionError((payload) => {
      if (pathname === "/login" || pathname === "/no-access") return
      setMessage(payload.message)
      setOpen(true)
    })
  }, [pathname])

  if (pathname === "/login" || pathname === "/no-access") return null

  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(next) => {
        // Keep open until user picks an action — closing would leave them stuck.
        if (next) setOpen(true)
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Overlay
          className={cn(
            "fixed inset-0 z-60 bg-black/50 backdrop-blur-[1px]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          )}
        />
        <AlertDialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-60 grid w-[calc(100vw-1.5rem)] max-w-md -translate-x-1/2 -translate-y-1/2 gap-0 overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-md outline-none",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          )}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <div className="flex gap-3 border-b border-border/60 bg-muted/30 p-4 sm:p-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background shadow-sm">
              <ShieldAlertIcon className="size-5 text-destructive" aria-hidden />
            </div>
            <div className="min-w-0 space-y-1.5 pt-0.5">
              <AlertDialog.Title className="text-base font-semibold leading-tight tracking-tight sm:text-lg">
                Problem z sesją
              </AlertDialog.Title>
              <AlertDialog.Description className="text-sm leading-relaxed text-muted-foreground">
                {message}
              </AlertDialog.Description>
            </div>
          </div>
          <div className="flex flex-col gap-2 border-t border-border/60 bg-card p-4 sm:p-5">
            <Button
              type="button"
              className="w-full"
              onClick={() => {
                window.location.reload()
              }}
            >
              Ponowna próba załadowania strony
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="w-full"
              onClick={() => {
                forceLogout()
              }}
            >
              Wyloguj na siłę
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
