"use client"

import * as React from "react"
import {
  ChevronDownIcon,
  ClipboardPasteIcon,
  FilterIcon,
  PlusIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  Trash2Icon,
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
  clearRulesOnly,
  countActiveRules,
  createEmptyRule,
  DISCOVER_FILTER_OPERATORS,
  exportFilterPreset,
  formatRuleChip,
  hasApiFilterFields,
  importFilterPreset,
  pruneEmptyRules,
  resolvePresetSize,
  type DiscoverFilterPreset,
  type DiscoverFilterRule,
} from "../discover-filters"
import {
  DISCOVER_MAX_AST_NODES,
  countAstNodes,
  presetToFilterAst,
} from "../discover-search"
import { KNOWN_SERVICE_NAMES } from "../discover-utils"
import { DiscoverFiltersDrawer } from "./DiscoverFiltersDrawer"
import { DiscoverPresetMenu } from "./DiscoverPresetMenu"
import { FieldSuggest } from "./FieldSuggest"

const SIZE_PRESETS = [25, 50, 100, 200, 500] as const
const LEVEL_OPTIONS = ["TRACE", "DEBUG", "INFO", "WARN", "ERROR"] as const
const LEVEL_ALL = "__all__"

type DiscoverFilterPanelProps = {
  preset: DiscoverFilterPreset
  onChange: (next: DiscoverFilterPreset) => void
  serviceOptions: string[]
  methodOptions?: string[]
  /** Rows currently shown on this cursor page. */
  hits: number
  /** Formatted total from search (`eq` / `gte`). */
  totalLabel: string
  tookMs?: number | null
  pageIndex?: number
  canPrev?: boolean
  canNext?: boolean
  onPrev?: () => void
  onNext?: () => void
  /** True when from/to empty — backend uses default last 7 days. */
  usingDefaultTime?: boolean
  className?: string
}

