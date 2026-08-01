"use client"

import * as React from "react"
import {
  AlertTriangleIcon,
  CameraIcon,
  CheckIcon,
  ImageIcon,
  Loader2Icon,
  RefreshCwIcon,
  Trash2Icon,
} from "lucide-react"
import { isAxiosError } from "axios"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { brandmastApi } from "@/lib/api"
import { cn } from "@/lib/utils"

import { getRegionLabel } from "../121Sampling/121-sampling-utils"
import { use121ResolvedTeam } from "../121Sampling/use-121-resolved-team"

function readApiError(err: unknown): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined
    return data?.message ?? err.message ?? "Błąd sieci."
  }
  if (err instanceof Error) return err.message
  return "Nieznany błąd."
}

function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "—"
  const kb = bytes / 1024
  if (kb < 1024) return `${Math.round(kb)} KB`
  const mb = kb / 1024
  return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`
}

function DevicePhotoField({
  photo,
  photoUrl,
  isUploading,
  uploadError,
  onPhotoChange,
}: {
  photo: File | null
  photoUrl: string | null
  isUploading: boolean
  uploadError: string | null
  onPhotoChange: (file: File | null) => void
}) {
  const cameraInputRef = React.useRef<HTMLInputElement | null>(null)
  const galleryInputRef = React.useRef<HTMLInputElement | null>(null)

  function onPickFile(file: File | null, input?: HTMLInputElement | null) {
    if (!file) return
    if (!file.type.startsWith("image/")) return
    onPhotoChange(file)
    if (input) input.value = ""
  }

  if (photoUrl && photo) {
    return (
      <div className="space-y-2">
        <div className="overflow-hidden rounded-2xl bg-primary/5 shadow-sm ring-1 ring-primary/20">
          <div className="relative min-h-[min(52dvh,18rem)] w-full bg-muted/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoUrl}
              alt="Podgląd zdjęcia urządzenia"
              className="absolute inset-0 h-full w-full object-contain"
            />
            <div className="absolute left-3 top-3">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium shadow-sm backdrop-blur-sm",
                  isUploading
                    ? "border-border/70 bg-background/95 text-muted-foreground"
                    : uploadError
                      ? "border-destructive/30 bg-background/95 text-destructive"
                      : "border-primary/20 bg-background/95 text-primary",
                )}
              >
                {isUploading ? (
                  <>
                    <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
                    Przesyłanie zdjęcia…
                  </>
                ) : uploadError ? (
                  <>
                    <AlertTriangleIcon className="size-3.5" aria-hidden />
                    Błąd przesyłania
                  </>
                ) : (
                  <>
                    <CheckIcon className="size-3.5" aria-hidden />
                    Zdjęcie dodane
                  </>
                )}
              </span>
            </div>
          </div>

          <div className="space-y-2 border-t border-border/80 bg-background/80 p-3">
            <p className="truncate text-center text-[11px] text-muted-foreground">
              {photo.name} · {formatFileSize(photo.size)}
            </p>
            <div className="grid grid-cols-1 gap-2">
              <Button
                type="button"
                className="min-h-12 w-full touch-manipulation text-base active:scale-[0.99]"
                disabled={isUploading}
                onClick={() => cameraInputRef.current?.click()}
              >
                <CameraIcon className="size-4" aria-hidden />
                <span className="ml-2">Zrób nowe zdjęcie</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="min-h-12 w-full touch-manipulation text-base active:scale-[0.99]"
                disabled={isUploading}
                onClick={() => galleryInputRef.current?.click()}
              >
                <ImageIcon className="size-4" aria-hidden />
                <span className="ml-2">Wybierz inne z galerii</span>
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="min-h-12 w-full touch-manipulation text-base active:scale-[0.99]"
                disabled={isUploading}
                onClick={() => onPhotoChange(null)}
              >
                <Trash2Icon className="size-4" aria-hidden />
                <span className="ml-2">Usuń zdjęcie</span>
              </Button>
            </div>
          </div>

          <input
            ref={cameraInputRef}
            className="sr-only"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => onPickFile(e.target.files?.[0] ?? null, e.currentTarget)}
          />
          <input
            ref={galleryInputRef}
            className="sr-only"
            type="file"
            accept="image/*"
            onChange={(e) => onPickFile(e.target.files?.[0] ?? null, e.currentTarget)}
          />
        </div>
        {uploadError ? (
          <p className="text-[11px] leading-snug text-destructive">{uploadError}</p>
        ) : null}
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-dashed border-border bg-muted/15">
      <div className="flex min-h-[min(44dvh,14rem)] flex-col items-center justify-center px-4 py-6 text-center">
        <span
          className="flex size-14 items-center justify-center rounded-2xl bg-card shadow-sm ring-1 ring-border/50"
          aria-hidden
        >
          <CameraIcon className="size-7 text-muted-foreground" />
        </span>
        <p className="mt-4 text-sm font-medium">Zdjęcie urządzenia</p>
        <p className="mt-1 max-w-3xs text-xs leading-relaxed text-muted-foreground">
          Ustaw urządzenie tak, żeby numer był wyraźnie widoczny.
        </p>
      </div>

      <div className="space-y-2 border-t border-border/70 bg-background/70 p-3">
        <Button
          type="button"
          className="min-h-12 w-full touch-manipulation text-base active:scale-[0.99]"
          onClick={() => cameraInputRef.current?.click()}
        >
          <CameraIcon className="size-4" aria-hidden />
          <span className="ml-2">Zrób zdjęcie aparatem</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          className="min-h-12 w-full touch-manipulation text-base active:scale-[0.99]"
          onClick={() => galleryInputRef.current?.click()}
        >
          <ImageIcon className="size-4" aria-hidden />
          <span className="ml-2">Wybierz z galerii</span>
        </Button>
      </div>

      <input
        ref={cameraInputRef}
        className="sr-only"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => onPickFile(e.target.files?.[0] ?? null, e.currentTarget)}
      />
      <input
        ref={galleryInputRef}
        className="sr-only"
        type="file"
        accept="image/*"
        onChange={(e) => onPickFile(e.target.files?.[0] ?? null, e.currentTarget)}
      />
    </div>
  )
}

export default function OneTwoOneMygloKodyPage() {
  const resolvedTeam = use121ResolvedTeam()
  const [savedTeamId, setSavedTeamId] = React.useState<number | null>(null)
  const [mygloNumber, setMygloNumber] = React.useState("")
  const [photo, setPhoto] = React.useState<File | null>(null)
  const [photoUrl, setPhotoUrl] = React.useState<string | null>(null)
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = React.useState<string | null>(null)
  const [isUploadingPhoto, setIsUploadingPhoto] = React.useState(false)
  const [photoUploadError, setPhotoUploadError] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [kodZapasowy, setKodZapasowy] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (resolvedTeam.teamId != null) setSavedTeamId(resolvedTeam.teamId)
  }, [resolvedTeam.teamId])

  React.useEffect(() => {
    if (!photo) {
      setPhotoUrl(null)
      return
    }

    const url = URL.createObjectURL(photo)
    setPhotoUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [photo])

  React.useEffect(() => {
    if (!photo) {
      setUploadedPhotoUrl(null)
      setPhotoUploadError(null)
      setIsUploadingPhoto(false)
      return
    }

    let cancelled = false
    setIsUploadingPhoto(true)
    setPhotoUploadError(null)
    setUploadedPhotoUrl(null)

    async function uploadPhoto() {
      try {
        const res = await brandmastApi.add121Photo(photo!)
        if (cancelled) return

        if (res.success === false || !res.data?.url) {
          setPhotoUploadError(res.message ?? "Nie udało się przesłać zdjęcia.")
          setUploadedPhotoUrl(null)
          return
        }

        setUploadedPhotoUrl(res.data.url)
      } catch (e) {
        if (cancelled) return
        setPhotoUploadError(readApiError(e))
        setUploadedPhotoUrl(null)
      } finally {
        if (!cancelled) setIsUploadingPhoto(false)
      }
    }

    void uploadPhoto()
    return () => {
      cancelled = true
    }
  }, [photo])

  const regionLabel = React.useMemo(
    () =>
      resolvedTeam.teamName ?? getRegionLabel(resolvedTeam.teamId, resolvedTeam.teams),
    [resolvedTeam.teamName, resolvedTeam.teamId, resolvedTeam.teams],
  )

  const canSubmit =
    mygloNumber.trim().length > 0 &&
    uploadedPhotoUrl != null &&
    savedTeamId != null &&
    !isUploadingPhoto &&
    !isSubmitting &&
    !resolvedTeam.isLoading

  async function handleSubmit() {
    if (!canSubmit || savedTeamId == null || !uploadedPhotoUrl) {
      toast.error("Uzupełnij numer, dodaj zdjęcie i upewnij się, że region jest dopasowany.")
      return
    }

    setIsSubmitting(true)
    const toastId = toast.loading("Wysyłanie zgłoszenia…")
    try {
      const res = await brandmastApi.addZgloszenieKodMyglo({
        idRegion: savedTeamId,
        blednyKod: mygloNumber.trim(),
        zdjecie: uploadedPhotoUrl,
      })

      if (res.success === false) {
        toast.error(res.message ?? "Nie udało się wysłać zgłoszenia.", { id: toastId })
        return
      }

      const nextKod = res.data?.kod_zapasowy?.trim()
      setKodZapasowy(nextKod || null)
      setMygloNumber("")
      setPhoto(null)
      toast.success(res.message ?? "Zgłoszenie wysłane.", { id: toastId })
    } catch (e) {
      toast.error(readApiError(e), { id: toastId })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex flex-1 flex-col bg-background pb-24">
      <div className="mx-auto w-full max-w-lg px-3 py-4 sm:max-w-xl sm:px-4 sm:py-5">
        <header className="min-w-0 pr-11">
          <p className="text-xs text-muted-foreground">121 · Myglo</p>
          <h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl">
            Błędny numer Myglo
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Wpisz błędny numer i dodaj zdjęcie urządzenia. Zdjęcie jest wysyłane od razu po
            dodaniu.
          </p>
        </header>

        <Separator className="my-4" />

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 px-3"
            onClick={() => resolvedTeam.refetch()}
            disabled={resolvedTeam.isLoading}
          >
            <RefreshCwIcon
              className={cn("size-3.5", resolvedTeam.isLoading && "animate-spin")}
            />
            Odśwież
          </Button>
          {regionLabel ? (
            <Badge variant="outline" className="font-normal">
              {regionLabel}
            </Badge>
          ) : null}
        </div>

        <section aria-label="Formularz" className="space-y-4">
          {resolvedTeam.error ? (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
              <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>{resolvedTeam.error}</span>
            </div>
          ) : null}

          {kodZapasowy ? (
            <Card className="rounded-2xl border-0 bg-linear-to-br from-primary/10 via-card to-card shadow-md ring-1 ring-primary/20">
              <CardHeader className="space-y-0.5 px-3.5 py-3 sm:px-4">
                <CardTitle className="text-sm font-semibold">Kod zapasowy</CardTitle>
                <CardDescription className="text-xs">
                  Nowy kod do tourplanner został wygenerowany.
                </CardDescription>
              </CardHeader>
              <CardContent className="border-t border-border/80 px-3.5 pb-3.5 pt-2 sm:px-4 sm:pb-4">
                <p className="font-mono text-lg font-semibold tracking-wide">{kodZapasowy}</p>
              </CardContent>
            </Card>
          ) : null}

          <Card className="rounded-2xl border-0 shadow-md ring-1 ring-border/60">
            <CardHeader className="space-y-0.5 px-3.5 py-3 sm:px-4">
              <CardTitle className="text-sm font-semibold">Dane zgłoszenia</CardTitle>
              <CardDescription className="text-xs">
                Uzupełnij oba pola. Na telefonie możesz od razu zrobić zdjęcie aparatem.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 border-t border-border/80 px-3.5 pb-3.5 pt-2 sm:px-4 sm:pb-4">
              <div className="space-y-2">
                <Label htmlFor="myglo-number" className="text-xs">
                  Błędny numer Myglo
                </Label>
                <Input
                  id="myglo-number"
                  autoComplete="off"
                  placeholder="Wpisz numer z urządzenia"
                  value={mygloNumber}
                  onChange={(e) => setMygloNumber(e.target.value)}
                />
                <p className="text-[11px] leading-snug text-muted-foreground">
                  Kody z tylu urzadzenia.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Zdjęcie urządzenia</Label>
                <DevicePhotoField
                  photo={photo}
                  photoUrl={photoUrl}
                  isUploading={isUploadingPhoto}
                  uploadError={photoUploadError}
                  onPhotoChange={setPhoto}
                />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Button
              className="min-h-12 w-full touch-manipulation text-base active:scale-[0.99]"
              disabled={!canSubmit}
              onClick={() => void handleSubmit()}
            >
              {isSubmitting ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" aria-hidden />
                  <span className="ml-2">Wysyłanie…</span>
                </>
              ) : (
                "Wyślij zgłoszenie"
              )}
            </Button>
            <p
              className={cn(
                "text-center text-[11px] text-muted-foreground",
                !canSubmit && "text-muted-foreground/90",
              )}
            >
              {isUploadingPhoto
                ? "Trwa przesyłanie zdjęcia…"
                : photoUploadError
                  ? "Popraw błąd przesyłania zdjęcia, aby wysłać zgłoszenie."
                  : savedTeamId == null && !resolvedTeam.isLoading
                    ? "Brak dopasowanego regionu — odśwież lub skontaktuj się z administratorem."
                    : canSubmit
                      ? "Gotowe do wysłania."
                      : "Uzupełnij numer i dodaj zdjęcie, aby odblokować przycisk."}
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
