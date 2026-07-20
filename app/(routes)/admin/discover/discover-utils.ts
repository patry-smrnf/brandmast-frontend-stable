import type { ServiceLogLevel, ServiceLogResponse } from "@/lib/api/generated/types"

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

/** Keep newest-first for Discover table. */
export function sortLogsNewestFirst(logs: ServiceLogResponse[]): ServiceLogResponse[] {
  return [...logs].sort((a, b) => {
    const tb = b.createdAt ? Date.parse(b.createdAt) : 0
    const ta = a.createdAt ? Date.parse(a.createdAt) : 0
    if (tb !== ta) return tb - ta
    return (b.id ?? 0) - (a.id ?? 0)
  })
}
