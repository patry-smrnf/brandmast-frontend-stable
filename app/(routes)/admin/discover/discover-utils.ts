import type { ServiceLogLevel, ServiceLogResponse } from "@/lib/api/generated/types"

/** Known exact-match serviceName values (API may grow beyond this). */
export const KNOWN_SERVICE_NAMES = [
  "AuthService",
  "JwtService",
  "BonusService",
  "BrandmasterService",
  "SettingsService",
  "ShopService",
  "ActionService",
  "ActionBrandmasterService",
  "ActionSupervisorService",
  "CasService",
  "OneTwo1Service",
  "CasTourPlannerClient",
  "OneTwoOneClient",
  "OneTwoOneSsoLoginFlow",
] as const

export function getLogLogin(log: ServiceLogResponse): string | null {
  const details = log.details
  if (!details || typeof details !== "object") return null
  const login = (details as Record<string, unknown>).login
  if (typeof login === "string" && login.trim()) return login.trim()
  return null
}

export type LogMarkColor =
  | "red"
  | "orange"
  | "amber"
  | "green"
  | "cyan"
  | "blue"
  | "violet"
  | "pink"

export const LOG_MARK_COLORS: readonly LogMarkColor[] = [
  "red",
  "orange",
  "amber",
  "green",
  "cyan",
  "blue",
  "violet",
  "pink",
] as const

export const LOG_MARK_COLOR_CLASS: Record<
  LogMarkColor,
  { swatch: string; row: string; border: string }
> = {
  red: {
    swatch: "bg-red-500",
    row: "bg-red-500/8 hover:bg-red-500/12",
    border: "border-l-red-500",
  },
  orange: {
    swatch: "bg-orange-500",
    row: "bg-orange-500/8 hover:bg-orange-500/12",
    border: "border-l-orange-500",
  },
  amber: {
    swatch: "bg-amber-500",
    row: "bg-amber-500/8 hover:bg-amber-500/12",
    border: "border-l-amber-500",
  },
  green: {
    swatch: "bg-emerald-500",
    row: "bg-emerald-500/8 hover:bg-emerald-500/12",
    border: "border-l-emerald-500",
  },
  cyan: {
    swatch: "bg-cyan-500",
    row: "bg-cyan-500/8 hover:bg-cyan-500/12",
    border: "border-l-cyan-500",
  },
  blue: {
    swatch: "bg-blue-500",
    row: "bg-blue-500/8 hover:bg-blue-500/12",
    border: "border-l-blue-500",
  },
  violet: {
    swatch: "bg-violet-500",
    row: "bg-violet-500/8 hover:bg-violet-500/12",
    border: "border-l-violet-500",
  },
  pink: {
    swatch: "bg-pink-500",
    row: "bg-pink-500/8 hover:bg-pink-500/12",
    border: "border-l-pink-500",
  },
}

const COLORS_STORAGE_KEY = "brandmast.discover.logColors"

export function logRowKey(log: ServiceLogResponse): string {
  if (log.id != null) return `id:${log.id}`
  return `t:${log.createdAt ?? ""}|${log.trackingId ?? ""}|${log.serviceName ?? ""}|${log.methodName ?? ""}|${log.message ?? ""}`
}

export function loadLogColors(): Record<string, LogMarkColor> {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(COLORS_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const out: Record<string, LogMarkColor> = {}
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "string" && (LOG_MARK_COLORS as readonly string[]).includes(value)) {
        out[key] = value as LogMarkColor
      }
    }
    return out
  } catch {
    return {}
  }
}

export function saveLogColors(map: Record<string, LogMarkColor>) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(COLORS_STORAGE_KEY, JSON.stringify(map))
  } catch {
    // ignore quota / private mode
  }
}

export function logSearchHaystack(log: ServiceLogResponse): string {
  const parts = [
    log.message,
    log.serviceName,
    log.methodName,
    log.level,
    log.trackingId,
    log.jobId,
    log.details ? JSON.stringify(log.details) : "",
  ]
  return parts.filter(Boolean).join(" ").toLowerCase()
}

export function filterLogsByText(logs: ServiceLogResponse[], query: string): ServiceLogResponse[] {
  const q = query.trim().toLowerCase()
  if (!q) return logs
  return logs.filter((log) => logSearchHaystack(log).includes(q))
}

/** Drop logs whose serviceName matches (exact, trimmed). */
export function filterLogsExcludingService(
  logs: ServiceLogResponse[],
  excludeService: string,
): ServiceLogResponse[] {
  const excluded = excludeService.trim()
  if (!excluded) return logs
  return logs.filter((log) => (log.serviceName?.trim() ?? "") !== excluded)
}

export function collectServiceNames(logs: ServiceLogResponse[]): string[] {
  const set = new Set<string>()
  for (const log of logs) {
    const name = log.serviceName?.trim()
    if (name) set.add(name)
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, "pl"))
}

