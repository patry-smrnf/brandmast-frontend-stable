"use client"

import * as React from "react"

/** false on server and on the first client render — avoids hydration mismatches for client-only UI. */
export function useIsClient() {
  return React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
}