export function DiscoverFilterPanel({
  preset,
  onChange,
  serviceOptions,
  methodOptions = [],
  hits,
  totalLabel,
  tookMs = null,
  pageIndex = 0,
  canPrev = false,
  canNext = false,
  onPrev,
  onNext,
  usingDefaultTime = false,
  className,
}: DiscoverFilterPanelProps) {
  const activeCount = countActiveRules(preset.rules)
  const pageSize = resolvePresetSize(preset)

  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const [rulesCollapsed, setRulesCollapsed] = React.useState(false)
  const [pasteOpen, setPasteOpen] = React.useState(false)
  const [pasteText, setPasteText] = React.useState("")

  const serviceDatalist = React.useMemo(
    () => mergeUniqueStrings([...KNOWN_SERVICE_NAMES, ...serviceOptions]),
    [serviceOptions],
  )

  const methodDatalist = React.useMemo(
    () => mergeUniqueStrings(methodOptions),
    [methodOptions],
  )

  const visibleRules = React.useMemo(
    () => pruneEmptyRules(preset.rules, { keepOneDraft: drawerOpen }),
    [preset.rules, drawerOpen],
  )

  function patch(partial: Partial<DiscoverFilterPreset>) {
    onChange({ ...preset, ...partial })
  }

  function applyImported(imported: DiscoverFilterPreset) {
    setPasteOpen(false)
    setPasteText("")
    setDrawerOpen(true)
    setRulesCollapsed(false)
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
    setDrawerOpen(true)
    setRulesCollapsed(false)
    const pruned = pruneEmptyRules(preset.rules, { keepOneDraft: false })
    const nextRules = [...pruned, createEmptyRule()]
    const projected = presetToFilterAst({ ...preset, rules: nextRules })
    if (countAstNodes(projected) > DISCOVER_MAX_AST_NODES) {
      toast.error(`Limit filtrów: max ${DISCOVER_MAX_AST_NODES} węzłów AST`)
      return
    }
    patch({ rules: nextRules })
  }

  function clearRules() {
    patch(clearRulesOnly(preset))
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
      setDrawerOpen(true)
      toast.message("Wklejono ze schowka — sprawdź i zatwierdź")
    } catch {
      setPasteOpen(true)
      setDrawerOpen(true)
      toast.error("Brak dostępu do schowka — wklej ręcznie (Ctrl+V)")
    }
  }

  const advancedActive =
    Boolean((preset.methodName ?? "").trim()) ||
    Boolean((preset.trackingId ?? "").trim()) ||
    Boolean((preset.from ?? "").trim()) ||
    Boolean((preset.to ?? "").trim()) ||
    activeCount > 0 ||
    pageSize !== 50

  const chips: { key: string; label: string; onClear: () => void }[] = []
  if ((preset.detailsContains ?? "").trim()) {
    chips.push({
      key: "q",
      label: `szukaj: ${preset.detailsContains}`,
      onClear: () => patch({ detailsContains: "" }),
    })
  }
  if ((preset.level ?? "").trim()) {
    chips.push({
      key: "level",
      label: `level: ${preset.level}`,
      onClear: () => patch({ level: "" }),
    })
  }
  if ((preset.serviceInclude ?? "").trim()) {
    chips.push({
      key: "service",
      label: `service: ${preset.serviceInclude}`,
      onClear: () => patch({ serviceInclude: "" }),
    })
  }
  if ((preset.methodName ?? "").trim()) {
    chips.push({
      key: "method",
      label: `method: ${preset.methodName}`,
      onClear: () => patch({ methodName: "" }),
    })
  }
  if ((preset.trackingId ?? "").trim()) {
    chips.push({
      key: "trackingId",
      label: `trackingId: ${preset.trackingId}`,
      onClear: () => patch({ trackingId: "" }),
    })
  }
  if ((preset.from ?? "").trim()) {
    chips.push({
      key: "from",
      label: `od: ${preset.from}`,
      onClear: () => patch({ from: "" }),
    })
  }
  if ((preset.to ?? "").trim()) {
    chips.push({
      key: "to",
      label: `do: ${preset.to}`,
      onClear: () => patch({ to: "" }),
    })
  }
  for (const rule of preset.rules) {
    if (!rule.enabled || !rule.value.trim()) continue
    chips.push({
      key: `rule-${rule.id}`,
      label: formatRuleChip(rule),
      onClear: () => removeRule(rule.id),
    })
  }

  return (
    <section className={cn("sticky top-0 z-20 space-y-2", className)}>
      <div className="rounded-xl border border-border bg-card/90 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col gap-2 p-2.5 sm:flex-row sm:items-center sm:gap-2 sm:p-3">
          <div className="relative min-w-0 flex-1">
            <SearchIcon
              className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="discover-search"
              value={preset.detailsContains ?? ""}
              onChange={(e) => patch({ detailsContains: e.target.value })}
              onBlur={() =>
                patch({ detailsContains: (preset.detailsContains ?? "").trim() })
              }
              placeholder="Szukaj w details…"
              className="h-9 pl-8 font-mono text-xs"
              autoComplete="off"
            />
          </div>

          <Select
            value={(preset.level ?? "").trim() || LEVEL_ALL}
            onValueChange={(v) => patch({ level: v === LEVEL_ALL ? "" : v })}
          >
            <SelectTrigger className="h-9 w-full sm:w-[7.5rem]" aria-label="Level">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={LEVEL_ALL}>Wszystkie</SelectItem>
              {LEVEL_OPTIONS.map((lvl) => (
                <SelectItem key={lvl} value={lvl}>
                  {lvl}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            value={preset.serviceInclude ?? ""}
            onChange={(e) => patch({ serviceInclude: e.target.value })}
            onBlur={() =>
              patch({ serviceInclude: (preset.serviceInclude ?? "").trim() })
            }
            placeholder="Service"
            className="h-9 w-full font-mono text-xs sm:w-[11rem]"
            list="discover-filter-services-bar"
            autoComplete="off"
            aria-label="Service"
          />
          <datalist id="discover-filter-services-bar">
            {serviceDatalist.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>

          <div className="flex flex-wrap items-center gap-1.5 sm:shrink-0">
            <Button
              type="button"
              variant={advancedActive ? "secondary" : "outline"}
              size="sm"
              onClick={() => setDrawerOpen(true)}
            >
              <SlidersHorizontalIcon data-icon="inline-start" />
              Więcej
              {advancedActive ? (
                <Badge variant="outline" className="ml-1 h-4 min-w-4 px-1 font-mono text-[9px]">
                  {activeCount > 0
                    ? activeCount
                    : [
                        (preset.methodName ?? "").trim(),
                        (preset.trackingId ?? "").trim(),
                        (preset.from ?? "").trim() || (preset.to ?? "").trim(),
                        pageSize !== 50,
                      ].filter(Boolean).length}
                </Badge>
              ) : null}
            </Button>

            <DiscoverPresetMenu
              preset={preset}
              onChange={onChange}
              onRequestPaste={() => {
                setPasteOpen(true)
                setDrawerOpen(true)
                void onPasteFromClipboard()
              }}
            />
          </div>
        </div>

        {chips.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 border-t border-border/60 px-2.5 py-2 sm:px-3">
            {chips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={chip.onClear}
                title="Usuń filtr"
                className="inline-flex max-w-full items-center gap-1 truncate rounded-md border border-border bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-foreground hover:bg-muted"
              >
                <span className="truncate">{chip.label}</span>
                <XIcon className="size-3 shrink-0 opacity-60" />
              </button>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border/80 bg-muted/15 px-3 py-2 text-xs text-muted-foreground">
          <span>
            Widoczne:{" "}
            <span className="font-medium text-foreground tabular-nums">{hits}</span>
            {" / "}
            w bazie{" "}
            <span className="font-medium text-foreground tabular-nums">{totalLabel}</span>
          </span>
          <span className="hidden sm:inline">·</span>
          <span>
            Na stronę:{" "}
            <span className="font-medium text-foreground tabular-nums">{pageSize}</span>
          </span>
          {tookMs != null ? (
            <>
              <span className="hidden sm:inline">·</span>
              <span title="Czas zapytania search">
                {tookMs}
                <span className="text-muted-foreground"> ms</span>
              </span>
            </>
          ) : null}
          <span className="hidden sm:inline">·</span>
          <span className="inline-flex items-center gap-1.5">
            Strona{" "}
            <span className="font-medium text-foreground tabular-nums">{pageIndex + 1}</span>
            <Button
              type="button"
              variant="outline"
              size="xs"
              disabled={!canPrev}
              onClick={() => onPrev?.()}
            >
              Poprzednia
            </Button>
            <Button
              type="button"
              variant="outline"
              size="xs"
              disabled={!canNext}
              onClick={() => onNext?.()}
            >
              Następna
            </Button>
          </span>
          {usingDefaultTime ? (
            <>
              <span className="hidden sm:inline">·</span>
              <span className="text-[11px]" title="Ustaw from/to, aby zawęzić zakres">
                Czas: ostatnie 7 dni (domyślnie, max 30)
              </span>
            </>
          ) : null}
          {activeCount > 0 ? (
            <>
              <span className="hidden sm:inline">·</span>
              <span className="text-[11px]" title="Reguły wykonywane na serwerze (POST /search)">
                Reguły serwerowe: {activeCount}
              </span>
            </>
          ) : null}
        </div>
      </div>

      <DiscoverFiltersDrawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <div className="space-y-4">
          {pasteOpen ? (
            <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label htmlFor="discover-paste-json" className="text-xs text-muted-foreground">
                  Wklej JSON presetu
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
                placeholder={`{\n  "version": 1,\n  "size": 50,\n  "rules": [ ... ]\n}`}
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
                  Ze schowka
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPasteText(exportFilterPreset(preset))}
                >
                  Wstaw aktualny
                </Button>
              </div>
            </div>
          ) : null}

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FilterIcon className="size-3.5" aria-hidden />
            Pola poniżej + reguły zaawansowane
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
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

            <div className="space-y-1.5">
              <Label htmlFor="discover-method-name" className="text-xs text-muted-foreground">
                methodName
              </Label>
              <Input
                id="discover-method-name"
                value={preset.methodName ?? ""}
                onChange={(e) => patch({ methodName: e.target.value })}
                onBlur={() => patch({ methodName: (preset.methodName ?? "").trim() })}
                placeholder="np. fetchTeams"
                className="h-9 font-mono text-xs"
                list="discover-filter-methods"
                autoComplete="off"
              />
              <datalist id="discover-filter-methods">
                {methodDatalist.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="discover-tracking-id" className="text-xs text-muted-foreground">
                trackingId
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
                Od (max 30 dni)
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
                Do
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
                  Reguły zaawansowane
                  {activeCount > 0 ? (
                    <span className="ml-1 font-mono text-foreground">({activeCount})</span>
                  ) : null}
                </Label>
              </button>

              <div className="flex flex-wrap gap-1.5">
                {preset.rules.length > 0 ? (
                  <Button type="button" variant="ghost" size="xs" onClick={clearRules}>
                    <XIcon data-icon="inline-start" />
                    Wyczyść reguły
                  </Button>
                ) : null}
                <Button type="button" variant="secondary" size="xs" onClick={addRule}>
                  <PlusIcon data-icon="inline-start" />
                  Dodaj regułę
                </Button>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground">
              AND · CONTAINS / IS LIKE — filtrują lokalnie wśród max. 500 najnowszych
            </p>

            {rulesCollapsed ? (
              <div className="rounded-lg border border-border/70 bg-background/40 px-3 py-2.5">
                {visibleRules.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Brak reguł.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {visibleRules.map((rule) => (
                      <button
                        key={rule.id}
                        type="button"
                        title="Rozwiń edycję"
                        onClick={() => setRulesCollapsed(false)}
                        className={cn(
                          "max-w-full truncate rounded-md border px-1.5 py-0.5 font-mono text-[10px] transition-colors",
                          rule.enabled && rule.value.trim()
                            ? "border-border bg-muted/50 text-foreground hover:bg-muted"
                            : "border-dashed border-border/70 text-muted-foreground hover:bg-muted/40",
                          !rule.enabled && "line-through opacity-60",
                        )}
                      >
                        {rule.value.trim() ? formatRuleChip(rule) : `${rule.field} (draft)`}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : visibleRules.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/80 bg-background/40 px-3 py-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Brak reguł — dodaj np.{" "}
                  <span className="font-mono text-foreground">
                    document NOT CONTAINS TEST
                  </span>
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
                {visibleRules.map((rule, index) => (
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

                    <div className="grid gap-2 overflow-visible sm:grid-cols-2">
                      <div className="relative z-10 space-y-1 overflow-visible sm:col-span-2">
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

                      <div className="space-y-1 sm:col-span-2">
                        <Label className="text-[10px] text-muted-foreground">Value</Label>
                        <Input
                          value={rule.value}
                          onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                          onBlur={() => {
                            if (!rule.value.trim() && preset.rules.length > 1) {
                              patch({
                                rules: pruneEmptyRules(preset.rules, {
                                  keepOneDraft: true,
                                }),
                              })
                            }
                          }}
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

          {hasApiFilterFields(preset) || activeCount > 0 ? (
            <p className="text-[11px] text-muted-foreground">
              Tip: „Wyczyść wszystko” jest w menu Preset. „Wyczyść reguły” czyści tylko reguły
              zaawansowane.
            </p>
          ) : null}
        </div>
      </DiscoverFiltersDrawer>
    </section>
  )
}

function mergeUniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, "pl"),
  )
}

function datetimeLocalToIso(value: string): string {
  if (!value.trim()) return ""
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ""
  return d.toISOString()
}

function isoToDatetimeLocal(iso?: string): string {
  if (!iso?.trim()) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
