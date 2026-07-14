import type { OneTwoOneMojstanItem } from "@/lib/api"

export type MojstanDisplayItem = {
  label: string
  quantity: number
}

function normalizeMojstanProductLabel(raw: string): string {
  const trimmed = raw.trim()
  if (/^glo\s+hilo\s+plus$/i.test(trimmed)) return "HILO Plus"
  if (/^glo\s+hilo$/i.test(trimmed)) return "HILO"
  if (/^rivo\s+i\s+virto$/i.test(trimmed)) return "RIVO i VIRTO"
  if (/^velo$/i.test(trimmed)) return "VELO"
  return trimmed.replace(/^GLO\s+/i, "")
}

/**
 * Wyciąga ilość i nazwę produktu z tytułu zwracanego przez /api/121/mojstan/fetch,
 * np. „Obecnie posiadasz na stanie 41 GLO HILO” → { label: "HILO", quantity: 41 }.
 */
export function parseMojstanItems(
  rows: OneTwoOneMojstanItem[] | null | undefined,
): MojstanDisplayItem[] {
  if (!rows) return []

  return rows
    .map((row) => {
      const title = row.title?.trim()
      if (!title) return null

      const match = title.match(/na\s+stanie\s+(\d+)\s+(.+)/i)
      if (!match) return null

      const quantity = Number.parseInt(match[1], 10)
      if (Number.isNaN(quantity)) return null

      return {
        label: normalizeMojstanProductLabel(match[2]),
        quantity,
      }
    })
    .filter((item): item is MojstanDisplayItem => item != null)
}
