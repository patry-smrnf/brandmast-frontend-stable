export function parseIso(iso: string) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d
}

export function toDateKey(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function toMonthKey(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  return `${y}-${m}`
}

export function startOfDay(d: Date) {
  const c = new Date(d)
  c.setHours(0, 0, 0, 0)
  return c
}

export function addDays(d: Date, days: number) {
  const c = new Date(d)
  c.setDate(c.getDate() + days)
  return c
}

export function formatHeaderDate(d: Date) {
  const day = new Intl.DateTimeFormat("pl-PL", { day: "2-digit" }).format(d)
  const rest = new Intl.DateTimeFormat("pl-PL", {
    weekday: "long",
    month: "long",
    year: "numeric",
  }).format(d)
  return { day, rest }
}

export function formatTime(d: Date) {
  return new Intl.DateTimeFormat("pl-PL", { hour: "2-digit", minute: "2-digit" }).format(d)
}

