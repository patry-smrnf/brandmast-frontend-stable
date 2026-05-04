"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

type DayPillProps = {
  date: Date
  isActive: boolean
  hasAction: boolean
  onClick: () => void
}

export function DayPill({ date, isActive, hasAction, onClick }: DayPillProps) {
  const weekday = new Intl.DateTimeFormat("pl-PL", { weekday: "short" }).format(date)
  const day = new Intl.DateTimeFormat("pl-PL", { day: "2-digit" }).format(date)
  const startRef = React.useRef<{ x: number; y: number } | null>(null)
  const movedRef = React.useRef(false)

  return (
    <button
      type="button"
      onPointerDown={(e) => {
        try {
          e.currentTarget.setPointerCapture(e.pointerId)
        } catch {
          // ignore (older browsers / already captured)
        }
        startRef.current = { x: e.clientX, y: e.clientY }
        movedRef.current = false
      }}
      onPointerMove={(e) => {
        const start = startRef.current
        if (!start) return
        const dx = Math.abs(e.clientX - start.x)
        const dy = Math.abs(e.clientY - start.y)
        if (dx > 8 || dy > 8) movedRef.current = true
      }}
      onPointerUp={(e) => {
        if (movedRef.current) return
        e.preventDefault()
        onClick()
      }}
      onPointerCancel={() => {
        startRef.current = null
        movedRef.current = false
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onClick()
        }
      }}
      className={cn(
        "relative flex w-[78px] shrink-0 touch-manipulation flex-col items-center justify-center gap-1 rounded-2xl border border-border bg-card px-3 py-3 text-center transition-colors",
        isActive ? "text-foreground bg-gray-900 " : "text-muted-foreground hover:text-foreground",
        !isActive && hasAction ? "border-accent bg-accent/90 text-foreground hover:bg-accent/70" : null
      )}
    >
      {isActive ? (
        <span className="absolute left-2 top-1/2 h-7 w-1 -translate-y-1/2 rounded-full bg-accent" />
      ) : null}
      <div className="text-xs font-medium uppercase tracking-wide">{weekday}</div>
      <div className="text-lg font-semibold leading-none tabular-nums">{day}</div>
    </button>
  )
}

