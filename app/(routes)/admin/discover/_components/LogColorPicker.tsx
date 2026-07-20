"use client"

import * as React from "react"
import { CheckIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  LOG_MARK_COLORS,
  LOG_MARK_COLOR_CLASS,
  type LogMarkColor,
} from "../discover-utils"

type LogColorPickerProps = {
  value: LogMarkColor | null
  onChange: (color: LogMarkColor | null) => void
  className?: string
}

export function LogColorPicker({ value, onChange, className }: LogColorPickerProps) {
  const [open, setOpen] = React.useState(false)
  const rootRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    if (!open) return

    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node | null
      if (!target || rootRef.current?.contains(target)) return
      setOpen(false)
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }

    window.addEventListener("pointerdown", onPointerDown, true)
    window.addEventListener("keydown", onKeyDown)
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, true)
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        title={value ? `Kolor: ${value}` : "Oznacz kolorem"}
        aria-label={value ? `Kolor logu: ${value}` : "Oznacz log kolorem"}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        className={cn(
          "flex size-7 items-center justify-center rounded-md border border-border/80 bg-background/60 transition-colors hover:bg-muted",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none",
        )}
      >
        <span
          className={cn(
            "size-3.5 rounded-full border border-border",
            value ? LOG_MARK_COLOR_CLASS[value].swatch : "bg-transparent",
          )}
        />
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label="Kolor oznaczenia"
          className="absolute left-0 top-full z-30 mt-1 flex w-max flex-wrap gap-1 rounded-xl border border-border bg-popover p-2 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            title="Usuń kolor"
            aria-label="Usuń kolor"
            onClick={() => {
              onChange(null)
              setOpen(false)
            }}
          >
            <XIcon className="size-3.5" />
          </Button>
          {LOG_MARK_COLORS.map((color) => {
            const selected = value === color
            return (
              <button
                key={color}
                type="button"
                role="option"
                aria-selected={selected}
                title={color}
                onClick={() => {
                  onChange(color)
                  setOpen(false)
                }}
                className={cn(
                  "relative flex size-7 items-center justify-center rounded-md transition-colors hover:bg-muted",
                  selected && "ring-2 ring-ring/60",
                )}
              >
                <span className={cn("size-3.5 rounded-full", LOG_MARK_COLOR_CLASS[color].swatch)} />
                {selected ? (
                  <CheckIcon className="absolute size-2.5 text-white drop-shadow" />
                ) : null}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
