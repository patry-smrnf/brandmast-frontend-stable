import type {
  OneTwoOneRivoVirto,
  OneTwoOneSampling,
  OneTwoOneTeam,
  SettingResponse,
  TourPlannerActionListItem,
  ZgloszeniaSamplingAddRequest,
} from "@/lib/api"
import type { DataGroup } from "@/components/data-display/types"
import { parseIso, POLAND_TIMEZONE, toDateKeyInPoland } from "@/lib/dates/date-utils"

import { parseCasDatetime } from "../cas-action-utils"

export type SamplingView = "list" | "submit"

export function getMonthToTodayCasRange(reference = new Date()) {
  const y = reference.getFullYear()
  const m = reference.getMonth()
  const since = toDateKeyInPoland(new Date(y, m, 1))
  const until = toDateKeyInPoland(reference)
  return { since, until }
}

export type Resolved121Team = {
  teamId: number | null
  teamName: string | null
  territoryIdent: string | null
}

function normalizeTeamKey(value: string): string {
  return value.trim().toLocaleLowerCase("pl")
}

function findTeamByNazwa(teams: OneTwoOneTeam[], nazwa: string): OneTwoOneTeam | undefined {
  const key = normalizeTeamKey(nazwa)
  return teams.find((t) => normalizeTeamKey(t.nazwa ?? "") === key)
}

/** Dopasowanie zespołu: config teamData.territoryData.ident → nazwa z /api/121/teams/fetch. */
export function resolveUserTeamFromConfig(
  teams: OneTwoOneTeam[],
  config: SettingResponse | null,
): Resolved121Team {
  const territoryIdent = config?.teamData?.territoryData?.ident?.trim() ?? null

  if (territoryIdent) {
    const match = findTeamByNazwa(teams, territoryIdent)
    if (match?.id != null) {
      return {
        teamId: match.id,
        teamName: match.nazwa?.trim() ?? territoryIdent,
        territoryIdent,
      }
    }
  }

  const configTeamId = config?.teamData?.id
  if (configTeamId != null) {
    const match = teams.find((t) => t.id === configTeamId)
    if (match?.id != null) {
      return {
        teamId: match.id,
        teamName: match.nazwa?.trim() ?? null,
        territoryIdent,
      }
    }
  }

  const active = teams.filter((t) => t.czy_aktywny === 1)
  if (active.length === 1 && active[0]?.id != null) {
    return {
      teamId: active[0].id,
      teamName: active[0].nazwa?.trim() ?? null,
      territoryIdent,
    }
  }

  return {
    teamId: null,
    teamName: territoryIdent,
    territoryIdent,
  }
}

/** @deprecated Użyj resolveUserTeamFromConfig -zwraca samo id (region_id). */
export function resolveUserRegionId(
  teams: OneTwoOneTeam[],
  config: SettingResponse | null,
): number | null {
  return resolveUserTeamFromConfig(teams, config).teamId
}

export function getRegionLabel(regionId: number | null | undefined, teams: OneTwoOneTeam[]) {
  if (regionId == null) return null
  const team = teams.find((t) => t.id === regionId)
  return team?.nazwa?.trim() || `Region ${regionId}`
}

export function getSamplingDateKey(item: OneTwoOneSampling): string | null {
  const raw = item.data_wpisu?.trim() || item.data_modyfikacji?.trim() || item.data_paczki?.trim()
  if (!raw) return null
  const d = parseIso(raw.includes("T") ? raw : raw.replace(" ", "T"))
  if (!d) return null
  return toDateKeyInPoland(d)
}

export function formatSamplingDateTime(iso?: string): string {
  const raw = iso?.trim()
  if (!raw) return "—"
  const d = parseIso(raw.includes("T") ? raw : raw.replace(" ", "T"))
  if (!d) return raw.slice(0, 16).replace("T", " ")
  return new Intl.DateTimeFormat("pl-PL", {
    timeZone: POLAND_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d)
}

export function formatMonthLabel(monthKey: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(monthKey)
  if (!m) return monthKey
  const d = new Date(Number(m[1]), Number(m[2]) - 1, 1)
  return new Intl.DateTimeFormat("pl-PL", { month: "long", year: "numeric" }).format(d)
}

export function getProductName(
  productId: number | null | undefined,
  products: OneTwoOneRivoVirto[],
): string {
  if (productId == null) return "—"
  const product = products.find((p) => p.id === productId)
  return product?.nazwa?.trim() || `Produkt #${productId}`
}

export function groupSamplingsByMonth(
  items: OneTwoOneSampling[],
): DataGroup<OneTwoOneSampling>[] {
  const byMonth = new Map<string, OneTwoOneSampling[]>()

  for (const item of items) {
    const dateKey = getSamplingDateKey(item)
    const monthKey = dateKey ? dateKey.slice(0, 7) : "unknown"
    const bucket = byMonth.get(monthKey) ?? []
    bucket.push(item)
    byMonth.set(monthKey, bucket)
  }

  return Array.from(byMonth.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([monthKey, monthItems]) => ({
      key: monthKey,
      label: monthKey === "unknown" ? "Bez daty" : formatMonthLabel(monthKey),
      items: monthItems.sort((a, b) => {
        const da = getSamplingDateKey(a) ?? ""
        const db = getSamplingDateKey(b) ?? ""
        return db.localeCompare(da)
      }),
    }))
}

export function getCurrentMonthKey(reference = new Date()) {
  return toDateKeyInPoland(reference).slice(0, 7)
}

export function splitActionIdent(ident: string): {
  nr_akcji: string
  nr_akcji_koncowka: string
} {
  const trimmed = ident.trim()
  const slashIdx = trimmed.indexOf("/")
  if (slashIdx === -1) {
    return { nr_akcji: trimmed, nr_akcji_koncowka: "" }
  }
  return {
    nr_akcji: trimmed.slice(0, slashIdx),
    nr_akcji_koncowka: trimmed.slice(slashIdx),
  }
}

/** data_paczki -data wybranej akcji (YYYY-MM-DD, strefa PL). */
export function getActionDataPaczki(action: TourPlannerActionListItem): string | null {
  const start =
    parseCasDatetime(action.history?.start) ??
    (action.since
      ? parseIso(action.since.includes("T") ? action.since : `${action.since}T12:00:00`)
      : null)
  if (!start) return null
  return toDateKeyInPoland(start)
}

export type BuildSamplingAddResult =
  | { ok: true; body: ZgloszeniaSamplingAddRequest }
  | { ok: false; message: string }

export function buildZgloszeniaSamplingAddRequest(
  action: TourPlannerActionListItem,
  regionId: number,
  productId: number,
): BuildSamplingAddResult {
  const ident = action.ident?.trim()
  if (!ident) {
    return { ok: false, message: "Wybrana akcja nie ma numeru (ident)." }
  }

  const data_paczki = getActionDataPaczki(action)
  if (!data_paczki) {
    return { ok: false, message: "Nie można ustalić daty wybranej akcji." }
  }

  const { nr_akcji, nr_akcji_koncowka } = splitActionIdent(ident)
  if (!nr_akcji) {
    return { ok: false, message: "Numer akcji przed „/” jest pusty." }
  }

  return {
    ok: true,
    body: {
      data_paczki,
      region_id: regionId,
      nr_akcji,
      nr_akcji_koncowka,
      oferta_samp_prod_1: productId,
    },
  }
}
