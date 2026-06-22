import type { PolandScheduleWindow } from "@/lib/dates/date-utils"

/**
 * Baner na /brandmaster i /brandmaster/actions.
 * Edytuj treść i okna (czas ścienny Europe/Warsaw).
 */
export const BRANDMASTER_SCHEDULED_NOTICE = {
  message:
    "UPDATE: Da sie teraz masowo zglaszac paczki za aplikacje myglo w sekcji '121 Aplikacje', wiele mailow za jednym klikieciem. Zeby miec mozlwiosc korzystania z sekcji '121 aplikacje' trza wejsc w ustawienia i skonfigurowac 121",
  windows: [
    {
      start: "2026-06-21T00:00:00",
      end: "2026-06-23T00:00:00",
    },
  ] satisfies readonly PolandScheduleWindow[],
} as const
