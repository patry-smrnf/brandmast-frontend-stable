"use client"

import * as React from "react"
import { CameraIcon, CheckIcon, ImageIcon, Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

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
  onPhotoChange,
}: {
  photo: File | null
  photoUrl: string | null
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
      <div className="overflow-hidden rounded-xl border border-primary/25 bg-primary/5 shadow-sm">
        <div className="relative min-h-[min(52dvh,18rem)] w-full bg-muted/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrl}
            alt="Podgląd zdjęcia urządzenia"
            className="absolute inset-0 h-full w-full object-contain"
          />
          <div className="absolute left-3 top-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-background/95 px-2.5 py-1 text-xs font-medium text-primary shadow-sm backdrop-blur-sm">
              <CheckIcon className="size-3.5" aria-hidden />
              Zdjęcie dodane
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
              onClick={() => cameraInputRef.current?.click()}
            >
              <CameraIcon className="size-4" aria-hidden />
              <span className="ml-2">Zrób nowe zdjęcie</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-12 w-full touch-manipulation text-base active:scale-[0.99]"
              onClick={() => galleryInputRef.current?.click()}
            >
              <ImageIcon className="size-4" aria-hidden />
              <span className="ml-2">Wybierz inne z galerii</span>
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="min-h-12 w-full touch-manipulation text-base active:scale-[0.99]"
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
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-dashed border-border bg-muted/15">
      <div className="flex min-h-[min(44dvh,14rem)] flex-col items-center justify-center px-4 py-6 text-center">
        <span
          className="flex size-14 items-center justify-center rounded-2xl border border-border/70 bg-background shadow-sm"
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
  const [mygloNumber, setMygloNumber] = React.useState("")
  const [photo, setPhoto] = React.useState<File | null>(null)
  const [photoUrl, setPhotoUrl] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!photo) {
      setPhotoUrl(null)
      return
    }

    const url = URL.createObjectURL(photo)
    setPhotoUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [photo])

  const canContinue = mygloNumber.trim().length > 0 && photo != null

  return (
    <main className="flex flex-1 flex-col bg-background pb-24">
      <div className="mx-auto w-full max-w-lg px-3 py-4 sm:max-w-xl sm:px-4 sm:py-5">
        <header className="min-w-0 pr-11">
          <p className="text-xs text-muted-foreground">121 · Myglo</p>
          <h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl">
            Błędny numer Myglo
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Wpisz błędny numer i dodaj zdjęcie urządzenia. To jest tylko formularz UI — logika
            wysyłki będzie dodana później.
          </p>
        </header>

        <Separator className="my-4" />

        <section aria-label="Formularz" className="space-y-4">
          <Card className="border-border/80 shadow-sm">
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
                  inputMode="numeric"
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
                <DevicePhotoField photo={photo} photoUrl={photoUrl} onPhotoChange={setPhoto} />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Button
              className="min-h-12 w-full touch-manipulation text-base active:scale-[0.99]"
              disabled={!canContinue}
              onClick={() => void 0}
            >
              Wyślij zgłoszenie
            </Button>
            <p
              className={cn(
                "text-center text-[11px] text-muted-foreground",
                !canContinue && "text-muted-foreground/90",
              )}
            >
              {canContinue
                ? "Gotowe do wysłania (backend dojdzie później)."
                : "Uzupełnij numer i dodaj zdjęcie, aby odblokować przycisk."}
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
