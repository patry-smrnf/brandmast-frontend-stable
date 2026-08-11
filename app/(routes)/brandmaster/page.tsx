"use client"

import { isCasConnected, useConfigState } from "@/lib/config"

import { BrandmasterCasHome } from "./brandmaster-cas-home"
import { BrandmasterNoCasHome } from "./brandmaster-no-cas-home"
import { BrandmasterPageSkeleton } from "./brandmaster-page-skeleton"

export default function BrandmasterPage() {
  const { config, status } = useConfigState()

  // Wait for config before choosing CAS vs non-CAS home (avoids view flash).
  // Keep showing skeleton only when we still have no config at all.
  if (!config && status !== "error") {
    return (
      <main className="flex-1 bg-background">
        <div className="mx-auto w-full max-w-lg px-3 py-5 sm:max-w-xl sm:px-4 sm:py-6">
          <BrandmasterPageSkeleton />
        </div>
      </main>
    )
  }

  if (!config || !isCasConnected()) {
    return <BrandmasterNoCasHome />
  }

  return <BrandmasterCasHome />
}
