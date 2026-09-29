import { createClient } from '@/lib/supabase/client'
import { addDays, parseDate, toISO } from '@/lib/dates'
import { notifyCoursesChanged, notifyItemsChanged } from '@/lib/events'
import type { PlannerItem } from '@/lib/usePlanner'

export type AiChange = {
  action: 'shift_course' | 'set_term_start' | 'update_item' | 'delete_item' | 'add_item'
  description: string
  course_id?: string
  item_id?: string
  days?: number
  from_date?: string
  term_start?: string
  title?: string
  type?: string
  due_date?: string
  due_time?: string
  priority?: 'normal' | 'high'
  weight?: number
  status?: 'todo' | 'done'
}

export async function applyChanges(changes: AiChange[], items: PlannerItem[]) {
  const supabase = createClient()
  const updateItem = (id: string, row: Record<string, unknown>) =>
    supabase.from('items').update(row).eq('id', id)

  for (const c of changes) {
    if (c.action === 'shift_course' && c.course_id && c.days) {
      const from = c.from_date ? parseDate(c.from_date) : null
      const targets = items.filter((i) =>
        i.course_id === c.course_id && i.status !== 'done' && i.date && (!from || i.date >= from))
      for (const i of targets) {
        // Week-based items move by whole weeks; everything else gets a new date
        if (!i.due_date && i.week && c.days % 7 === 0) {
          await updateItem(i.id, { week: i.week + c.days / 7 })
        } else {
          await updateItem(i.id, { due_date: toISO(addDays(i.date!, c.days)) })
        }
      }
    } else if (c.action === 'set_term_start' && c.course_id && c.term_start) {
      await supabase.from('courses').update({ term_start: c.term_start }).eq('id', c.course_id)
    } else if (c.action === 'update_item' && c.item_id) {
      const row: Record<string, unknown> = {}
      for (const k of ['title', 'type', 'due_date', 'due_time', 'priority', 'weight', 'status'] as const) {
        if (c[k] !== undefined && c[k] !== null && c[k] !== '') row[k] = c[k]
      }
      if (c.due_date) { row.week = null; row.weekday = null }
      if (Object.keys(row).length) await updateItem(c.item_id, row)
    } else if (c.action === 'delete_item' && c.item_id) {
      await supabase.from('items').delete().eq('id', c.item_id)
    } else if (c.action === 'add_item' && c.course_id && c.title && c.due_date) {
      await supabase.from('items').insert({
        course_id: c.course_id,
        title: c.title,
        type: c.type ?? 'assignment',
        due_date: c.due_date,
        due_time: c.due_time || null,
        priority: c.priority ?? 'normal',
        weight: c.weight ?? null,
        source: 'ai',
      })
    }
  }
  notifyCoursesChanged()
  notifyItemsChanged()
}