'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const DAYS = [
  { n: 1, label: 'Mon' },
  { n: 2, label: 'Tue' },
  { n: 3, label: 'Wed' },
  { n: 4, label: 'Thu' },
  { n: 5, label: 'Fri' },
]

export default function CourseForm({ onSaved }: { onSaved: () => void }) {
  const supabase = createClient()
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [color, setColor] = useState('#3b82f6')
  const [mode, setMode] = useState<'week' | 'date'>('week')
  const [termStart, setTermStart] = useState('')
  const [days, setDays] = useState<number[]>([])
  const [error, setError] = useState('')

  function toggleDay(n: number) {
    setDays(days.includes(n)
      ? days.filter((d) => d !== n)
      : [...days, n].sort((a, b) => a - b))
  }

  async function save() {
    if (!name.trim()) return setError('Course name is required')
    if (mode === 'week' && !termStart)
      return setError('Week mode needs the Monday of Week 1')
    const { error } = await supabase.from('courses').insert({
      name: name.trim(),
      code: code.trim() || null,
      color,
      schedule_mode: mode,
      term_start: termStart || null,
      meeting_days: days,
    })
    if (error) return setError(error.message)
    setName('')
    setCode('')
    setTermStart('')
    setDays([])
    setError('')
    onSaved()
  }
    const input = 'w-full rounded border border-gray-600 bg-transparent p-2'

  return (
    <div className="space-y-3 rounded-lg border border-gray-700 p-4">
      <h2 className="text-lg font-semibold">Add a course</h2>
      <input className={input} placeholder="Course name (e.g. Intro to Econ)"
        value={name} onChange={(e) => setName(e.target.value)} />
      <div className="flex gap-2">
        <input className={input} placeholder="Code (e.g. ECON 10010)"
          value={code} onChange={(e) => setCode(e.target.value)} />
        <input type="color" className="h-10 w-14 rounded"
          value={color} onChange={(e) => setColor(e.target.value)} />
      </div>

      <p className="text-sm text-gray-400">How is the syllabus organized?</p>
      <div className="flex gap-2">
        {(['week', 'date'] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)}
            className={`flex-1 rounded p-2 border ${mode === m
              ? 'border-blue-500 bg-blue-600/20' : 'border-gray-600'}`}>
            {m === 'week' ? 'By week (Week 1, 2…)' : 'By date (Oct 14…)'}
          </button>
        ))}
      </div>

      {mode === 'week' && (
        <label className="block text-sm">
          Monday of Week 1
          <input type="date" className={input}
            value={termStart} onChange={(e) => setTermStart(e.target.value)} />
        </label>
      )}

      <div className="flex gap-2 text-sm">
        {DAYS.map((d) => (
          <button key={d.n} onClick={() => toggleDay(d.n)}
            className={`rounded px-3 py-1 border ${days.includes(d.n)
              ? 'border-blue-500 bg-blue-600/20' : 'border-gray-600'}`}>
            {d.label}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      <button onClick={save} className="w-full rounded bg-blue-600 p-2 text-white">
        Save course
      </button>
    </div>
  )
}