"use client"

import { UserIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { DataColumn } from "@/components/data-display"
import type { BrandmastersResponse } from "@/lib/api/generated/types"
import {
  getBrandmasterFullName,
  getBrandmasterRowKey,
  getBrandmasterTpEmail,
  getBrandmasterTpUuid,
} from "@/lib/brandmasters/brandmaster-utils"
import { cn } from "@/lib/utils"

export { getBrandmasterRowKey }

export const brandmasterTableColumns: DataColumn<BrandmastersResponse>[] = [
  {
    id: "name",
    header: "Imię i nazwisko",
    cell: (bm) => {
      const full = getBrandmasterFullName(bm)
      return full ? (
        <span className="font-medium">{full}</span>
      ) : (
        <span className="text-muted-foreground">—</span>
      )
    },
  },
  {
    id: "login",
    header: "Login",
    cell: (bm) =>
      bm.login?.trim() ? (
        <span className="font-mono text-xs">{bm.login.trim()}</span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    id: "email",
    header: "E-mail (TP)",
    cell: (bm) => {
      const email = getBrandmasterTpEmail(bm)
      return email ? (
        <span className="line-clamp-1 max-w-xs text-sm">{email}</span>
      ) : (
        <span className="text-muted-foreground">—</span>
      )
    },
  },
  {
    id: "kasoterminal",
    header: "Kasoterminal",
    cell: (bm) =>
      bm.kasoterminal != null ? (
        <span className="tabular-nums">{bm.kasoterminal}</span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    id: "121",
    header: "121",
    cell: (bm) =>
      bm.has121 ? (
        <Badge variant="secondary" className="font-normal">
          Tak
        </Badge>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    id: "tp",
    header: "Tourplanner UUID",
    cell: (bm) => {
      const uuid = getBrandmasterTpUuid(bm)
      return uuid ? (
        <span className="max-w-[10rem] truncate font-mono text-xs" title={uuid}>
          {uuid}
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      )
    },
  },
]

export type BrandmasterCompactItemProps = {
  brandmaster: BrandmastersResponse
  selected?: boolean
}

export function BrandmasterCompactItem({ brandmaster, selected }: BrandmasterCompactItemProps) {
  const fullName = getBrandmasterFullName(brandmaster)
  const login = brandmaster.login?.trim()
  const title = fullName || login || "Brandmaster bez nazwy"
  const subtitle = fullName && login ? login : getBrandmasterTpEmail(brandmaster) || null

  return (
    <div
      className={cn(
        "flex w-full items-start gap-2.5 px-3 py-2.5",
        selected ? "bg-accent/50" : null
      )}
    >
      <UserIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 truncate text-sm font-medium leading-tight">{title}</p>
          {brandmaster.has121 ? (
            <Badge variant="outline" className="shrink-0 text-[10px] font-normal">
              121
            </Badge>
          ) : null}
        </div>
        {subtitle ? (
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
    </div>
  )
}
