import type { ServiceLogResponse } from "@/lib/api/generated/types"

export type DiscoverFilterOperator = "contains" | "like"

export type DiscoverFilterFieldId =
  | "message"
  | "serviceName"
  | "methodName"
  | "level"
  | "trackingId"
  | "jobId"
  | "createdAt"
  | "id"
  | "details"
  | (string & {})

export type DiscoverFilterRule = {
  id: string
  field: string
  operator: DiscoverFilterOperator
  /** When true → NOT contains / NOT like */
  negate: boolean
  value: string
  enabled: boolean
}

export type DiscoverFilterPreset = {
  version: 1
  name?: string
  exportedAt?: string
  /** Page size for GET /api/logs (`size`). Legacy key `limit` still accepted on import. */
  size?: number
  /** @deprecated Prefer `size` — kept for older localStorage / exports. */
  limit?: number
  /** Optional API-side include (exact serviceName). */
  serviceInclude?: string
  /** Optional API-side exact methodName. */
  methodName?: string
  /** Optional API-side exact level (case-insensitive). */
  level?: string
  /** Optional API-side contains in serialized details JSON. */
  detailsContains?: string
  /** Optional API-side trackingId filter (request correlation). */
  trackingId?: string
  /** Optional API from (ISO-8601). */
  from?: string
  /** Optional API to (ISO-8601). */
  to?: string
  rules: DiscoverFilterRule[]
}

export type DiscoverFilterFieldOption = {
  id: string
  label: string
  description: string
}

export const DISCOVER_FILTER_FIELDS: readonly DiscoverFilterFieldOption[] = [
  {
    id: "document",
    label: "document",
    description: "Cały log: message + service + details JSON (zalecane)",
  },
  { id: "message", label: "message", description: "Tylko pole message (bez details)" },
  { id: "serviceName", label: "serviceName", description: "Nazwa serwisu" },
  { id: "methodName", label: "methodName", description: "Nazwa metody / operacji" },
  { id: "level", label: "level", description: "TRACE / DEBUG / INFO / WARN / ERROR" },
  { id: "trackingId", label: "trackingId", description: "UUID śledzenia" },
  { id: "jobId", label: "jobId", description: "UUID joba" },
  { id: "createdAt", label: "createdAt", description: "Timestamp ISO" },
  { id: "id", label: "id", description: "Numeryczne id logu" },
  {
    id: "details",
    label: "details",
    description: "Cały obiekt details (JSON string)",
  },
] as const

export const DISCOVER_FILTER_OPERATORS: readonly {
  id: DiscoverFilterOperator
  label: string
  hint: string
}[] = [
  { id: "contains", label: "CONTAINS", hint: "Podciągi (case-insensitive)" },
  {
    id: "like",
    label: "IS LIKE",
    hint: "Wzorzec z % i _ (jak SQL LIKE), * = %",
  },
] as const

export const FILTERS_STORAGE_KEY = "brandmast.discover.filters.v1"
export const NAMED_PRESETS_STORAGE_KEY = "brandmast.discover.presets.v1"

export type DiscoverNamedPreset = {
  id: string
  name: string
  preset: DiscoverFilterPreset
  savedAt: string
}

export function createEmptyRule(partial?: Partial<DiscoverFilterRule>): DiscoverFilterRule {
  return {
    id: createRuleId(),
    field: "document",
    operator: "contains",
    negate: false,
    value: "",
    enabled: true,
    ...partial,
  }
}

export function createDefaultFilterPreset(): DiscoverFilterPreset {
  return {
    version: 1,
    size: 50,
    serviceInclude: "",
    methodName: "",
    level: "",
    detailsContains: "",
    trackingId: "",
    from: "",
    to: "",
    rules: [],
  }
}

function createRuleId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `rule_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`
}

