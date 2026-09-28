'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import CourseForm from '@/components/CourseForm'
import type { Course } from '@/lib/types'

export default function CoursesPage() {
  const supabase = createClient()
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/login')
    const { data } = await supabase.from('courses').select('*').order('created_at')
    setCourses(data ?? [])
  }

  useEffect(() => { load() }, [])

  async function remove(id: string) {
    if (!confirm('Delete this course and all its items?')) return
    await supabase.from('courses').delete().eq('id', id)
    load()
  }

  return (
    <main className="mx-auto max-w-xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">My Courses</h1>
      <ul className="space-y-2">
        {courses.map((c) => (
          <li key={c.id} className="flex items-center gap-3 rounded border border-gray-700 p-3">
            <span className="h-4 w-4 rounded-full" style={{ background: c.color }} />
            <div className="flex-1">
              <p className="font-medium">{c.name} {c.code && <span className="text-gray-400">· {c.code}</span>}</p>
              <p className="text-xs text-gray-400">
                {c.schedule_mode === 'week' ? `By week · starts ${c.term_start}` : 'By date'}
              </p>
            </div>
            <button onClick={() => remove(c.id)} className="text-sm text-red-400">Delete</button>
          </li>
        ))}
      </ul>
      <CourseForm onSaved={load} />
    </main>
  )
}