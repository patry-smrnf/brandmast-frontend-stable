"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type DiscoverFiltersDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  children: React.ReactNode
}

export function DiscoverFiltersDrawer({
  open,
  onOpenChange,
  title = "Zaawansowane filtry",
  children,
}: DiscoverFiltersDrawerProps) {
  const [entered, setEntered] = React.useState(false)
  const [portalTarget, setPortalTarget] = React.useState<HTMLElement | null>(null)

  React.useLayoutEffect(() => {
    setPortalTarget(document.body)
  }, [])

  React.useLayoutEffect(() => {
    if (!open) {
      setEntered(false)
      return
    }
    const frame = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(frame)
  }, [open])

  React.useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false)
    }
    window.addEventListener("keydown", onKeyDown)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = prev
    }
  }, [open, onOpenChange])

  if (!open || !portalTarget) return null

  return createPortal(
    <div className="fixed inset-0 z-60 flex justify-end">
      <button
        type="button"
        className={cn(
          "absolute inset-0 bg-black/40 backdrop-blur-[1px] transition-opacity duration-200",
          entered ? "opacity-100" : "opacity-0",
        )}
        aria-label="Zamknij"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="discover-filters-drawer-title"
        className={cn(
          "relative z-61 flex h-full w-full max-w-lg flex-col border-l border-border bg-card shadow-xl transition-transform duration-200 ease-out motion-reduce:transition-none",
          entered ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <h2
            id="discover-filters-drawer-title"
            className="text-sm font-semibold tracking-tight"
          >
            {title}
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => onOpenChange(false)}
            aria-label="Zamknij"
          >
            <XIcon className="size-4" />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          {children}
        </div>
      </div>
    </div>,
    portalTarget,
  )
}
