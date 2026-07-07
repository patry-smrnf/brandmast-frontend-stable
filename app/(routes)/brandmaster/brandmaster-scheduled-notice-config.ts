import type { PolandScheduleWindow } from "@/lib/dates/date-utils"

/**
 * Baner na /brandmaster i /brandmaster/actions.
 * Edytuj treść i okna (czas ścienny Europe/Warsaw).
 */
export const BRANDMASTER_SCHEDULED_NOTICE = {
  message:
    "NOWOSC: Od teraz efektywnosc i wyniki zawieraja dane z Awaryjnych / Ticketow / Wysylek ( zeby korzystac z tego trza skonfigurowac w zakladce 'Ustawienia' swoje konto 121)",
  windows: [
    {
      start: "2026-07-05T00:00:00",
      end: "2026-07-09T00:00:00",
    },
  ] satisfies readonly PolandScheduleWindow[],
} as const
