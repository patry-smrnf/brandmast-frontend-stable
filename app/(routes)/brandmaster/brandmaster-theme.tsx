"use client"

import * as React from "react"

/** Brandmaster shell -inherits global dark theme tokens. */
export function BrandmasterTheme({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-background text-foreground">
      {children}
    </div>
  )
}
