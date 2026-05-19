export const ACTION_STATUSES = [
  "ACCEPTED",
  "CANCEL_REQUESTED",
  "CANCELLED",
  "PENDING",
  "REJECTED",
  "EDITABLE",
] as const

export type ActionStatus = (typeof ACTION_STATUSES)[number]

export type NormalizedActionStatus = ActionStatus | "UNKNOWN"

const KNOWN = new Set<string>(ACTION_STATUSES)

export function normalizeActionStatus(raw: string | null | undefined): NormalizedActionStatus {
  const u = (raw ?? "").trim().toUpperCase()
  if (KNOWN.has(u)) return u as ActionStatus
  return "UNKNOWN"
}

/** Wariant `Badge` (shadcn) - bez importu UI w konsumentach. */
export type ActionStatusBadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "success"
  | "warning"
  | "destructive"

export type ActionStatusPresentation = {
  badgeVariant: ActionStatusBadgeVariant
  labelPl: string
  brandmasterShowEdit: boolean
  brandmasterShowDelete: boolean
  brandmasterShowCancel: boolean
  supervisorCanApprove: boolean
}

export const statusPresentation: Record<NormalizedActionStatus, ActionStatusPresentation> = {
  CANCELLED: {
    badgeVariant: "destructive",
    labelPl: "Odwołana",
    brandmasterShowEdit: false,
    brandmasterShowDelete: false,
    brandmasterShowCancel: false,
    supervisorCanApprove: false,
  },
  ACCEPTED: {
    badgeVariant: "success",
    labelPl: "Zaakceptowana",
    brandmasterShowEdit: false,
    brandmasterShowDelete: false,
    brandmasterShowCancel: true,
    supervisorCanApprove: false,
  },
  CANCEL_REQUESTED: {
    badgeVariant: "warning",
    labelPl: "Prośba o odwołanie",
    brandmasterShowEdit: true,
    brandmasterShowDelete: false,
    brandmasterShowCancel: false,
    supervisorCanApprove: true,
  },
  PENDING: {
    badgeVariant: "warning",
    labelPl: "Oczekuje na akceptację",
    brandmasterShowEdit: true,
    brandmasterShowDelete: false,
    brandmasterShowCancel: false,
    supervisorCanApprove: true,
  },
  REJECTED: {
    badgeVariant: "destructive",
    labelPl: "Odrzucona",
    brandmasterShowEdit: true,
    brandmasterShowDelete: false,
    brandmasterShowCancel: false,
    supervisorCanApprove: true,
  },
  EDITABLE: {
    badgeVariant: "outline",
    labelPl: "Edytowalna",
    brandmasterShowEdit: true,
    brandmasterShowDelete: true,
    brandmasterShowCancel: false,
    supervisorCanApprove: true,
  },
  UNKNOWN: {
    badgeVariant: "secondary",
    labelPl: "Nieznany status",
    brandmasterShowEdit: false,
    brandmasterShowDelete: false,
    brandmasterShowCancel: false,
    supervisorCanApprove: false,
  },
}

export function getActionStatusPresentation(status: NormalizedActionStatus): ActionStatusPresentation {
  return statusPresentation[status]
}

export function getActionStatusPresentationFromRaw(
  raw: string | null | undefined
): ActionStatusPresentation {
  return getActionStatusPresentation(normalizeActionStatus(raw))
}
