"use client"

import * as React from "react"
import { isAxiosError } from "axios"
import {
  AlertTriangleIcon,
  Loader2Icon,
  Trash2Icon,
  UserIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { brandmastApi } from "@/lib/api"
import type { BrandmastersResponse } from "@/lib/api/generated/types"
import {
  buildBrandmasterLabel,
  getBrandmasterFullName,
  getBrandmasterTpEmail,
  getBrandmasterTpUuid,
} from "@/lib/brandmasters/brandmaster-utils"
import { cn } from "@/lib/utils"

function readApiError(err: unknown): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined
    return data?.message ?? err.message ?? "Błąd sieci."
  }
  if (err instanceof Error) return err.message
  return "Nieznany błąd."
}

export type BrandmastersDetailPanelProps = {
  selected: BrandmastersResponse | null
  onDeleted: (id: number) => void
}

export function BrandmastersDetailPanel({ selected, onDeleted }: BrandmastersDetailPanelProps) {
  const [confirmDelete, setConfirmDelete] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)

  React.useEffect(() => {
    setConfirmDelete(false)
  }, [selected?.brandmasterId])

  async function onDelete() {
    const id = selected?.brandmasterId
    if (!id) {
      toast.error("Brak identyfikatora brandmastera - odśwież listę.")
      return
    }
    setDeleting(true)
    try {
      const res = await brandmastApi.deleteBrandmaster({ brandmasterId: id })
      if (!res.success) {
        toast.error(res.message ?? "Nie udało się usunąć brandmastera.")
        return
      }
      toast.success("Brandmaster został usunięty.")
      onDeleted(id)
      setConfirmDelete(false)
    } catch (e) {
      toast.error(readApiError(e))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Card className="lg:sticky lg:top-6">
      <CardHeader className="space-y-1 pb-3">
        <div className="flex items-center gap-2">
          <UserIcon className="size-4 text-muted-foreground" aria-hidden />
          <CardTitle className="text-lg">Wybrany brandmaster</CardTitle>
        </div>
        <CardDescription>Kliknij wiersz na liście, aby zobaczyć szczegóły</CardDescription>
      </CardHeader>
      <CardContent>
        {selected ? (
          <div className="space-y-4">
            <div className="space-y-3 rounded-lg border border-border/70 bg-muted/25 p-3">
              <DetailRow label="Imię i nazwisko" value={getBrandmasterFullName(selected) || "-"} />
              <DetailRow label="Login" value={selected.login?.trim() || "-"} mono />
              <DetailRow label="E-mail (TP)" value={getBrandmasterTpEmail(selected) || "-"} />
              <DetailRow
                label="Kasoterminal"
                value={selected.kasoterminal != null ? String(selected.kasoterminal) : "-"}
                mono
              />
              <DetailRow label="121" value={selected.has121 ? "Tak" : "Nie"} />
              <DetailRow label="Tourplanner UUID" value={getBrandmasterTpUuid(selected) || "-"} mono />
              <DetailRow
                label="ID"
                value={selected.brandmasterId != null ? String(selected.brandmasterId) : "-"}
                mono
              />
            </div>

            {!confirmDelete ? (
              <Button
                type="button"
                variant="destructive"
                className="w-full gap-2"
                disabled={deleting || selected.brandmasterId == null}
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2Icon className="size-4" aria-hidden />
                Usuń brandmastera z zespołu
              </Button>
            ) : (
              <div
                role="alert"
                className="space-y-3 rounded-lg border border-destructive/40 bg-destructive/8 p-3"
              >
                <div className="flex gap-2">
                  <AlertTriangleIcon className="size-4 shrink-0 text-destructive" aria-hidden />
                  <p className="text-sm text-foreground">
                    Na pewno usunąć{" "}
                    <span className="font-medium">{buildBrandmasterLabel(selected)}</span>? Tej
                    operacji nie można cofnąć.
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:flex-1"
                    disabled={deleting}
                    onClick={() => setConfirmDelete(false)}
                  >
                    Anuluj
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    className="w-full gap-2 sm:flex-1"
                    disabled={deleting}
                    onClick={() => void onDelete()}
                  >
                    {deleting ? (
                      <Loader2Icon className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <Trash2Icon className="size-4" aria-hidden />
                    )}
                    Potwierdź usunięcie
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-border/80 bg-muted/30 px-3 py-8 text-center text-sm text-muted-foreground">
            Wybierz brandmastera z listy.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <span
        className={cn(
          "text-sm font-medium sm:text-right",
          mono ? "font-mono text-xs tabular-nums" : null
        )}
      >
        {value}
      </span>
    </div>
  )
}
