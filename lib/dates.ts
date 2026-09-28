import type { Course, Item } from './types'

// "2026-09-14" -> Date (in your local timezone)
export function parseDate(s: string) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// Date -> "2026-09-14"
export function toISO(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function addDays(d: Date, n: number) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

// The real due date of an item
export function dueDate(item: Item, course: Course): Date | null {
  if (item.due_date) return parseDate(item.due_date) // override or date mode
  if (course.schedule_mode === 'week' && course.term_start && item.week) {
    const weekStart = addDays(parseDate(course.term_start), (item.week - 1) * 7)
    return addDays(weekStart, (item.weekday ?? 1) - 1)
  }
  return null
}

// Monday of the week containing d
export function startOfWeek(d: Date) {
  const day = d.getDay() // 0 = Sunday
  const r = addDays(d, day === 0 ? -6 : 1 - day)
  r.setHours(0, 0, 0, 0)
  return r
}

export function formatDay(d: Date) {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}