export type SupervisorNowosc = {
  id: string
  /** Data dodania w formacie YYYY-MM-DD */
  addedAt: string
  title: string
  description: string
}

/** Hardkodowana lista nowości dla supervisora — edytuj tutaj kolejne wpisy. */
export const SUPERVISOR_NOWOSCI: SupervisorNowosc[] = [
  {
    id: "iphone-inputs-fixed",
    addedAt: "2026-06-09",
    title: "Naprawione inputy daty na iphoneach",
    description:
      "Rozjezdzajace sie na bok inputy z data na iphoneach naprawione, tak samo z przyblizeniami przy edytowaniu adresu akcji",
  },
  {
    id: "bulk-approve-actions",
    addedAt: "2026-06-09",
    title: "Masowe zatwierdzanie akcji",
    description:
      "Na dashboardzie możesz zaznaczyć wiele akcji i zatwierdzić je jednym kliknięciem. Dialog pokazuje postęp i ewentualne błędy dla poszczególnych pozycji.",
  },
  {
    id: "unknown-event-actions",
    addedAt: "2026-06-09",
    title: "Usuniecie przycisku APPROVE dla akcji 'niewiem'",
    description:
      "Akcje 'niewiem'nie mają już przycisku APPROVE. Możesz je edytować",
  },
  {
    id: "horeca-event-collision",
    addedAt: "2026-06-22",
    title: "Konflikty akcji Horeca",
    description:
      "Konflikty akcji Horeca nie są teraz widoczne na dashboardzie supervisora. Można je masowo akceptowac",
  },
  {
    id: "conflict-actions-visibility",
    addedAt: "2026-06-22",
    title: "Widoczność konfliktów akcji BM",
    description:
      "W sekcji Ustawienia mozna ustawic czy BM moga widziec konflikt akcji ktora obecnie wstawiaja, czyli czy sklep i godziny sie pokrywaja z kims innym",
  },
]

export function getSupervisorNowosciSorted(): SupervisorNowosc[] {
  return [...SUPERVISOR_NOWOSCI].sort((a, b) => b.addedAt.localeCompare(a.addedAt))
}
