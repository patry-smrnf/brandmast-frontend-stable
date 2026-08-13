"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { Loader2Icon } from "lucide-react"

import { needsBrandmasterConsent, useConfigState } from "@/lib/config"

import { BrandmasterZgodyView } from "./zgody/zgody-view"

const ZGODY_PATH = "/brandmaster/zgody"

function ConsentGateLoading() {
  return (
    <main className="flex flex-1 items-center justify-center bg-background px-4 py-10">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2Icon className="size-4 animate-spin" />
        Wczytywanie…
      </div>
    </main>
  )
}

export function BrandmasterConsentGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { config, status } = useConfigState()
  const needsConsent = needsBrandmasterConsent(config)
  const waitingForConfig = !config && status !== "error"

  React.useEffect(() => {
    if (waitingForConfig) return
    if (needsConsent && pathname !== ZGODY_PATH) {
      router.replace(ZGODY_PATH)
      return
    }
    if (!needsConsent && pathname === ZGODY_PATH) {
      router.replace("/brandmaster")
    }
  }, [needsConsent, pathname, router, waitingForConfig])

  if (waitingForConfig) {
    return <ConsentGateLoading />
  }

  if (needsConsent) {
    return <BrandmasterZgodyView />
  }

  if (pathname === ZGODY_PATH) {
    return <ConsentGateLoading />
  }

  return children
}
