import type {
  OneTwoOneAplikacjaZgloszenie,
  OneTwoOneRivoVirto,
  TourPlannerActionListItem,
  ZgloszeniaAplikacjeAddRequest,
} from "@/lib/api"
import type { DataGroup } from "@/components/data-display/types"
import { parseIso, POLAND_TIMEZONE, toDateKeyInPoland } from "@/lib/dates/date-utils"

import { splitActionIdent } from "../121Sampling/121-sampling-utils"

export type AplikacjeView = "list" | "submit"

export function getAplikacjaDateKey(item: OneTwoOneAplikacjaZgloszenie): string | null {
  const raw = item.data_wpisu?.trim() || item.data_modyfikacji?.trim()
  if (!raw) return null
  const d = parseIso(raw.includes("T") ? raw : raw.replace(" ", "T"))
  if (!d) return null
  return toDateKeyInPoland(d)
}

export function formatAplikacjaDateTime(iso?: string): string {
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

export function isRivoProduct(product: OneTwoOneRivoVirto): boolean {
  return /rivo/i.test(product.nazwa?.trim() ?? "")
}

export function filterRivoProducts(products: OneTwoOneRivoVirto[]): OneTwoOneRivoVirto[] {
  return products.filter(isRivoProduct)
}

export function groupAplikacjeByMonth(
  items: OneTwoOneAplikacjaZgloszenie[],
): DataGroup<OneTwoOneAplikacjaZgloszenie>[] {
  const byMonth = new Map<string, OneTwoOneAplikacjaZgloszenie[]>()

  for (const item of items) {
    const dateKey = getAplikacjaDateKey(item)
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
        const da = getAplikacjaDateKey(a) ?? ""
        const db = getAplikacjaDateKey(b) ?? ""
        return db.localeCompare(da)
      }),
    }))
}

export function getCurrentMonthKey(reference = new Date()) {
  return toDateKeyInPoland(reference).slice(0, 7)
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function normalizeConsumerEmail(raw: string): string {
  return raw.trim()
}

export function isValidConsumerEmail(email: string): boolean {
  return EMAIL_RE.test(email)
}

export type BuildAplikacjeAddResult =
  | { ok: true; body: ZgloszeniaAplikacjeAddRequest }
  | { ok: false; message: string }

export function buildZgloszeniaAplikacjeAddRequest(
  action: TourPlannerActionListItem,
  productId: number,
  mailKonsumenta: string,
): BuildAplikacjeAddResult {
  const ident = action.ident?.trim()
  if (!ident) {
    return { ok: false, message: "Wybrana akcja nie ma numeru (ident)." }
  }

  const mail_konsumenta = normalizeConsumerEmail(mailKonsumenta)
  if (!mail_konsumenta) {
    return { ok: false, message: "Podaj e-mail konsumenta." }
  }
  if (!isValidConsumerEmail(mail_konsumenta)) {
    return { ok: false, message: "Podaj poprawny adres e-mail." }
  }

  const { nr_akcji, nr_akcji_koncowka } = splitActionIdent(ident)
  if (!nr_akcji) {
    return { ok: false, message: "Numer akcji przed „/” jest pusty." }
  }

  return {
    ok: true,
    body: {
      nr_akcji,
      nr_akcji_koncowka,
      mail_konsumenta,
      oferta_rivo_virto_prod_1: productId,
    },
  }
}
