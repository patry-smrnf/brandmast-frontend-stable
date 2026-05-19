"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { isAxiosError } from "axios"
import {
  AlertTriangleIcon,
  Loader2Icon,
  MapIcon,
  SearchIcon,
  Trash2Icon,
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { brandmastApi } from "@/lib/api"
import type { ShopResponse } from "@/lib/api/generated/types"
import {
  buildShopLabel,
  formatShopCoords,
  getShopAddress,
  getShopEventName,
  getShopTourplannerIdent,
  shopMatchesQuery,
} from "@/lib/shops/shop-utils"
import { cn } from "@/lib/utils"
import { buildShopMapMarkersAndStats } from "@/app/(routes)/brandmaster/editor/editor-utils"

import { ShopCompactItem } from "../shop-table-config"

const EditorShopsMap = dynamic(
  () => import("@/app/(routes)/brandmaster/editor/shops-map").then((m) => m.EditorShopsMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[min(52dvh,380px)] items-center justify-center rounded-xl border border-border bg-muted text-sm text-muted-foreground sm:h-[min(48vh,420px)]">
        Ładowanie mapy…
      </div>
    ),
  }
)

function readApiError(err: unknown): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined
    return data?.message ?? err.message ?? "Błąd sieci."
  }
  if (err instanceof Error) return err.message
  return "Nieznany błąd."
}

export type ShopsMapViewProps = {
  shops: ShopResponse[]
  isLoading?: boolean
  onShopDeleted: (id: number) => void
}

export function ShopsMapView({ shops, isLoading, onShopDeleted }: ShopsMapViewProps) {
  const [search, setSearch] = React.useState("")
  const [selectedShop, setSelectedShop] = React.useState<ShopResponse | null>(null)
  const [confirmDelete, setConfirmDelete] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)

  const filteredShops = React.useMemo(
    () => shops.filter((s) => shopMatchesQuery(s, search)),
    [shops, search]
  )

  const shopMapBundle = React.useMemo(() => buildShopMapMarkersAndStats(shops), [shops])

  const selectedId = selectedShop?.id ?? null

  const onMarkerSelect = React.useCallback(
    (id: number) => {
      const match = shops.find((s) => (s.id ?? 0) === id) ?? null
      setSelectedShop(match)
      setConfirmDelete(false)
    },
    [shops]
  )

  React.useEffect(() => {
    if (!selectedShop) return
    const stillExists = shops.some((s) => (s.id ?? 0) === (selectedShop.id ?? 0))
    if (!stillExists) {
      setSelectedShop(null)
      setConfirmDelete(false)
    }
  }, [shops, selectedShop])

  async function onDelete() {
    const id = selectedShop?.id
    if (!id) return
    setDeleting(true)
    try {
      const res = await brandmastApi.deleteShop({ idShop: id })
      if (!res.success) {
        toast.error(res.message ?? "Nie udało się usunąć sklepu.")
        return
      }
      toast.success("Sklep został usunięty.")
      onShopDeleted(id)
      setSelectedShop(null)
      setConfirmDelete(false)
    } catch (e) {
      toast.error(readApiError(e))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
      <Card className="overflow-hidden">
        <CardHeader className="space-y-1 pb-3">
          <div className="flex items-center gap-2">
            <MapIcon className="size-4 text-muted-foreground" aria-hidden />
            <CardTitle className="text-lg">Mapa sklepów</CardTitle>
          </div>
          <CardDescription>
            Kliknij marker, aby wybrać sklep. Na mapie: {shopMapBundle.stats.onMap} /{" "}
            {shopMapBundle.stats.total}
            {shopMapBundle.stats.notOnMap > 0 ? (
              <span className="text-muted-foreground">
                {" "}
                (bez lokalizacji: {shopMapBundle.stats.notOnMap})
              </span>
            ) : null}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <EditorShopsMap
            markers={shopMapBundle.markers}
            selectedShopId={selectedId}
            onMarkerSelect={onMarkerSelect}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-1 pb-3">
          <CardTitle className="text-lg">Wybrany sklep</CardTitle>
          <CardDescription>Wyszukaj na liście lub wybierz z mapy</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <SearchIcon
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              type="search"
              placeholder="Szukaj po nazwie, adresie, evencie…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              autoComplete="off"
            />
          </div>

          <div className="max-h-[220px] overflow-auto rounded-xl border border-border/80 bg-muted/20">
            {filteredShops.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">Brak wyników.</p>
            ) : (
              <ul className="divide-y divide-border/60">
                {filteredShops.map((shop, index) => {
                  const isSelected = (selectedShop?.id ?? 0) === (shop.id ?? 0)
                  return (
                    <li key={String(shop.id ?? `shop-${index}`)}>
                      <button
                        type="button"
                        className="w-full text-left"
                        onClick={() => {
                          setSelectedShop(shop)
                          setConfirmDelete(false)
                        }}
                      >
                        <ShopCompactItem shop={shop} selected={isSelected} />
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <Separator />

          {selectedShop ? (
            <div className="space-y-4">
              <div className="space-y-3 rounded-lg border border-border/70 bg-muted/25 p-3">
                <DetailRow label="Nazwa" value={selectedShop.name?.trim() || "-"} />
                <DetailRow label="Adres" value={getShopAddress(selectedShop) || "-"} />
                <DetailRow label="Event" value={getShopEventName(selectedShop) || "-"} />
                <DetailRow
                  label="Tourplanner"
                  value={getShopTourplannerIdent(selectedShop) || "-"}
                />
                <DetailRow label="GPS" value={formatShopCoords(selectedShop)} mono />
                <DetailRow label="ID" value={String(selectedShop.id ?? "-")} mono />
              </div>

              {!confirmDelete ? (
                <Button
                  type="button"
                  variant="destructive"
                  className="w-full gap-2"
                  disabled={deleting}
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2Icon className="size-4" aria-hidden />
                  Usuń sklep z bazy
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
                      <span className="font-medium">{buildShopLabel(selectedShop)}</span>? Tej
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
              Wybierz sklep z listy lub mapy.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
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
