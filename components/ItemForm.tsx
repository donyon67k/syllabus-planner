'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Course } from '@/lib/types'

const TYPES = ['assignment', 'reading', 'exam', 'quiz', 'project', 'other'] as const
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function ItemForm({ course, onSaved }: { course: Course; onSaved: () => void }) {
  const supabase = createClient()
  const weekMode = course.schedule_mode === 'week'
  const [title, setTitle] = useState('')
  const [type, setType] = useState<(typeof TYPES)[number]>('assignment')
  const [week, setWeek] = useState('1')
  const [weekday, setWeekday] = useState(String(course.meeting_days?.[0] ?? 1))
  const [date, setDate] = useState('')
  const [error, setError] = useState('')

  async function save() {
    if (!title.trim()) return setError('Title is required')
    if (!weekMode && !date) return setError('Pick a due date')
    const { error } = await supabase.from('items').insert({
      course_id: course.id,
      title: title.trim(),
      type,
      week: weekMode ? Number(week) : null,
      weekday: weekMode ? Number(weekday) : null,
      due_date: weekMode ? null : date,
    })
    if (error) return setError(error.message)
    setTitle('')
    setError('')
    onSaved()
  }
    const input = 'rounded border border-gray-600 bg-transparent p-2'

  return (
    <div className="space-y-3 rounded-lg border border-gray-700 p-4">
      <h2 className="text-lg font-semibold">Add an item</h2>
      <input className={`${input} w-full`} placeholder="Title (e.g. Problem Set 3)"
        value={title} onChange={(e) => setTitle(e.target.value)} />
      <div className="flex flex-wrap gap-2">
        <select className={input} value={type}
          onChange={(e) => setType(e.target.value as typeof type)}>
          {TYPES.map((t) => <option key={t} value={t} className="bg-black">{t}</option>)}
        </select>
        {weekMode ? (
          <>
            <select className={input} value={week} onChange={(e) => setWeek(e.target.value)}>
              {Array.from({ length: 16 }, (_, i) => i + 1).map((w) => (
                <option key={w} value={w} className="bg-black">Week {w}</option>
              ))}
            </select>
            <select className={input} value={weekday} onChange={(e) => setWeekday(e.target.value)}>
              {WEEKDAYS.map((d, i) => (
                <option key={d} value={i + 1} className="bg-black">{d}</option>
              ))}
            </select>
          </>
        ) : (
          <input type="date" className={input} value={date}
            onChange={(e) => setDate(e.target.value)} />
        )}
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button onClick={save} className="w-full rounded bg-blue-600 p-2 text-white">
        Add item
      </button>
    </div>
  )
}