import type { PolandScheduleWindow } from "@/lib/dates/date-utils"

/**
 * Baner na /brandmaster i /brandmaster/actions.
 * Edytuj treść i okna (czas ścienny Europe/Warsaw).
 */
export const BRANDMASTER_SCHEDULED_NOTICE = {
  message:
    "UPDATE: Dodano 121 Sampling i 121 Aplikacje. Zeby moc skorzystac z nich, wejdz w zakladke 'USTAWIENIA' i na dole strony znajdziesz formularz do konfiguracji swojego konta 121",
  windows: [
    {
      start: "2026-05-25T00:00:00",
      end: "2026-05-27T00:00:00",
    },
  ] satisfies readonly PolandScheduleWindow[],
} as const
