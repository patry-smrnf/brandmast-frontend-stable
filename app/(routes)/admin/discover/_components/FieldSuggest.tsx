"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { CheckIcon } from "lucide-react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  suggestFilterFields,
  type DiscoverFilterFieldOption,
} from "../discover-filters"

type FieldSuggestProps = {
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

type MenuPos = { top: number; left: number; width: number }

export function FieldSuggest({
  id,
  value,
  onChange,
  placeholder = "np. message, serviceName…",
  className,
}: FieldSuggestProps) {
  const [open, setOpen] = React.useState(false)
  const [highlight, setHighlight] = React.useState(0)
  const [pos, setPos] = React.useState<MenuPos | null>(null)
  const [mounted, setMounted] = React.useState(false)

  const rootRef = React.useRef<HTMLDivElement | null>(null)
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const menuRef = React.useRef<HTMLUListElement | null>(null)

  const suggestions = React.useMemo(() => suggestFilterFields(value), [value])

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const updatePosition = React.useCallback(() => {
    const el = inputRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const width = Math.max(rect.width, 240)
    const estimatedH = Math.min(224, Math.max(suggestions.length, 1) * 44 + 8)
    const spaceBelow = window.innerHeight - rect.bottom
    const openUp = spaceBelow < estimatedH + 12 && rect.top > spaceBelow
    setPos({
      top: openUp ? rect.top - estimatedH - 6 : rect.bottom + 6,
      left: Math.min(rect.left, window.innerWidth - width - 8),
      width,
    })
  }, [suggestions.length])

  React.useEffect(() => {
    if (!open) return
    updatePosition()
    setHighlight(0)

    function onReposition() {
      updatePosition()
    }

    window.addEventListener("resize", onReposition)
    window.addEventListener("scroll", onReposition, true)
    return () => {
      window.removeEventListener("resize", onReposition)
      window.removeEventListener("scroll", onReposition, true)
    }
  }, [open, updatePosition, value])

  React.useEffect(() => {
    if (!open) return

    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node | null
      if (!target) return
      if (rootRef.current?.contains(target)) return
      if (menuRef.current?.contains(target)) return
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

  function pick(option: DiscoverFilterFieldOption) {
    onChange(option.id === "details." ? "details." : option.id)
    setOpen(false)
    inputRef.current?.focus()
  }

  function openMenu() {
    setOpen(true)
    requestAnimationFrame(updatePosition)
  }

  const menu =
    mounted && open && pos && suggestions.length > 0
      ? createPortal(
          <ul
            ref={menuRef}
            role="listbox"
            className="fixed z-[200] max-h-56 overflow-auto rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg"
            style={{
              top: pos.top,
              left: pos.left,
              width: pos.width,
            }}
          >
            {suggestions.map((option, index) => {
              const active = index === highlight
              const selected = value === option.id
              return (
                <li key={option.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={cn(
                      "flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left transition-colors",
                      active ? "bg-muted" : "hover:bg-muted/70",
                    )}
                    onMouseEnter={() => setHighlight(index)}
                    // prevent input blur before click registers
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(option)}
                  >
                    <span className="mt-0.5 flex w-3.5 shrink-0 justify-center">
                      {selected ? <CheckIcon className="size-3.5 text-primary" /> : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-mono text-xs text-foreground">
                        {option.label}
                      </span>
                      <span className="block text-[10px] leading-snug text-muted-foreground">
                        {option.description}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>,
          document.body,
        )
      : null

  return (
    <div ref={rootRef} className={cn("relative min-w-0", className)}>
      <Input
        ref={inputRef}
        id={id}
        value={value}
        autoComplete="off"
        spellCheck={false}
        placeholder={placeholder}
        className="h-9 font-mono text-xs"
        onFocus={openMenu}
        onClick={openMenu}
        onChange={(e) => {
          onChange(e.target.value)
          openMenu()
        }}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            e.preventDefault()
            openMenu()
            return
          }
          if (!open) return
          if (e.key === "ArrowDown") {
            e.preventDefault()
            setHighlight((i) => Math.min(i + 1, Math.max(suggestions.length - 1, 0)))
          } else if (e.key === "ArrowUp") {
            e.preventDefault()
            setHighlight((i) => Math.max(i - 1, 0))
          } else if (e.key === "Enter" && suggestions[highlight]) {
            e.preventDefault()
            pick(suggestions[highlight])
          } else if (e.key === "Escape") {
            setOpen(false)
          }
        }}
        aria-autocomplete="list"
        aria-expanded={open}
      />
      {menu}
    </div>
  )
}
