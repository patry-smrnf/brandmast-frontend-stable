"use client"

import * as React from "react"
import { CheckIcon, MinusIcon } from "lucide-react"

import { cn } from "@/lib/utils"

export type CheckboxProps = Omit<React.ComponentProps<"button">, "onChange"> & {
  checked?: boolean | "indeterminate"
  disabled?: boolean
  onCheckedChange?: (checked: boolean | "indeterminate") => void
}

function nextChecked(current: boolean | "indeterminate" | undefined) {
  if (current === "indeterminate") return true
  return !current
}

export function Checkbox({
  className,
  checked = false,
  disabled,
  onCheckedChange,
  ...props
}: CheckboxProps) {
  const isIndeterminate = checked === "indeterminate"
  const isChecked = checked === true

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={isIndeterminate ? "mixed" : isChecked}
      disabled={disabled}
      onClick={(e) => {
        props.onClick?.(e)
        if (e.defaultPrevented) return
        if (disabled) return
        onCheckedChange?.(nextChecked(checked))
      }}
      className={cn(
        "inline-flex size-5 items-center justify-center rounded-md border border-border bg-background shadow-xs transition-colors",
        "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        disabled ? "cursor-not-allowed opacity-50" : "hover:bg-muted",
        isChecked || isIndeterminate ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90" : null,
        className
      )}
      {...props}
    >
      {isChecked ? <CheckIcon className="size-3.5" /> : isIndeterminate ? <MinusIcon className="size-3.5" /> : null}
    </button>
  )
}

