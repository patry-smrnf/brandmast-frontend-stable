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

/** True when open intervals (start, end) intersect with positive length. */
function intervalsOverlap(a: SvActionRow, b: SvActionRow): boolean {
  if (a.action.idShop !== b.action.idShop) return false
  const A = intervalMs(a)
  const B = intervalMs(b)
  return Math.max(A.start, B.start) < Math.min(A.end, B.end)
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
  const n = rows.length
  if (n === 0) {
    return { clusters: [], singles: [], conflictingActionIds: new Set() }
  }

  const parent = Array.from({ length: n }, (_, i) => i)
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (
        isCollisionEligible(rows[i]) &&
        isCollisionEligible(rows[j]) &&
        intervalsOverlap(rows[i], rows[j])
      ) {
        union(parent, i, j)
      }
    }
  }

  const rootToIndices = new Map<number, number[]>()
  for (let i = 0; i < n; i++) {
    const r = find(parent, i)
    if (!rootToIndices.has(r)) rootToIndices.set(r, [])
    rootToIndices.get(r)!.push(i)
  }

  const clusters: SvActionRow[][] = []
  const conflictingActionIds = new Set<number>()

  for (const indices of rootToIndices.values()) {
    if (indices.length < 2) continue
    const group = indices
      .map((i) => rows[i])
      .sort((a, b) => intervalMs(a).start - intervalMs(b).start)
    if (!clusterHasEditable(group)) continue
    clusters.push(group)
    for (const r of group) conflictingActionIds.add(r.action.idAction)
  }

  const singles = rows
    .filter((r) => !conflictingActionIds.has(r.action.idAction))
    .sort((a, b) => intervalMs(a).start - intervalMs(b).start)

  clusters.sort((a, b) => intervalMs(a[0]).start - intervalMs(b[0]).start)

  return { clusters, singles, conflictingActionIds }
}