export function suggestFilterFields(query: string): DiscoverFilterFieldOption[] {
  const q = query.trim().toLowerCase()
  const extras: DiscoverFilterFieldOption[] = [
    {
      id: "details.",
      label: "details.*",
      description: "Ścieżka w details, np. details.login",
    },
  ]
  const all = [...DISCOVER_FILTER_FIELDS, ...extras]

  if (!q) return all

  const matched = all.filter(
    (f) =>
      f.id.toLowerCase().includes(q) ||
      f.label.toLowerCase().includes(q) ||
      f.description.toLowerCase().includes(q),
  )

  const trimmed = query.trim()
  const knownIds = new Set(all.map((f) => f.id.toLowerCase()))
  if (
    trimmed &&
    !knownIds.has(trimmed.toLowerCase()) &&
    !matched.some((f) => f.id.toLowerCase() === trimmed.toLowerCase())
  ) {
    matched.push({
      id: trimmed.startsWith("details.") ? trimmed : `details.${trimmed}`,
      label: trimmed.startsWith("details.") ? trimmed : `details.${trimmed}`,
      description: `Pole w JSON details (np. login → details.${trimmed})`,
    })
    if (!trimmed.startsWith("details.")) {
      matched.push({
        id: trimmed,
        label: trimmed,
        description: "Klucz w details (wyszukiwanie głębokie po nazwie)",
      })
    }
  }

  return matched
}

function getByPath(obj: unknown, path: string): unknown {
  if (!path) return obj
  const parts = path.split(".").filter(Boolean)
  let cur: unknown = obj
  for (const part of parts) {
    if (cur == null || typeof cur !== "object") return undefined
    cur = (cur as Record<string, unknown>)[part]
  }
  return cur
}

function valueToSearchString(value: unknown): string {
  if (value == null) return ""
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

/** Collect all values for a given key anywhere inside details JSON. */
function findValuesByKeyDeep(obj: unknown, key: string, out: string[]) {
  if (obj == null || typeof obj !== "object") return
  if (Array.isArray(obj)) {
    for (const item of obj) findValuesByKeyDeep(item, key, out)
    return
  }
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (k === key) {
      const s = valueToSearchString(v)
      if (s) out.push(s)
    }
    findValuesByKeyDeep(v, key, out)
  }
}

function documentHaystack(log: ServiceLogResponse): string {
  const parts = [
    log.message,
    log.serviceName,
    log.methodName,
    log.level,
    log.trackingId,
    log.jobId,
    log.createdAt,
    log.id != null ? String(log.id) : "",
    log.details ? valueToSearchString(log.details) : "",
  ]
  return parts.filter(Boolean).join(" ")
}

/** Resolve rule field → comparable string(s) from a log. */
export function resolveLogFieldValue(log: ServiceLogResponse, field: string): string {
  const f = field.trim()
  if (!f) return ""

  if (f === "document" || f === "_all" || f === "*") return documentHaystack(log)
  if (f === "id") return log.id != null ? String(log.id) : ""
  if (f === "message") return log.message ?? ""
  if (f === "serviceName" || f === "service") return log.serviceName ?? ""
  if (f === "methodName" || f === "method") return log.methodName ?? ""
  if (f === "level") return log.level ?? ""
  if (f === "trackingId") return log.trackingId ?? ""
  if (f === "jobId") return log.jobId ?? ""
  if (f === "createdAt") return log.createdAt ?? ""
  if (f === "details") return log.details ? valueToSearchString(log.details) : ""

  if (f.startsWith("details.")) {
    const path = f.slice("details.".length)
    return valueToSearchString(getByPath(log.details, path))
  }

  // Fallback: top-level log key
  const top = (log as Record<string, unknown>)[f]
  if (top != null && f !== "details") {
    return valueToSearchString(top)
  }

  // Deep search in details by key name (e.g. field "login" → details.login / nested)
  const deep: string[] = []
  findValuesByKeyDeep(log.details, f, deep)
  if (deep.length > 0) return deep.join(" ")

  return ""
}

function likePatternToRegExp(pattern: string): RegExp {
  // Support * as % for convenience
  const normalized = pattern.replace(/\*/g, "%")
  let out = ""
  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i]
    if (ch === "%") out += ".*"
    else if (ch === "_") out += "."
    else out += escapeRegExp(ch)
  }
  return new RegExp(`^${out}$`, "i")
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

