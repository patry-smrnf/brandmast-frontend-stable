import type { ReactNode } from "react"
import { BrandmasterTheme } from "./brandmaster-theme"

export default function BrandmasterLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return <BrandmasterTheme>{children}</BrandmasterTheme>
}
