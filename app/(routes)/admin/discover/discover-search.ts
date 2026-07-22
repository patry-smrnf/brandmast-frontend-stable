import type {
  LogFilterClauseOperator,
  LogFilterNode,
  LogsSearchRequest,
  LogsSearchTimeRange,
  ServiceLogResponse,
} from "@/lib/api"
import {
  countActiveRules,
  hasApiFilterFields,
  matchFilterRule,
  resolvePresetSize,
  type DiscoverFilterPreset,
  type DiscoverFilterRule,
} from "./discover-filters"
import { logDetailsContains } from "./discover-utils"

/** Backend hard limits (Faza A). */
export const DISCOVER_MAX_RANGE_DAYS = 30
export const DISCOVER_DEFAULT_RANGE_DAYS = 7
export const DISCOVER_MAX_AST_NODES = 32
export const DISCOVER_MAX_VALUE_LENGTH = 512
export const DISCOVER_MAX_AST_DEPTH = 5

const MS_PER_DAY = 24 * 60 * 60 * 1000

function truncateValue(value: string): string {
  if (value.length <= DISCOVER_MAX_VALUE_LENGTH) return value
  return value.slice(0, DISCOVER_MAX_VALUE_LENGTH)
}

function isFiniteDate(d: Date): boolean {
  return !Number.isNaN(d.getTime())
}

/**
 * Resolve required search time window.
 * Missing bounds default to last {@link DISCOVER_DEFAULT_RANGE_DAYS} ending at `to` (or now).
 * Ranges wider than {@link DISCOVER_MAX_RANGE_DAYS} are clamped from `to` backwards.
 */
export function resolveDiscoverTimeRange(
  from?: string | null,
  to?: string | null,
  nowMs: number = Date.now(),
): LogsSearchTimeRange {
  const now = new Date(nowMs)
  let toDate = to?.trim() ? new Date(to) : now
  if (!isFiniteDate(toDate)) toDate = now

  let fromDate = from?.trim()
    ? new Date(from)
    : new Date(toDate.getTime() - DISCOVER_DEFAULT_RANGE_DAYS * MS_PER_DAY)
  if (!isFiniteDate(fromDate)) {
    fromDate = new Date(toDate.getTime() - DISCOVER_DEFAULT_RANGE_DAYS * MS_PER_DAY)
  }

  if (fromDate.getTime() > toDate.getTime()) {
    const tmp = fromDate
    fromDate = toDate
    toDate = tmp
  }

  const maxSpan = DISCOVER_MAX_RANGE_DAYS * MS_PER_DAY
  if (toDate.getTime() - fromDate.getTime() > maxSpan) {
    fromDate = new Date(toDate.getTime() - maxSpan)
  }

  return {
    from: fromDate.toISOString(),
    to: toDate.toISOString(),
  }
}

function pushClause(
  children: LogFilterNode[],
  field: string,
  operator: LogFilterClauseOperator,
  value: string,
  negate?: boolean,
) {
  const v = truncateValue(value.trim())
  if (!v) return
  if (children.length >= DISCOVER_MAX_AST_NODES) return
  children.push({
    type: "clause",
    field,
    operator,
    value: v,
    ...(negate ? { negate: true } : {}),
  })
}

/**
 * Map Discover UI preset (API fields + local rules) → Filter AST v1.
 * Empty draft rules are skipped (avoids backend 400 on empty clause value).
 */
export function presetToFilterAst(preset: DiscoverFilterPreset): LogFilterNode | null {
  const children: LogFilterNode[] = []

  const service = (preset.serviceInclude ?? "").trim()
  if (service) {
    pushClause(children, "serviceName", "eq", service)
  }

  const level = (preset.level ?? "").trim()
  if (level && children.length < DISCOVER_MAX_AST_NODES) {
    children.push({
      type: "terms",
      field: "level",
      values: [truncateValue(level)],
    })
  }

  const methodName = (preset.methodName ?? "").trim()
  if (methodName) {
    pushClause(children, "methodName", "eq", methodName)
  }

  const trackingId = (preset.trackingId ?? "").trim()
  if (trackingId) {
    pushClause(children, "trackingId", "eq", trackingId)
  }

  const detailsContains = (preset.detailsContains ?? "").trim()
  if (detailsContains) {
    pushClause(children, "details", "contains", detailsContains)
  }

  for (const rule of preset.rules) {
    if (children.length >= DISCOVER_MAX_AST_NODES) break
    if (!rule.enabled) continue
    const value = rule.value.trim()
    if (!value) continue
    const field = rule.field.trim()
    if (!field) continue
    const operator: LogFilterClauseOperator =
      rule.operator === "like" ? "like" : "contains"
    pushClause(children, field, operator, value, rule.negate)
  }

  if (children.length === 0) return null
  return { type: "group", op: "and", children }
}