export function matchFilterRule(log: ServiceLogResponse, rule: DiscoverFilterRule): boolean {
  if (!rule.enabled) return true
  const needle = rule.value
  // Empty value → ignore rule (treat as pass) so drafts don't wipe the list
  if (!needle.trim()) return true

  const haystack = resolveLogFieldValue(log, rule.field)
  let hit = false

  if (rule.operator === "contains") {
    hit = haystack.toLowerCase().includes(needle.toLowerCase())
  } else {
    try {
      hit = likePatternToRegExp(needle).test(haystack)
    } catch {
      hit = false
    }
  }

  return rule.negate ? !hit : hit
}

/** All enabled rules must match (AND). Prefer server Filter AST via POST /search. */
export function filterLogsByRules(
  logs: ServiceLogResponse[],
  rules: DiscoverFilterRule[],
): ServiceLogResponse[] {
  const active = rules.filter((r) => r.enabled && r.value.trim().length > 0)
  if (active.length === 0) return logs
  return logs.filter((log) => active.every((rule) => matchFilterRule(log, rule)))
}

export function countActiveRules(rules: DiscoverFilterRule[]): number {
  return rules.filter((r) => r.enabled && r.value.trim().length > 0).length
}

/** Drop empty draft rules; optionally keep a single trailing draft slot. */
export function pruneEmptyRules(
  rules: DiscoverFilterRule[],
  opts?: { keepOneDraft?: boolean },
): DiscoverFilterRule[] {
  const nonEmpty = rules.filter((r) => r.value.trim().length > 0)
  if (!opts?.keepOneDraft) return nonEmpty
  const draft = rules.find((r) => !r.value.trim())
  if (draft) return [...nonEmpty, draft]
  return nonEmpty
}

export function clearRulesOnly(preset: DiscoverFilterPreset): DiscoverFilterPreset {
  return { ...preset, rules: [] }
}

export function clearAllFilters(preset: DiscoverFilterPreset): DiscoverFilterPreset {
  const defaults = createDefaultFilterPreset()
  return {
    ...defaults,
    // Reset size to default as per plan
    size: defaults.size,
    limit: defaults.size,
    name: preset.name,
  }
}

export function hasApiFilterFields(preset: DiscoverFilterPreset): boolean {
  return Boolean(
    (preset.serviceInclude ?? "").trim() ||
      (preset.methodName ?? "").trim() ||
      (preset.level ?? "").trim() ||
      (preset.detailsContains ?? "").trim() ||
      (preset.trackingId ?? "").trim() ||
      (preset.from ?? "").trim() ||
      (preset.to ?? "").trim(),
  )
}

/** Terms to highlight in list rows (search + active contains rules). */
export function collectHighlightTerms(preset: DiscoverFilterPreset): string[] {
  const terms: string[] = []
  const q = (preset.detailsContains ?? "").trim()
  if (q) terms.push(q)
  for (const rule of preset.rules) {
    if (!rule.enabled || rule.negate || rule.operator !== "contains") continue
    const v = rule.value.trim()
    if (v) terms.push(v)
  }
  // Dedupe case-insensitively, longest first for nested matches
  const seen = new Set<string>()
  const unique: string[] = []
  for (const t of terms.sort((a, b) => b.length - a.length)) {
    const key = t.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(t)
  }
  return unique
}

export function presetToSearchParams(preset: DiscoverFilterPreset): URLSearchParams {
  const params = new URLSearchParams()
  const size = resolvePresetSize(preset)
  if (size !== 50) params.set("size", String(size))
  const service = (preset.serviceInclude ?? "").trim()
  if (service) params.set("service", service)
  const method = (preset.methodName ?? "").trim()
  if (method) params.set("method", method)
  const level = (preset.level ?? "").trim()
  if (level) params.set("level", level)
  const q = (preset.detailsContains ?? "").trim()
  if (q) params.set("q", q)
  const trackingId = (preset.trackingId ?? "").trim()
  if (trackingId) params.set("trackingId", trackingId)
  const from = (preset.from ?? "").trim()
  if (from) params.set("from", from)
  const to = (preset.to ?? "").trim()
  if (to) params.set("to", to)
  return params
}

