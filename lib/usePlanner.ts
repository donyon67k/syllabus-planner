'use client'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { dueDate } from '@/lib/dates'
import type { Course, Item } from '@/lib/types'

export type PlannerItem = Item & { course: Course; date: Date | null }

export function usePlanner() {
  const supabase = createClient()
  const router = useRouter()
  const [items, setItems] = useState<PlannerItem[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/login')
    const [{ data: c }, { data: i }] = await Promise.all([
      supabase.from('courses').select('*'),
      supabase.from('items').select('*'),
    ])
    const byId = new Map((c ?? []).map((x: Course) => [x.id, x]))
    const joined: PlannerItem[] = (i ?? []).flatMap((it: Item) => {
      const course = byId.get(it.course_id)
      return course ? [{ ...it, course, date: dueDate(it, course) }] : []
    })
    joined.sort((a, b) =>
      (a.date?.getTime() ?? 9e15) - (b.date?.getTime() ?? 9e15) ||
      (a.due_time ?? '99').localeCompare(b.due_time ?? '99'))
    setCourses(c ?? [])
    setItems(joined)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Check/uncheck instantly, then save
  async function toggle(item: PlannerItem) {
    const status = item.status === 'done' ? 'todo' : 'done'
    setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, status } : x)))
    await supabase.from('items').update({ status }).eq('id', item.id)
  }

  return { items, courses, loading, reload: load, toggle }
}