export type BuildLogsSearchParams = {
  preset: DiscoverFilterPreset
  /** Cursor for next page (search_after). */
  after?: string | null
  /** Cursor for previous page. */
  before?: string | null
  trackTotalHits?: boolean | number
  highlight?: boolean
  nowMs?: number
}

/** Build POST /api/logs/search body from UI preset + cursor. */
export function buildLogsSearchRequest(params: BuildLogsSearchParams): LogsSearchRequest {
  const {
    preset,
    after = null,
    before = null,
    trackTotalHits = true,
    highlight = false,
    nowMs,
  } = params

  const time = resolveDiscoverTimeRange(preset.from, preset.to, nowMs)
  const size = resolvePresetSize(preset)
  const filter = presetToFilterAst(preset)

  const page: LogsSearchRequest["page"] = { size }
  if (after) page.after = after
  if (before) page.before = before

  return {
    version: 1,
    time,
    query: null,
    filter,
    sort: [
      { field: "createdAt", order: "desc" },
      { field: "id", order: "desc" },
    ],
    page,
    trackTotalHits,
    highlight,
  }
}

export function presetHasServerFilters(preset: DiscoverFilterPreset): boolean {
  return hasApiFilterFields(preset) || countActiveRules(preset.rules) > 0
}

/**
 * Client-side match for SSE rows until Phase B `filterId`.
 * Mirrors server AST for eq/contains/like on the fields we send today.
 */
export function liveEntryMatchesPreset(
  entry: ServiceLogResponse,
  preset: DiscoverFilterPreset,
): boolean {
  const service = (preset.serviceInclude ?? "").trim()
  if (service && entry.serviceName !== service) return false

  const methodName = (preset.methodName ?? "").trim()
  if (methodName && (entry.methodName ?? "") !== methodName) return false

  const level = (preset.level ?? "").trim()
  if (level && (entry.level ?? "").toLowerCase() !== level.toLowerCase()) return false

  const trackingId = (preset.trackingId ?? "").trim()
  if (trackingId && entry.trackingId !== trackingId) return false

  const detailsContains = (preset.detailsContains ?? "").trim()
  if (detailsContains && !logDetailsContains(entry, detailsContains)) return false

  const time = resolveDiscoverTimeRange(preset.from, preset.to)
  const created = entry.createdAt ? Date.parse(entry.createdAt) : NaN
  if (!Number.isNaN(created)) {
    const fromT = Date.parse(time.from)
    const toT = Date.parse(time.to)
    if (!Number.isNaN(fromT) && created < fromT) return false
    if (!Number.isNaN(toT) && created > toT) return false
  }

  for (const rule of preset.rules) {
    if (!matchFilterRule(entry, rule)) return false
  }
  return true
}

/** Stable key for search identity (resets cursor when this changes). */
export function discoverSearchIdentity(preset: DiscoverFilterPreset): string {
  const size = resolvePresetSize(preset)
  const filter = presetToFilterAst(preset)
  return JSON.stringify({
    size,
    from: (preset.from ?? "").trim(),
    to: (preset.to ?? "").trim(),
    // When bounds empty, default window is "rolling now" — identity stays stable;
    // each request still resolves fresh `to=now` / `from=now-7d`.
    filter,
  })
}

export function formatTotalLabel(total: {
  value: number
  relation: "eq" | "gte"
} | null): string {
  if (!total) return "—"
  if (total.relation === "gte") return `${total.value.toLocaleString("pl-PL")}+`
  return total.value.toLocaleString("pl-PL")
}

/** Count AST nodes for UI warnings (approx.). */
export function countAstNodes(node: LogFilterNode | null | undefined): number {
  if (!node) return 0
  if (node.type === "group") {
    return 1 + node.children.reduce((sum, child) => sum + countAstNodes(child), 0)
  }
  return 1
}

export function activeRulesForAst(rules: DiscoverFilterRule[]): DiscoverFilterRule[] {
  return rules.filter((r) => r.enabled && r.value.trim().length > 0 && r.field.trim().length > 0)
}
