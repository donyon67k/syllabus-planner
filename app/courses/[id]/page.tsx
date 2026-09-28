'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import ItemForm from '@/components/ItemForm'
import { dueDate, formatDay } from '@/lib/dates'
import type { Course, Item } from '@/lib/types'

export default function CoursePage() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()
  const router = useRouter()
  const [course, setCourse] = useState<Course | null>(null)
  const [items, setItems] = useState<Item[]>([])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/login')
    const { data: c } = await supabase.from('courses').select('*').eq('id', id).single()
    const { data: its } = await supabase.from('items').select('*').eq('course_id', id)
    setCourse(c)
    setItems(its ?? [])
  }

  useEffect(() => { load() }, [id])

  async function toggle(item: Item) {
    const status = item.status === 'done' ? 'todo' : 'done'
    await supabase.from('items').update({ status }).eq('id', item.id)
    load()
  }

  async function remove(itemId: string) {
    await supabase.from('items').delete().eq('id', itemId)
    load()
  }

  if (!course) return <main className="p-6">Loading...</main>

  const time = (it: Item) => dueDate(it, course)?.getTime() ?? 9e15
  const sorted = [...items].sort((a, b) => time(a) - time(b))
    return (
    <main className="mx-auto max-w-xl space-y-6 p-6">
      <Link href="/courses" className="text-sm text-gray-400">← All courses</Link>
      <h1 className="text-2xl font-semibold" style={{ color: course.color }}>
        {course.name}
      </h1>
      <ul className="space-y-2">
        {sorted.map((it) => {
          const d = dueDate(it, course)
          return (
            <li key={it.id} className="flex items-center gap-3 rounded border border-gray-700 p-3">
              <input type="checkbox" checked={it.status === 'done'} onChange={() => toggle(it)} />
              <div className="flex-1">
                <p className={it.status === 'done' ? 'text-gray-500 line-through' : ''}>
                  {it.title}
                </p>
                <p className="text-xs text-gray-400">
                  {it.type} · {d ? formatDay(d) : 'no date'}
                  {it.week ? ` · Week ${it.week}` : ''}
                </p>
              </div>
              <button onClick={() => remove(it.id)} className="text-sm text-red-400">
                Delete
              </button>
            </li>
          )
        })}
      </ul>
      <ItemForm course={course} onSaved={load} />
    </main>
  )
}