export type BrandmasterNowosc = {
  id: string
  /** Data dodania w formacie YYYY-MM-DD */
  addedAt: string
  title: string
  description: string
}

/** Hardkodowana lista nowości — edytuj tutaj kolejne wpisy. */
export const BRANDMASTER_NOWOSCI: BrandmasterNowosc[] = [
  {
    id: "geolocation-editor-map",
    addedAt: "2026-06-09",
    title: "Lokalizacja na mapie w edytorze akcji",
    description:
      "Przy dodawaniu akcji możesz użyć geolokalizacji, aby szybciej wskazać punkt na mapie sklepów. Działa na telefonach z włączoną lokalizacją.",
  },
  {
    id: "brandmaster-bonus-breakdown",
    addedAt: "2026-06-09",
    title: "Mozliwosc dodawania dodatkowych premii na Home",
    description:
      "Mozliwosc dodawania dodatkowych premii do premii na Home. Np. premia za szkolenie nowego BM, premia za Brief na teams itd.",
  },
  {
    id: "old-bonus-breakdown",
    addedAt: "2026-06-22",
    title: "Mozliwosc przejrzenia wyplaty za poprzedni miesiac",
    description:
      "Mozliwosc przejrzenia wyplaty za poprzedni miesiac. Mozesz zobaczyc ile masz za poprzedni miesiac i ile bys mial za ten miesiac jesli bys wstawial akcje w tym miesiacu hehe",
  },
  {
    id: "empty-hours-calculation",
    addedAt: "2026-06-22",
    title: "Obliczanie pustych godzin",
    description:
      "Jest przycisk do liczenia pustych godzin,Mozesz zobaczyc ile masz pustych godzin w sekcji 'Czas pracy'",
  },
  {
    id: "121-aplikacje-zgloszenie",
    addedAt: "2026-06-22",
    title: "MASOWE Zgloszenie aplikacji 121",
    description:
      "Da sie za jednym razem zglosic wiele mailow, czyli wiele paczek za jednym klikiecim na akcji",
  },
]

export function getBrandmasterNowosciSorted(): BrandmasterNowosc[] {
  return [...BRANDMASTER_NOWOSCI].sort((a, b) => b.addedAt.localeCompare(a.addedAt))
}