export function presetFromSearchParams(
  params: URLSearchParams,
  base?: DiscoverFilterPreset,
): DiscoverFilterPreset {
  const next = base ? { ...base } : createDefaultFilterPreset()
  if (params.has("service")) next.serviceInclude = params.get("service") ?? ""
  if (params.has("method")) next.methodName = params.get("method") ?? ""
  if (params.has("level")) next.level = params.get("level") ?? ""
  if (params.has("q")) next.detailsContains = params.get("q") ?? ""
  if (params.has("trackingId")) next.trackingId = params.get("trackingId") ?? ""
  if (params.has("from")) next.from = params.get("from") ?? ""
  if (params.has("to")) next.to = params.get("to") ?? ""
  if (params.has("size")) {
    const n = Number(params.get("size"))
    if (Number.isFinite(n)) {
      const size = Math.min(500, Math.max(1, Math.trunc(n)))
      next.size = size
      next.limit = size
    }
  }
  return next
}

export function searchParamsHaveFilters(params: URLSearchParams): boolean {
  return (
    params.has("service") ||
    params.has("method") ||
    params.has("level") ||
    params.has("q") ||
    params.has("trackingId") ||
    params.has("from") ||
    params.has("to") ||
    params.has("size")
  )
}

function createNamedPresetId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `preset_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`
}

export function loadNamedPresets(): DiscoverNamedPreset[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(NAMED_PRESETS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    const out: DiscoverNamedPreset[] = []
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue
      const r = item as Record<string, unknown>
      const name = typeof r.name === "string" ? r.name.trim() : ""
      const preset = normalizeFilterPreset(r.preset)
      if (!name || !preset) continue
      out.push({
        id: typeof r.id === "string" && r.id ? r.id : createNamedPresetId(),
        name,
        preset,
        savedAt: typeof r.savedAt === "string" ? r.savedAt : new Date().toISOString(),
      })
    }
    return out
  } catch {
    return []
  }
}

export function saveNamedPresets(presets: DiscoverNamedPreset[]) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(NAMED_PRESETS_STORAGE_KEY, JSON.stringify(presets))
  } catch {
    // ignore
  }
}

export function upsertNamedPreset(
  list: DiscoverNamedPreset[],
  name: string,
  preset: DiscoverFilterPreset,
  existingId?: string,
): DiscoverNamedPreset[] {
  const trimmed = name.trim()
  if (!trimmed) return list
  const size = resolvePresetSize(preset)
  const stored: DiscoverFilterPreset = {
    version: 1,
    name: trimmed,
    size,
    limit: size,
    serviceInclude: preset.serviceInclude ?? "",
    methodName: preset.methodName ?? "",
    level: preset.level ?? "",
    detailsContains: preset.detailsContains ?? "",
    trackingId: preset.trackingId ?? "",
    from: preset.from ?? "",
    to: preset.to ?? "",
    rules: preset.rules,
  }
  const now = new Date().toISOString()
  if (existingId) {
    return list.map((p) =>
      p.id === existingId ? { ...p, name: trimmed, preset: stored, savedAt: now } : p,
    )
  }
  const sameName = list.find((p) => p.name.toLowerCase() === trimmed.toLowerCase())
  if (sameName) {
    return list.map((p) =>
      p.id === sameName.id ? { ...p, name: trimmed, preset: stored, savedAt: now } : p,
    )
  }
  return [
    ...list,
    { id: createNamedPresetId(), name: trimmed, preset: stored, savedAt: now },
  ]
}

export function deleteNamedPreset(
  list: DiscoverNamedPreset[],
  id: string,
): DiscoverNamedPreset[] {
  return list.filter((p) => p.id !== id)
}

function isOperator(v: unknown): v is DiscoverFilterOperator {
  return v === "contains" || v === "like"
}