export function collectMethodNames(logs: ServiceLogResponse[]): string[] {
  const set = new Set<string>()
  for (const log of logs) {
    const name = log.methodName?.trim()
    if (name) set.add(name)
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, "pl"))
}

/** Case-insensitive contains in serialized details JSON (mirrors API `detailsContains`). */
export function logDetailsContains(log: ServiceLogResponse, needle: string): boolean {
  const q = needle.trim().toLowerCase()
  if (!q) return true
  try {
    const serialized = JSON.stringify(log.details ?? null) ?? ""
    return serialized.toLowerCase().includes(q)
  } catch {
    return false
  }
}

/** Merge service name lists (e.g. visible + previously seen / excluded). */
export function mergeServiceNameLists(...lists: string[][]): string[] {
  const set = new Set<string>()
  for (const list of lists) {
    for (const name of list) {
      const t = name.trim()
      if (t) set.add(t)
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, "pl"))
}

/**
 * Safe pretty-print for log details. Avoids throwing on exotic values
 * and soft-wraps very long strings so the UI doesn't break.
 */
export function formatJsonForDisplay(value: unknown, space = 2): string {
  try {
    return JSON.stringify(
      value,
      (_key, v) => {
        if (typeof v === "bigint") return v.toString()
        if (typeof v === "string" && v.length > 8_000) {
          return `${v.slice(0, 8_000)}… [truncated ${v.length - 8_000} chars]`
        }
        return v
      },
      space,
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : "Nie udało się zserializować JSON"
    try {
      return String(value)
    } catch {
      return `/* ${message} */`
    }
  }
}

export function levelBadgeVariant(
  level: ServiceLogLevel | null | undefined,
): "default" | "secondary" | "outline" | "success" | "warning" | "destructive" {
  switch (level) {
    case "ERROR":
      return "destructive"
    case "WARN":
      return "warning"
    case "INFO":
      return "success"
    case "DEBUG":
    case "TRACE":
      return "secondary"
    default:
      return "outline"
  }
}

export function formatLogTime(iso: string | null | undefined): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString("pl-PL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

export function formatLogTimeShort(iso: string | null | undefined): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

/** Day key YYYY-MM-DD in local timezone (for separators). */
export function logDayKey(iso: string | null | undefined): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function formatLogDayLabel(iso: string | null | undefined): string {
  if (!iso) return "Bez daty"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const key = logDayKey(iso)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (key === localDayKey(today)) return "Dzisiaj"
  if (key === localDayKey(yesterday)) return "Wczoraj"
  return d.toLocaleDateString("pl-PL", {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function localDayKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Relative time for fresh live rows (&lt; ~5 min). */
export function formatRelativeTime(
  iso: string | null | undefined,
  nowMs: number = Date.now(),
): string | null {
  if (!iso) return null
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return null
  const diffSec = Math.round((nowMs - t) / 1000)
  if (diffSec < 0 || diffSec > 5 * 60) return null
  if (diffSec < 5) return "przed chwilą"
  if (diffSec < 60) return `${diffSec} s temu`
  const mins = Math.floor(diffSec / 60)
  return `${mins} min temu`
}

/** Split text into plain / highlight segments for filter hit marking. */
export function splitHighlightSegments(
  text: string,
  terms: string[],
): { text: string; hit: boolean }[] {
  if (!text || terms.length === 0) return [{ text, hit: false }]
  const lower = text.toLowerCase()
  const ranges: { start: number; end: number }[] = []
  for (const term of terms) {
    if (!term) continue
    const needle = term.toLowerCase()
    let from = 0
    while (from < lower.length) {
      const idx = lower.indexOf(needle, from)
      if (idx < 0) break
      ranges.push({ start: idx, end: idx + needle.length })
      from = idx + Math.max(needle.length, 1)
    }
  }
  if (ranges.length === 0) return [{ text, hit: false }]
  ranges.sort((a, b) => a.start - b.start || b.end - a.end)
  const merged: { start: number; end: number }[] = []
  for (const r of ranges) {
    const last = merged[merged.length - 1]
    if (last && r.start <= last.end) {
      last.end = Math.max(last.end, r.end)
    } else {
      merged.push({ ...r })
    }
  }
  const parts: { text: string; hit: boolean }[] = []
  let cursor = 0
  for (const r of merged) {
    if (r.start > cursor) {
      parts.push({ text: text.slice(cursor, r.start), hit: false })
    }
    parts.push({ text: text.slice(r.start, r.end), hit: true })
    cursor = r.end
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), hit: false })
  return parts
}

/** Keep newest-first for Discover table. */
export function sortLogsNewestFirst(logs: ServiceLogResponse[]): ServiceLogResponse[] {
  return [...logs].sort((a, b) => {
    const tb = b.createdAt ? Date.parse(b.createdAt) : 0
    const ta = a.createdAt ? Date.parse(a.createdAt) : 0
    if (tb !== ta) return tb - ta
    return (b.id ?? 0) - (a.id ?? 0)
  })
}
