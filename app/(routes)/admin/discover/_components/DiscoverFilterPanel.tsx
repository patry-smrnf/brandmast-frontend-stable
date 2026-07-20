"use client"

import * as React from "react"
import {
  ChevronDownIcon,
  ClipboardPasteIcon,
  DownloadIcon,
  FilterIcon,
  PlusIcon,
  Trash2Icon,
  UploadIcon,
  XIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import {
  countActiveRules,
  createEmptyRule,
  DISCOVER_FILTER_OPERATORS,
  exportFilterPreset,
  formatRuleChip,
  importFilterPreset,
  resolvePresetSize,
  type DiscoverFilterPreset,
  type DiscoverFilterRule,
} from "../discover-filters"
import { KNOWN_SERVICE_NAMES } from "../discover-utils"
import { FieldSuggest } from "./FieldSuggest"

const SIZE_PRESETS = [25, 50, 100, 200, 500] as const
const RULES_COLLAPSED_KEY = "brandmast.discover.filters.rulesCollapsed"
const PANEL_COLLAPSED_KEY = "brandmast.discover.filters.panelCollapsed"

type DiscoverFilterPanelProps = {
  preset: DiscoverFilterPreset
  onChange: (next: DiscoverFilterPreset) => void
  serviceOptions: string[]
  /** Logs currently shown (after rules + display limit). */
  hits: number
  /** Logs matching rules before display limit slice. */
  matched?: number
  /** Logs loaded from API / buffer (before client rules). */
  total: number
  /** Max fetched into buffer when client rules are active. */
  bufferLimit?: number
  page?: number
  totalPages?: number
  totalElements?: number
  canPrev?: boolean
  canNext?: boolean
  onPageChange?: (page: number) => void
  className?: string
}

export function DiscoverFilterPanel({
  preset,
  onChange,
  serviceOptions,
  hits,
  matched,
  total,
  bufferLimit,
  page = 0,
  totalPages = 1,
  totalElements = 0,
  canPrev = false,
  canNext = false,
  onPageChange,
  className,
}: DiscoverFilterPanelProps) {
  const fileRef = React.useRef<HTMLInputElement | null>(null)
  const activeCount = countActiveRules(preset.rules)
  const matchedCount = matched ?? hits
  const pageSize = resolvePresetSize(preset)

  const serviceDatalist = React.useMemo(
    () => mergeUniqueStrings([...KNOWN_SERVICE_NAMES, ...serviceOptions]),
    [serviceOptions],
  )

  const [panelCollapsed, setPanelCollapsed] = React.useState(false)
  const [rulesCollapsed, setRulesCollapsed] = React.useState(false)
  const [collapseReady, setCollapseReady] = React.useState(false)

  const [pasteOpen, setPasteOpen] = React.useState(false)
  const [pasteText, setPasteText] = React.useState("")

  React.useEffect(() => {
    try {
      setPanelCollapsed(window.localStorage.getItem(PANEL_COLLAPSED_KEY) === "1")
      setRulesCollapsed(window.localStorage.getItem(RULES_COLLAPSED_KEY) === "1")
    } catch {
      // ignore
    }
    setCollapseReady(true)
  }, [])

  React.useEffect(() => {
    if (!collapseReady) return
    try {
      window.localStorage.setItem(PANEL_COLLAPSED_KEY, panelCollapsed ? "1" : "0")
      window.localStorage.setItem(RULES_COLLAPSED_KEY, rulesCollapsed ? "1" : "0")
    } catch {
      // ignore
    }
  }, [panelCollapsed, rulesCollapsed, collapseReady])

  function patch(partial: Partial<DiscoverFilterPreset>) {
    onChange({ ...preset, ...partial })
  }

  function applyImported(imported: DiscoverFilterPreset) {
    setRulesCollapsed(false)
    setPanelCollapsed(false)
    setPasteOpen(false)
    setPasteText("")
    const size = resolvePresetSize(imported)
    onChange({
      version: 1,
      size,
      limit: size,
      serviceInclude: imported.serviceInclude ?? "",
      trackingId: imported.trackingId ?? "",
      from: imported.from ?? "",
      to: imported.to ?? "",
      rules: imported.rules,
      name: imported.name,
    })
    toast.success(`Zaimportowano ${imported.rules.length} reguł`)
  }

  function updateRule(id: string, partial: Partial<DiscoverFilterRule>) {
    patch({
      rules: preset.rules.map((r) => (r.id === id ? { ...r, ...partial } : r)),
    })
  }

  function removeRule(id: string) {
    patch({ rules: preset.rules.filter((r) => r.id !== id) })
  }

  function addRule() {
    setPanelCollapsed(false)
    setRulesCollapsed(false)
    patch({ rules: [...preset.rules, createEmptyRule()] })
  }

  function clearRules() {
    patch({
      rules: [],
      serviceInclude: "",
      trackingId: "",
      from: "",
      to: "",
    })
  }

  async function onExport() {
    const json = exportFilterPreset(preset)
    try {
      await navigator.clipboard.writeText(json)
      toast.success("Skopiowano preset filtrów (JSON)")
    } catch {
      downloadTextFile(json, `discover-filters-${Date.now()}.json`)
      toast.success("Pobrano plik JSON z filtrami")
    }
  }

  function onDownload() {
    const json = exportFilterPreset(preset)
    downloadTextFile(json, `discover-filters-${Date.now()}.json`)
    toast.success("Pobrano plik JSON")
  }

  async function onImportFile(file: File) {
    try {
      const text = await file.text()
      applyImported(importFilterPreset(text))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import nieudany")
    }
  }

  function onApplyPaste() {
    try {
      applyImported(importFilterPreset(pasteText))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nieprawidłowy JSON")
    }
  }

  async function onPasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText()
      if (!text.trim()) {
        toast.error("Schowek jest pusty")
        return
      }
      setPasteText(text)
      setPasteOpen(true)
      setPanelCollapsed(false)
      toast.message("Wklejono ze schowka — sprawdź i zatwierdź")
    } catch {
      setPasteOpen(true)
      setPanelCollapsed(false)
      toast.error("Brak dostępu do schowka — wklej ręcznie (Ctrl+V)")
    }
  }

  const statsFooter = (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-1 border-border/80 bg-muted/15 px-3 py-2 text-xs text-muted-foreground sm:px-4",
        panelCollapsed ? "rounded-b-xl border-t-0" : "rounded-b-xl border-t",
      )}
    >
      <span>
        Hits:{" "}
        <span className="font-medium text-foreground tabular-nums">{hits}</span>
        {activeCount > 0 ? (
          <span>
            {" "}
            (matched {matchedCount}
            {matchedCount > hits ? `, pokazuję ${hits}` : ""}
            {" / "}
            scanned {total}
            {bufferLimit && bufferLimit > pageSize ? `, buffer ${bufferLimit}` : ""}
            )
          </span>
        ) : (
          <span>
            {" "}
            / totalElements{" "}
            <span className="font-medium text-foreground tabular-nums">{totalElements}</span>
          </span>
        )}
      </span>
      <span className="hidden sm:inline">·</span>
      <span>
        Size:{" "}
        <span className="font-medium text-foreground tabular-nums">{pageSize}</span>
      </span>
      <span className="hidden sm:inline">·</span>
      <span className="inline-flex items-center gap-1.5">
        Page:{" "}
        <span className="font-medium text-foreground tabular-nums">
          {page + 1}/{Math.max(totalPages, 1)}
        </span>
        <Button
          type="button"
          variant="outline"
          size="xs"
          disabled={!canPrev}
          onClick={() => onPageChange?.(page - 1)}
        >
          Prev
        </Button>
        <Button
          type="button"
          variant="outline"
          size="xs"
          disabled={!canNext}
          onClick={() => onPageChange?.(page + 1)}
        >
          Next
        </Button>
      </span>
      {activeCount > 0 ? (
        <>
          <span className="hidden sm:inline">·</span>
          <span className="text-[11px]">
            Reguły lokalne — API page=0 size={bufferLimit ?? 500}
          </span>
        </>
      ) : null}
      {(preset.serviceInclude ?? "").trim() ? (
        <>
          <span className="hidden sm:inline">·</span>
          <span>
            service: <span className="font-mono text-foreground">{preset.serviceInclude}</span>
          </span>
        </>
      ) : null}
      {(preset.trackingId ?? "").trim() ? (
        <>
          <span className="hidden sm:inline">·</span>
          <span>
            trackingId:{" "}
            <span className="font-mono text-foreground">{preset.trackingId}</span>
          </span>
        </>
      ) : null}
    </div>
  )

  return (
    <section
      className={cn("rounded-xl border border-border bg-card/50 shadow-sm", className)}
    >
      <div
        className={cn(
          "flex flex-col gap-3 bg-muted/20 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4",
          panelCollapsed ? "rounded-t-xl" : "rounded-t-xl border-b border-border/80",
        )}
      >
        <button
          type="button"
          className="flex min-w-0 items-center gap-2 rounded-md text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          onClick={() => setPanelCollapsed((v) => !v)}
          aria-expanded={!panelCollapsed}
          aria-label={panelCollapsed ? "Rozwiń filtry" : "Zwiń filtry"}
        >
          <ChevronDownIcon
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform",
              panelCollapsed && "-rotate-90",
            )}
            aria-hidden
          />
          <div className="flex size-8 items-center justify-center rounded-lg border border-border bg-background">
            <FilterIcon className="size-4 text-muted-foreground" aria-hidden />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold tracking-tight">Filtry</h2>
              {activeCount > 0 ? (
                <Badge variant="secondary" className="font-mono text-[10px]">
                  {activeCount} active
                </Badge>
              ) : (
                <Badge variant="outline" className="font-normal text-[10px]">
                  brak reguł
                </Badge>
              )}
              {panelCollapsed ? (
                <Badge variant="outline" className="font-normal text-[10px]">
                  zwinięte
                </Badge>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              {panelCollapsed
                ? "Kliknij, aby rozwinąć panel filtrów"
                : "Reguły AND · CONTAINS / IS LIKE · zapis w localStorage"}
            </p>
          </div>
        </button>

        <div
          className="flex flex-wrap items-center gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          <Button type="button" variant="outline" size="sm" onClick={onExport}>
            <DownloadIcon data-icon="inline-start" />
            Export
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onDownload}>
            JSON
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setPanelCollapsed(false)
              setPasteOpen((v) => !v)
              if (!pasteOpen) setPasteText("")
            }}
          >
            <ClipboardPasteIcon data-icon="inline-start" />
            Wklej JSON
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => void onPasteFromClipboard()}>
            Schowek
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
          >
            <UploadIcon data-icon="inline-start" />
            Plik
          </Button>
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
      </div>

      {panelCollapsed ? (
        <div className="space-y-2 border-t border-border/60 px-3 py-2.5 sm:px-4">
          {preset.rules.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {preset.rules.map((rule) => (
                <button
                  key={rule.id}
                  type="button"
                  title="Rozwiń panel filtrów"
                  onClick={() => setPanelCollapsed(false)}
                  className={cn(
                    "max-w-full truncate rounded-md border px-1.5 py-0.5 font-mono text-[10px] transition-colors",
                    rule.enabled && rule.value.trim()
                      ? "border-border bg-muted/50 text-foreground hover:bg-muted"
                      : "border-dashed border-border/70 text-muted-foreground hover:bg-muted/40",
                    !rule.enabled && "line-through opacity-60",
                  )}
                >
                  {rule.value.trim() ? formatRuleChip(rule) : `${rule.field} (pusta)`}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Brak aktywnych reguł.</p>
          )}
          {statsFooter}
        </div>
      ) : (
        <>
          {pasteOpen ? (
            <div className="space-y-2 border-b border-border/70 bg-background/50 px-3 py-3 sm:px-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label htmlFor="discover-paste-json" className="text-xs text-muted-foreground">
                  Wklej JSON z regułami (preset Discover)
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    setPasteOpen(false)
                    setPasteText("")
                  }}
                >
                  <XIcon data-icon="inline-start" />
                  Zamknij
                </Button>
              </div>
              <textarea
                id="discover-paste-json"
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                spellCheck={false}
                placeholder={`{\n  "version": 1,\n  "limit": 50,\n  "rules": [ ... ]\n}`}
                className={cn(
                  "min-h-36 w-full resize-y rounded-lg border border-input bg-background px-3 py-2",
                  "font-mono text-xs leading-relaxed text-foreground shadow-xs outline-none",
                  "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                )}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={onApplyPaste}
                  disabled={!pasteText.trim()}
                >
                  Zastosuj JSON
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void onPasteFromClipboard()}
                >
                  <ClipboardPasteIcon data-icon="inline-start" />
                  Wklej ze schowka
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPasteText(exportFilterPreset(preset))}
                >
                  Wstaw aktualny preset
                </Button>
              </div>
            </div>
          ) : null}

          <div className="space-y-4 p-3 sm:p-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <Label htmlFor="discover-size" className="text-xs text-muted-foreground">
                  Size (strona)
                </Label>
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => {
                    const n = Number(v)
                    if (!Number.isFinite(n)) return
                    const size = Math.min(500, Math.max(1, Math.trunc(n)))
                    patch({ size, limit: size })
                  }}
                >
                  <SelectTrigger id="discover-size" className="h-9 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SIZE_PRESETS.map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:col-span-1 lg:col-span-1">
                <Label htmlFor="discover-service-include" className="text-xs text-muted-foreground">
                  serviceName (API)
                </Label>
                <Input
                  id="discover-service-include"
                  value={preset.serviceInclude ?? ""}
                  onChange={(e) => patch({ serviceInclude: e.target.value })}
                  onBlur={() =>
                    patch({ serviceInclude: (preset.serviceInclude ?? "").trim() })
                  }
                  placeholder="np. OneTwo1Service"
                  className="h-9 font-mono text-xs"
                  list="discover-filter-services"
                  autoComplete="off"
                />
                <datalist id="discover-filter-services">
                  {serviceDatalist.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="discover-tracking-id" className="text-xs text-muted-foreground">
                  trackingId (API)
                </Label>
                <Input
                  id="discover-tracking-id"
                  value={preset.trackingId ?? ""}
                  onChange={(e) => patch({ trackingId: e.target.value })}
                  onBlur={() => patch({ trackingId: (preset.trackingId ?? "").trim() })}
                  placeholder="UUID korelacji requestu"
                  className="h-9 font-mono text-xs"
                  autoComplete="off"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="discover-from" className="text-xs text-muted-foreground">
                  from
                </Label>
                <Input
                  id="discover-from"
                  type="datetime-local"
                  value={isoToDatetimeLocal(preset.from)}
                  onChange={(e) => patch({ from: datetimeLocalToIso(e.target.value) })}
                  className="h-9 font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="discover-to" className="text-xs text-muted-foreground">
                  to
                </Label>
                <Input
                  id="discover-to"
                  type="datetime-local"
                  value={isoToDatetimeLocal(preset.to)}
                  onChange={(e) => patch({ to: datetimeLocalToIso(e.target.value) })}
                  className="h-9 font-mono text-xs"
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  className="flex items-center gap-1.5 rounded-md text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  onClick={() => setRulesCollapsed((v) => !v)}
                  aria-expanded={!rulesCollapsed}
                >
                  <ChevronDownIcon
                    className={cn(
                      "size-4 text-muted-foreground transition-transform",
                      rulesCollapsed && "-rotate-90",
                    )}
                    aria-hidden
                  />
                  <Label className="cursor-pointer text-xs text-muted-foreground">
                    Reguły niestandardowe
                    {preset.rules.length > 0 ? (
                      <span className="ml-1 font-mono text-foreground">
                        ({preset.rules.length})
                      </span>
                    ) : null}
                  </Label>
                </button>

                <div className="flex flex-wrap gap-1.5">
                  {(preset.rules.length > 0 ||
                    (preset.serviceInclude ?? "").trim() ||
                    (preset.trackingId ?? "").trim() ||
                    (preset.from ?? "").trim() ||
                    (preset.to ?? "").trim()) && (
                    <Button type="button" variant="ghost" size="xs" onClick={clearRules}>
                      <XIcon data-icon="inline-start" />
                      Wyczyść
                    </Button>
                  )}
                  <Button type="button" variant="secondary" size="xs" onClick={addRule}>
                    <PlusIcon data-icon="inline-start" />
                    Dodaj regułę
                  </Button>
                </div>
              </div>

              {rulesCollapsed ? (
                <div className="rounded-lg border border-border/70 bg-background/40 px-3 py-2.5">
                  {preset.rules.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Reguły zwinięte — brak zdefiniowanych reguł.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {preset.rules.map((rule) => (
                        <button
                          key={rule.id}
                          type="button"
                          title="Kliknij, aby rozwinąć edycję"
                          onClick={() => setRulesCollapsed(false)}
                          className={cn(
                            "max-w-full truncate rounded-md border px-1.5 py-0.5 font-mono text-[10px] transition-colors",
                            rule.enabled && rule.value.trim()
                              ? "border-border bg-muted/50 text-foreground hover:bg-muted"
                              : "border-dashed border-border/70 text-muted-foreground hover:bg-muted/40",
                            !rule.enabled && "line-through opacity-60",
                          )}
                        >
                          {rule.value.trim() ? formatRuleChip(rule) : `${rule.field} (pusta)`}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : preset.rules.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/80 bg-background/40 px-3 py-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Brak reguł — dodaj np.{" "}
                    <span className="font-mono text-foreground">
                      document NOT CONTAINS TEST
                    </span>{" "}
                    albo{" "}
                    <span className="font-mono text-foreground">details.login CONTAINS …</span>
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={addRule}
                  >
                    <PlusIcon data-icon="inline-start" />
                    Pierwsza reguła
                  </Button>
                </div>
              ) : (
                <ul className="space-y-2 overflow-visible">
                  {preset.rules.map((rule, index) => (
                    <li
                      key={rule.id}
                      className={cn(
                        "overflow-visible rounded-xl border border-border/80 bg-background/50 p-2.5 sm:p-3",
                        !rule.enabled && "opacity-60",
                      )}
                    >
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <span className="font-mono text-[10px] text-muted-foreground">
                            #{index + 1}
                          </span>
                          {rule.value.trim() ? (
                            <span className="max-w-full truncate rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] text-foreground/90">
                              {formatRuleChip(rule)}
                            </span>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5">
                            <Switch
                              checked={rule.enabled}
                              onCheckedChange={(checked) =>
                                updateRule(rule.id, { enabled: checked })
                              }
                              aria-label="Włącz regułę"
                            />
                            <span className="text-[10px] text-muted-foreground">ON</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => removeRule(rule.id)}
                            aria-label="Usuń regułę"
                          >
                            <Trash2Icon className="size-3.5" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-2 overflow-visible lg:grid-cols-[minmax(0,1.1fr)_9rem_auto_minmax(0,1.4fr)] lg:items-end">
                        <div className="relative z-10 space-y-1 overflow-visible">
                          <Label className="text-[10px] text-muted-foreground">Field</Label>
                          <FieldSuggest
                            value={rule.field}
                            onChange={(field) => updateRule(rule.id, { field })}
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Operator</Label>
                          <Select
                            value={rule.operator}
                            onValueChange={(v) =>
                              updateRule(rule.id, {
                                operator: v === "like" ? "like" : "contains",
                              })
                            }
                          >
                            <SelectTrigger className="h-9 font-mono text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {DISCOVER_FILTER_OPERATORS.map((op) => (
                                <SelectItem key={op.id} value={op.id}>
                                  {op.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Negate</Label>
                          <button
                            type="button"
                            onClick={() => updateRule(rule.id, { negate: !rule.negate })}
                            className={cn(
                              "flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border px-2 font-mono text-xs transition-colors",
                              rule.negate
                                ? "border-destructive/40 bg-destructive/10 text-destructive"
                                : "border-border bg-background text-muted-foreground hover:bg-muted",
                            )}
                            title="Przeczenie (NOT)"
                          >
                            NOT
                            <span className="text-[10px]">{rule.negate ? "ON" : "OFF"}</span>
                          </button>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Value</Label>
                          <Input
                            value={rule.value}
                            onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                            placeholder={
                              rule.operator === "like" ? "%error% lub Auth%" : "szukana wartość"
                            }
                            className="h-9 font-mono text-xs"
                            autoComplete="off"
                          />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {statsFooter}
        </>
      )}
    </section>
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

function mergeUniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, "pl"),
  )
}

/** datetime-local value → ISO string (or empty). */
function datetimeLocalToIso(value: string): string {
  if (!value.trim()) return ""
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ""
  return d.toISOString()
}

/** ISO → datetime-local (local tz) for input. */
function isoToDatetimeLocal(iso?: string): string {
  if (!iso?.trim()) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