export function normalizeFilterPreset(input: unknown): DiscoverFilterPreset | null {
  if (!input || typeof input !== "object") return null
  const raw = input as Record<string, unknown>
  const rulesRaw = Array.isArray(raw.rules) ? raw.rules : []
  const rules: DiscoverFilterRule[] = []

  for (const item of rulesRaw) {
    if (!item || typeof item !== "object") continue
    const r = item as Record<string, unknown>
    const field = typeof r.field === "string" ? r.field.trim() : ""
    if (!field) continue
    const operator = isOperator(r.operator) ? r.operator : "contains"
    rules.push({
      id: typeof r.id === "string" && r.id ? r.id : createRuleId(),
      field,
      operator,
      negate: Boolean(r.negate),
      value: typeof r.value === "string" ? r.value : String(r.value ?? ""),
      enabled: r.enabled === undefined ? true : Boolean(r.enabled),
    })
  }

  const sizeRaw =
    typeof raw.size === "number" && Number.isFinite(raw.size)
      ? raw.size
      : typeof raw.limit === "number" && Number.isFinite(raw.limit)
        ? raw.limit
        : undefined
  const size =
    sizeRaw != null ? Math.min(500, Math.max(1, Math.trunc(sizeRaw))) : undefined

  return {
    version: 1,
    name: typeof raw.name === "string" ? raw.name : undefined,
    exportedAt: typeof raw.exportedAt === "string" ? raw.exportedAt : undefined,
    size,
    limit: size, // backward-compatible mirror
    serviceInclude: typeof raw.serviceInclude === "string" ? raw.serviceInclude : "",
    methodName: typeof raw.methodName === "string" ? raw.methodName : "",
    level: typeof raw.level === "string" ? raw.level : "",
    detailsContains: typeof raw.detailsContains === "string" ? raw.detailsContains : "",
    trackingId: typeof raw.trackingId === "string" ? raw.trackingId : "",
    from: typeof raw.from === "string" ? raw.from : "",
    to: typeof raw.to === "string" ? raw.to : "",
    rules,
  }
}

export function resolvePresetSize(preset: DiscoverFilterPreset): number {
  const n = preset.size ?? preset.limit ?? 50
  if (!Number.isFinite(n)) return 50
  return Math.min(500, Math.max(1, Math.trunc(n)))
}

export function loadFilterPreset(): DiscoverFilterPreset {
  if (typeof window === "undefined") return createDefaultFilterPreset()
  try {
    const raw = window.localStorage.getItem(FILTERS_STORAGE_KEY)
    if (!raw) return createDefaultFilterPreset()
    const parsed = normalizeFilterPreset(JSON.parse(raw))
    return parsed ?? createDefaultFilterPreset()
  } catch {
    return createDefaultFilterPreset()
  }
}

export function saveFilterPreset(preset: DiscoverFilterPreset) {
  if (typeof window === "undefined") return
  try {
    const size = resolvePresetSize(preset)
    const toSave: DiscoverFilterPreset = {
      version: 1,
      size,
      limit: size,
      serviceInclude: preset.serviceInclude ?? "",
      methodName: preset.methodName ?? "",
      level: preset.level ?? "",
      detailsContains: preset.detailsContains ?? "",
      trackingId: preset.trackingId ?? "",
      from: preset.from ?? "",
      to: preset.to ?? "",
      rules: preset.rules,
    }
    window.localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(toSave))
  } catch {
    // ignore
  }
}

export function exportFilterPreset(preset: DiscoverFilterPreset, name?: string): string {
  const size = resolvePresetSize(preset)
  const payload: DiscoverFilterPreset = {
    version: 1,
    name: name?.trim() || preset.name || "discover-filters",
    exportedAt: new Date().toISOString(),
    size,
    limit: size,
    serviceInclude: preset.serviceInclude ?? "",
    methodName: preset.methodName ?? "",
    level: preset.level ?? "",
    detailsContains: preset.detailsContains ?? "",
    trackingId: preset.trackingId ?? "",
    from: preset.from ?? "",
    to: preset.to ?? "",
    rules: preset.rules.map(({ id, field, operator, negate, value, enabled }) => ({
      id,
      field,
      operator,
      negate,
      value,
      enabled,
    })),
  }
  return JSON.stringify(payload, null, 2)
}

export function importFilterPreset(jsonText: string): DiscoverFilterPreset {
  const parsed = JSON.parse(jsonText) as unknown
  const normalized = normalizeFilterPreset(parsed)
  if (!normalized) throw new Error("Nieprawidłowy format presetu filtrów")
  return normalized
}

export function formatRuleChip(rule: DiscoverFilterRule): string {
  const op = rule.operator === "like" ? "LIKE" : "CONTAINS"
  const neg = rule.negate ? "NOT " : ""
  const val = rule.value.trim() ? JSON.stringify(rule.value) : '""'
  return `${rule.field} ${neg}${op} ${val}`
}
