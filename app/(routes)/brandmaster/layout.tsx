import type { ReactNode } from "react"
import { BrandmasterConsentGate } from "./brandmaster-consent-gate"
import { BrandmasterTheme } from "./brandmaster-theme"

export default function BrandmasterLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <BrandmasterTheme>
      <BrandmasterConsentGate>{children}</BrandmasterConsentGate>
    </BrandmasterTheme>
  )
}
