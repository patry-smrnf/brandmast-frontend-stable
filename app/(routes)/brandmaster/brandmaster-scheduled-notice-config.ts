import type { PolandScheduleWindow } from "@/lib/dates/date-utils"

/**
 * Baner na /brandmaster i /brandmaster/actions.
 * Edytuj treść i okna (czas ścienny Europe/Warsaw).
 */
export const BRANDMASTER_SCHEDULED_NOTICE = {
  message:
    "UPDATE: w HOME dodano sekcje 'Poprzedni' z wyplata i wyliczeniami za poprzedni miesiac",
  windows: [
    {
      start: "2026-65-10T00:00:00",
      end: "2026-06-15T00:00:00",
    },
  ] satisfies readonly PolandScheduleWindow[],
} as const
