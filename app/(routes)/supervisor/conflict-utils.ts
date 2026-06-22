import { parseIso } from "@/lib/dates/date-utils"
import { EXCLUDED_COLLISION_EVENT_IDS } from "./supervisor-constants"
import type { SvActionRow } from "./use-sv-actions"

function isCollisionEligible(row: SvActionRow): boolean {
  const eventId = row.action.event.idEvent
  return eventId > 0 && !EXCLUDED_COLLISION_EVENT_IDS.has(eventId)
}

function intervalMs(row: SvActionRow): { start: number; end: number } {
  const start = parseIso(row.action.since)?.getTime() ?? 0
  let end = parseIso(row.action.until)?.getTime() ?? start
  if (end < start) end = start
  return { start, end }
}

function find(parent: number[], i: number): number {
  if (parent[i] !== i) parent[i] = find(parent, parent[i])
  return parent[i]
}

function union(parent: number[], i: number, j: number) {
  const ri = find(parent, i)
  const rj = find(parent, j)
  if (ri !== rj) parent[ri] = rj
}

/** True when supervisor should see this overlap as a collision (needs attention). */
function clusterHasEditable(group: SvActionRow[]): boolean {
  return group.some((r) => r.action.status === "EDITABLE")
}

type TimedRow = { row: SvActionRow; start: number; end: number }

/**
 * Finds overlap clusters within one shop using sweep line (sorted by start, active set by end).
 * Only collision-eligible rows participate; complexity O(k log k) per shop for k rows.
 */
function clustersForShop(shopRows: SvActionRow[]): SvActionRow[][] {
  const timed: TimedRow[] = []
  for (const row of shopRows) {
    if (!isCollisionEligible(row)) continue
    const { start, end } = intervalMs(row)
    timed.push({ row, start, end })
  }

  const n = timed.length
  if (n < 2) return []

  timed.sort((a, b) => a.start - b.start || a.end - b.end)

  const parent = Array.from({ length: n }, (_, i) => i)
  let active: number[] = []

  for (let i = 0; i < n; i++) {
    const cur = timed[i]!
    active = active.filter((j) => timed[j]!.end > cur.start)
    for (const j of active) {
      union(parent, i, j)
    }
    active.push(i)
  }

  const rootToRows = new Map<number, SvActionRow[]>()
  for (let i = 0; i < n; i++) {
    const root = find(parent, i)
    if (!rootToRows.has(root)) rootToRows.set(root, [])
    rootToRows.get(root)!.push(timed[i]!.row)
  }

  const out: SvActionRow[][] = []
  for (const group of rootToRows.values()) {
    if (group.length < 2) continue
    group.sort((a, b) => intervalMs(a).start - intervalMs(b).start)
    if (!clusterHasEditable(group)) continue
    out.push(group)
  }

  return out
}

/**
 * Groups rows that belong to the same shop and have pairwise overlapping [since, until].
 * Overlaps where **every** action is ACCEPTED are ignored (no cluster, cards stay in singles).
 * Actions whose event is in {@link EXCLUDED_COLLISION_EVENT_IDS} are ignored for collision detection.
 * If at least one action is EDITABLE, the overlap is shown as a cluster like before.
 * Returns clusters of size ≥2 plus remaining rows as singles.
 */
export function getScheduleConflictLayout(rows: SvActionRow[]): {
  clusters: SvActionRow[][]
  singles: SvActionRow[]
  conflictingActionIds: Set<number>
} {
  if (rows.length === 0) {
    return { clusters: [], singles: [], conflictingActionIds: new Set() }
  }

  const byShop = new Map<number, SvActionRow[]>()
  for (const row of rows) {
    const idShop = row.action.idShop
    const list = byShop.get(idShop)
    if (list) list.push(row)
    else byShop.set(idShop, [row])
  }

  const clusters: SvActionRow[][] = []
  const conflictingActionIds = new Set<number>()

  for (const shopRows of byShop.values()) {
    for (const group of clustersForShop(shopRows)) {
      clusters.push(group)
      for (const r of group) conflictingActionIds.add(r.action.idAction)
    }
  }

  const singles = rows
    .filter((r) => !conflictingActionIds.has(r.action.idAction))
    .sort((a, b) => intervalMs(a).start - intervalMs(b).start)

  clusters.sort((a, b) => intervalMs(a[0]!).start - intervalMs(b[0]!).start)

  return { clusters, singles, conflictingActionIds }
}
