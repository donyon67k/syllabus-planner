'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { addDays, dueDate, formatDay, startOfWeek, toISO } from '@/lib/dates'
import type { Course, Item } from '@/lib/types'

export default function WeekPage() {
  const supabase = createClient()
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/login')
    const { data: c } = await supabase.from('courses').select('*')
    const { data: i } = await supabase.from('items').select('*')
    setCourses(c ?? [])
    setItems(i ?? [])
  }

  useEffect(() => { load() }, [])

  async function toggle(item: Item) {
    const status = item.status === 'done' ? 'todo' : 'done'
    await supabase.from('items').update({ status }).eq('id', item.id)
    load()
  }

  const byId = new Map(courses.map((c) => [c.id, c]))
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const dated = items.flatMap((it) => {
    const course = byId.get(it.course_id)
    const d = course ? dueDate(it, course) : null
    return course && d ? [{ it, course, key: toISO(d) }] : []
  })
    return (
    <main className="mx-auto max-w-xl space-y-5 p-6">
      <div className="flex items-center justify-between">
        <button className="px-3 py-1 text-xl" onClick={() => setWeekStart(addDays(weekStart, -7))}>←</button>
        <h1 className="text-xl font-semibold">Week of {formatDay(weekStart)}</h1>
        <button className="px-3 py-1 text-xl" onClick={() => setWeekStart(addDays(weekStart, 7))}>→</button>
      </div>
      <div className="flex gap-4 text-sm text-gray-400">
        <Link href="/courses">Manage courses →</Link>
        <Link href="/settings">Settings →</Link>
      </div>

      {days.map((day) => {
        const due = dated.filter((x) => x.key === toISO(day))
        return (
          <section key={toISO(day)} className="space-y-2">
            <h2 className="text-sm font-semibold text-gray-400">{formatDay(day)}</h2>
            {due.length === 0 && <p className="text-sm text-gray-600">Nothing due</p>}
            {due.map(({ it, course }) => (
              <div key={it.id} className="flex items-center gap-3 rounded border border-gray-700 p-3">
                <input type="checkbox" checked={it.status === 'done'} onChange={() => toggle(it)} />
                <span className="h-3 w-3 rounded-full" style={{ background: course.color }} />
                <div className="flex-1">
                  <p className={it.status === 'done' ? 'text-gray-500 line-through' : ''}>{it.title}</p>
                  <p className="text-xs text-gray-400">{course.code ?? course.name} · {it.type}</p>
                </div>
              </div>
            ))}
          </section>
        )
      })}
    </main>
  )
}