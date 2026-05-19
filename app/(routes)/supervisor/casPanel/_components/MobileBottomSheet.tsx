"use client"

import * as React from "react"
import { createPortal } from "react-dom"

import { cn } from "@/lib/utils"

export type MobileBottomSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  titleId: string
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  dismissible?: boolean
}

export function MobileBottomSheet({
  open,
  onOpenChange,
  titleId,
  title,
  description,
  children,
  footer,
  dismissible = true,
}: MobileBottomSheetProps) {
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
      if (e.key === "Escape" && dismissible) onOpenChange(false)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open, dismissible, onOpenChange])

  if (!open || !portalTarget) return null

  return createPortal(
    <div className="fixed inset-0 z-60 flex flex-col justify-end sm:justify-center">
      <button
        type="button"
        className={cn(
          "absolute inset-0 bg-black/45 backdrop-blur-[1px] transition-opacity duration-300",
          entered ? "opacity-100" : "opacity-0",
        )}
        aria-label="Zamknij"
        onClick={() => dismissible && onOpenChange(false)}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative z-61 flex max-h-[min(92dvh,720px)] w-full flex-col rounded-t-2xl border border-border bg-card text-card-foreground shadow-[0_-8px_32px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out motion-reduce:transition-none",
          "sm:mx-auto sm:mb-4 sm:max-w-lg sm:rounded-2xl sm:shadow-lg",
          entered ? "translate-y-0" : "translate-y-full sm:translate-y-4 sm:scale-[0.98] sm:opacity-0",
        )}
      >
        <SheetDragHandle />

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1 sm:max-h-[min(85vh,720px)] sm:px-4 sm:pb-4 sm:pt-2.5">
          <div className="space-y-0.5">
            <h2 id={titleId} className="text-base font-semibold tracking-tight text-foreground">
              {title}
            </h2>
            {description ? (
              <p className="text-xs leading-snug text-muted-foreground">{description}</p>
            ) : null}
          </div>

          {children}

          {footer ? <div className="mt-auto space-y-2 pt-1">{footer}</div> : null}
        </div>
      </div>
    </div>,
    portalTarget,
  )
}

function SheetDragHandle() {
  return (
    <div className="flex shrink-0 justify-center pt-2 pb-0.5 sm:hidden" aria-hidden>
      <div className="h-1 w-9 rounded-full bg-muted-foreground/25" />
    </div>
  )
}
