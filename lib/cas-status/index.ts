export const CAS_ACTION_STATUSES = [
  "cancelled",
  "accepted",
  "finished",
  "started",
  "editable",
  "hst_cancelled",
] as const

export type CasActionStatus = (typeof CAS_ACTION_STATUSES)[number]

export type NormalizedCasActionStatus = CasActionStatus | "unknown"

const KNOWN = new Set<string>(CAS_ACTION_STATUSES)

export function normalizeCasActionStatus(raw: string | null | undefined): NormalizedCasActionStatus {
  const key = (raw ?? "").trim().toLowerCase()
  if (KNOWN.has(key)) return key as CasActionStatus
  return "unknown"
}

export type CasStatusBadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "success"
  | "warning"
  | "destructive"

export type CasStatusPresentation = {
  badgeVariant: CasStatusBadgeVariant
  labelPl: string
  accentClass: string
}

export const casStatusPresentation: Record<NormalizedCasActionStatus, CasStatusPresentation> = {
  started: {
    badgeVariant: "default",
    labelPl: "Rozpoczeta",
    accentClass: "bg-sky-500/70",
  },
  finished: {
    badgeVariant: "success",
    labelPl: "Zakończona",
    accentClass: "bg-emerald-500/70",
  },
  accepted: {
    badgeVariant: "success",
    labelPl: "Zaakceptowana",
    accentClass: "bg-emerald-400/60",
  },
  editable: {
    badgeVariant: "outline",
    labelPl: "Edytowalna",
    accentClass: "bg-violet-500/50",
  },
  cancelled: {
    badgeVariant: "destructive",
    labelPl: "Anulowana",
    accentClass: "bg-destructive/60",
  },
  hst_cancelled: {
    badgeVariant: "destructive",
    labelPl: "Anul. hostessa",
    accentClass: "bg-rose-500/60",
  },
  unknown: {
    badgeVariant: "secondary",
    labelPl: "Nieznany",
    accentClass: "bg-muted-foreground/40",
  },
}

export function getCasStatusPresentation(status: NormalizedCasActionStatus): CasStatusPresentation {
  return casStatusPresentation[status]
}

export function getCasStatusPresentationFromRaw(
  raw: string | null | undefined,
): CasStatusPresentation {
  return getCasStatusPresentation(normalizeCasActionStatus(raw))
}

export function casStatusSupportsSampleStats(status: NormalizedCasActionStatus): boolean {
  return status === "started" || status === "finished"
}
