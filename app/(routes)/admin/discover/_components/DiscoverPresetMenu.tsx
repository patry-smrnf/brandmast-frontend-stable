"use client"

import * as React from "react"
import {
  BookmarkIcon,
  ClipboardPasteIcon,
  CopyIcon,
  DownloadIcon,
  FolderOpenIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  clearAllFilters,
  deleteNamedPreset,
  exportFilterPreset,
  importFilterPreset,
  loadNamedPresets,
  resolvePresetSize,
  saveNamedPresets,
  upsertNamedPreset,
  type DiscoverFilterPreset,
  type DiscoverNamedPreset,
} from "../discover-filters"

type DiscoverPresetMenuProps = {
  preset: DiscoverFilterPreset
  onChange: (next: DiscoverFilterPreset) => void
  onRequestPaste?: () => void
  className?: string
}

export function DiscoverPresetMenu({
  preset,
  onChange,
  onRequestPaste,
  className,
}: DiscoverPresetMenuProps) {
  const [open, setOpen] = React.useState(false)
  const [named, setNamed] = React.useState<DiscoverNamedPreset[]>([])
  const [saveName, setSaveName] = React.useState("")
  const [saving, setSaving] = React.useState(false)
  const rootRef = React.useRef<HTMLDivElement | null>(null)
  const fileRef = React.useRef<HTMLInputElement | null>(null)

  React.useEffect(() => {
    setNamed(loadNamedPresets())
  }, [])

  React.useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node | null
      if (!target || rootRef.current?.contains(target)) return
      setOpen(false)
      setSaving(false)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false)
        setSaving(false)
      }
    }
    window.addEventListener("pointerdown", onPointerDown, true)
    window.addEventListener("keydown", onKeyDown)
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, true)
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  async function onCopy() {
    const json = exportFilterPreset(preset)
    try {
      await navigator.clipboard.writeText(json)
      toast.success("Skopiowano preset filtrów")
    } catch {
      downloadTextFile(json, `discover-filters-${Date.now()}.json`)
      toast.success("Pobrano plik JSON (schowek niedostępny)")
    }
    setOpen(false)
  }

  function onDownload() {
    const json = exportFilterPreset(preset)
    downloadTextFile(json, `discover-filters-${Date.now()}.json`)
    toast.success("Pobrano plik JSON")
    setOpen(false)
  }

  async function onImportFile(file: File) {
    try {
      const text = await file.text()
      const imported = importFilterPreset(text)
      applyImported(imported)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import nieudany")
    }
  }

  function applyImported(imported: DiscoverFilterPreset) {
    const size = resolvePresetSize(imported)
    onChange({
      version: 1,
      size,
      limit: size,
      serviceInclude: imported.serviceInclude ?? "",
      methodName: imported.methodName ?? "",
      level: imported.level ?? "",
      detailsContains: imported.detailsContains ?? "",
      trackingId: imported.trackingId ?? "",
      from: imported.from ?? "",
      to: imported.to ?? "",
      rules: imported.rules,
      name: imported.name,
    })
    toast.success(
      imported.name
        ? `Załadowano „${imported.name}”`
        : `Zaimportowano ${imported.rules.length} reguł`,
    )
    setOpen(false)
  }

  function onSaveNamed() {
    const name = saveName.trim() || preset.name?.trim() || ""
    if (!name) {
      toast.error("Podaj nazwę presetu")
      return
    }
    const next = upsertNamedPreset(named, name, preset)
    setNamed(next)
    saveNamedPresets(next)
    onChange({ ...preset, name })
    setSaveName("")
    setSaving(false)
    toast.success(`Zapisano „${name}”`)
  }

  function onLoadNamed(item: DiscoverNamedPreset) {
    applyImported({ ...item.preset, name: item.name })
  }

  function onDeleteNamed(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    const next = deleteNamedPreset(named, id)
    setNamed(next)
    saveNamedPresets(next)
    toast.message("Usunięto preset")
  }

  function onClearAll() {
    onChange(clearAllFilters(preset))
    toast.message("Wyczyszczono wszystkie filtry")
    setOpen(false)
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        <FolderOpenIcon data-icon="inline-start" />
        Preset
      </Button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-40 mt-1 w-[min(100vw-2rem,18rem)] rounded-xl border border-border bg-popover p-1.5 shadow-lg"
        >
          <MenuItem icon={CopyIcon} label="Kopiuj" onClick={() => void onCopy()} />
          <MenuItem icon={DownloadIcon} label="Pobierz" onClick={onDownload} />
          <MenuItem
            icon={ClipboardPasteIcon}
            label="Wklej…"
            onClick={() => {
              setOpen(false)
              onRequestPaste?.()
            }}
          />
          <MenuItem
            icon={UploadIcon}
            label="Załaduj plik…"
            onClick={() => fileRef.current?.click()}
          />

          <div className="my-1.5 border-t border-border/70" />

          <p className="px-2 py-1 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
            Moje presety
          </p>

          {named.length === 0 ? (
            <p className="px-2 py-1.5 text-xs text-muted-foreground">Brak zapisanych.</p>
          ) : (
            <ul className="max-h-40 space-y-0.5 overflow-y-auto">
              {named.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center gap-1 rounded-lg px-2 py-1.5 text-left text-xs hover:bg-muted"
                    onClick={() => onLoadNamed(item)}
                  >
                    <BookmarkIcon className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate font-medium">{item.name}</span>
                    <button
                      type="button"
                      className="rounded p-0.5 text-muted-foreground hover:bg-background hover:text-destructive"
                      aria-label={`Usuń ${item.name}`}
                      onClick={(e) => onDeleteNamed(item.id, e)}
                    >
                      <Trash2Icon className="size-3" />
                    </button>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {saving ? (
            <div className="mt-1 space-y-1.5 border-t border-border/70 px-1 pt-2">
              <Input
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Nazwa presetu"
                className="h-8 text-xs"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSaveNamed()
                }}
              />
              <div className="flex gap-1">
                <Button type="button" size="xs" className="flex-1" onClick={onSaveNamed}>
                  Zapisz
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    setSaving(false)
                    setSaveName("")
                  }}
                >
                  Anuluj
                </Button>
              </div>
            </div>
          ) : (
            <MenuItem
              icon={BookmarkIcon}
              label="Zapisz jako…"
              onClick={() => {
                setSaving(true)
                setSaveName(preset.name ?? "")
              }}
            />
          )}

          <div className="my-1.5 border-t border-border/70" />
          <MenuItem
            icon={Trash2Icon}
            label="Wyczyść wszystko"
            destructive
            onClick={onClearAll}
          />

          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.target.value = ""
              if (file) void onImportFile(file)
            }}
          />
        </div>
      ) : null}
    </div>
  )
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  destructive,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick: () => void
  destructive?: boolean
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs hover:bg-muted",
        destructive && "text-destructive hover:bg-destructive/10",
      )}
    >
      <Icon className="size-3.5 shrink-0 opacity-70" />
      {label}
    </button>
  )
}

function downloadTextFile(content: string, filename: string) {
  const blob = new Blob([content], { type: "application/json;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.rel = "noopener"
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
