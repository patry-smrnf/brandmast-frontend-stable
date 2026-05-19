import type { SampleStatsFieldCounts } from "@/lib/api"
import {
  casStatusSupportsSampleStats,
  normalizeCasActionStatus,
  type CasActionStatus,
  type NormalizedCasActionStatus,
} from "@/lib/cas-status"
import type { TourPlannerActionListItem } from "@/lib/api/generated/types"
import {
  formatCasAddress,
  formatCasTime,
  getCasActionTitle,
  parseActionFallbackStart,
} from "@/app/(routes)/brandmaster/cas-action-utils"

const STATUS_SORT: Record<NormalizedCasActionStatus, number> = {
  started: 0,
  finished: 1,
  accepted: 2,
  editable: 3,
  cancelled: 4,
  hst_cancelled: 5,
  unknown: 6,
}

export function casActionHasBrandmaster(action: TourPlannerActionListItem): boolean {
  const bm = action.brandmaster
  if (!bm) return false
  return Boolean(bm.ident?.trim() || bm.firstname?.trim() || bm.lastname?.trim())
}

export function getCasActionRowKey(action: TourPlannerActionListItem): string {
  return action.uuid?.trim() || action.ident?.trim() || `cas-${action.name ?? "action"}`
}

export function getBrandmasterDisplayName(action: TourPlannerActionListItem): string {
  const bm = action.brandmaster
  if (!bm) return "-"
  const name = [bm.firstname, bm.lastname].filter(Boolean).join(" ").trim()
  return name || bm.ident?.trim() || "-"
}

export function filterCasActionsForDisplay(
  actions: TourPlannerActionListItem[],
  search: string,
): TourPlannerActionListItem[] {
  const withBm = actions.filter(casActionHasBrandmaster)
  const q = search.trim().toLowerCase()
  if (!q) return sortCasActions(withBm)

  const filtered = withBm.filter((action) => {
    const title = getCasActionTitle(action).toLowerCase()
    const ident = action.ident?.toLowerCase() ?? ""
    const shop = action.point?.name?.toLowerCase() ?? ""
    const addr = formatCasAddress(action.point?.address).toLowerCase()
    const bmName = getBrandmasterDisplayName(action).toLowerCase()
    const bmIdent = action.brandmaster?.ident?.toLowerCase() ?? ""
    const event = action.event?.name?.toLowerCase() ?? ""
    return (
      title.includes(q) ||
      ident.includes(q) ||
      shop.includes(q) ||
      addr.includes(q) ||
      bmName.includes(q) ||
      bmIdent.includes(q) ||
      event.includes(q)
    )
  })

  return sortCasActions(filtered)
}

export function sortCasActions(actions: TourPlannerActionListItem[]): TourPlannerActionListItem[] {
  return [...actions].sort((a, b) => {
    const sa = STATUS_SORT[normalizeCasActionStatus(a.status)]
    const sb = STATUS_SORT[normalizeCasActionStatus(b.status)]
    if (sa !== sb) return sa - sb
    const ta = parseActionFallbackStart(a)?.getTime() ?? 0
    const tb = parseActionFallbackStart(b)?.getTime() ?? 0
    return tb - ta
  })
}

export function getCasActionTimeLabel(action: TourPlannerActionListItem): string {
  const start = formatCasTime(action.history?.start)
  const stop = formatCasTime(action.history?.stop)
  if (start !== "-" || stop !== "-") return `${start} – ${stop}`
  const since = action.since?.trim()
  const until = action.until?.trim()
  if (since && until) return `${since} – ${until}`
  return since ?? until ?? "-"
}

export type CasDayStatsSummary = {
  actionCount: number
  startedPeopleCount: number
  totals: SampleStatsFieldCounts
  loadedCount: number
  failedCount: number
}

export function emptySampleStatsFieldCounts(): SampleStatsFieldCounts {
  return {
    glo: { hilo: 0, hyperPro: 0, hiloPlus: 0 },
    veloNet: 0,
  }
}

export function addSampleStatsFieldCounts(
  a: SampleStatsFieldCounts,
  b: SampleStatsFieldCounts,
): SampleStatsFieldCounts {
  return {
    glo: {
      hilo: a.glo.hilo + b.glo.hilo,
      hyperPro: a.glo.hyperPro + b.glo.hyperPro,
      hiloPlus: a.glo.hiloPlus + b.glo.hiloPlus,
    },
    veloNet: a.veloNet + b.veloNet,
  }
}

export type CasActionStatsTarget = {
  action: TourPlannerActionListItem
  hostessCode: string
  actionIdent: string
  status: NormalizedCasActionStatus
}

export function listCasActionsForDayStats(
  actions: TourPlannerActionListItem[],
): CasActionStatsTarget[] {
  return actions
    .filter(casActionHasBrandmaster)
    .map((action) => {
      const status = normalizeCasActionStatus(action.status)
      const hostessCode = action.brandmaster?.ident?.trim() ?? ""
      const actionIdent = action.ident?.trim() ?? ""
      return { action, hostessCode, actionIdent, status }
    })
    .filter(
      (row) =>
        casStatusSupportsSampleStats(row.status) &&
        Boolean(row.hostessCode) &&
        Boolean(row.actionIdent),
    )
}

export function aggregateCasDayStats(
  rows: Array<{
    status: NormalizedCasActionStatus
    hostessCode: string
    stats: SampleStatsFieldCounts | null
    failed: boolean
  }>,
): CasDayStatsSummary {
  const startedHosts = new Set<string>()
  let totals = emptySampleStatsFieldCounts()
  let loadedCount = 0
  let failedCount = 0

  for (const row of rows) {
    if (row.status === "started" && row.hostessCode) {
      startedHosts.add(row.hostessCode)
    }
    if (row.failed) {
      failedCount += 1
      continue
    }
    if (!row.stats) continue
    loadedCount += 1
    totals = addSampleStatsFieldCounts(totals, row.stats)
  }

  return {
    actionCount: rows.length,
    startedPeopleCount: startedHosts.size,
    totals,
    loadedCount,
    failedCount,
  }
}

export function isCasActionStatus(value: string): value is CasActionStatus {
  return (["cancelled", "accepted", "finished", "started", "editable", "hst_cancelled"] as const).includes(
    value as CasActionStatus,
  )
}
