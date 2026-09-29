'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Course } from '@/lib/types'

type Draft = { title: string; type: string; week?: number; weekday?: number; due_date?: string }

const TYPES = ['assignment', 'reading', 'exam', 'quiz', 'project', 'other']
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function SyllabusImport({ course, onSaved }: { course: Course; onSaved: () => void }) {
  const supabase = createClient()
  const weekMode = course.schedule_mode === 'week'
  const [file, setFile] = useState<File | null>(null)
  const [drafts, setDrafts] = useState<Draft[] | null>(null)
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)

  async function analyze() {
    if (!file) return
    setBusy(true)
    setStatus('Reading syllabus… this can take up to a minute')
    try {
      const body = new FormData()
      body.append('file', file)
      body.append('mode', course.schedule_mode)
      const res = await fetch('/api/parse-syllabus', { method: 'POST', body })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setDrafts(json.items ?? [])
      setStatus(`Found ${json.items?.length ?? 0} items. Review, then save.`)
    } catch (e) {
      setStatus('Error: ' + (e instanceof Error ? e.message : 'something went wrong'))
    }
    setBusy(false)
  }

  function update(i: number, patch: Partial<Draft>) {
    setDrafts((d) => d!.map((x, j) => (j === i ? { ...x, ...patch } : x)))
  }

  async function saveAll() {
    if (!drafts?.length) return
    setBusy(true)
    const rows = drafts.map((d) => ({
      course_id: course.id,
      title: d.title,
      type: TYPES.includes(d.type) ? d.type : 'other',
      week: weekMode ? d.week ?? null : null,
      weekday: weekMode ? d.weekday ?? null : null,
      due_date: weekMode ? null : d.due_date || null,
      source: 'syllabus',
    }))
    const { error } = await supabase.from('items').insert(rows)
    setBusy(false)
    if (error) return setStatus('Error: ' + error.message)
    setDrafts(null)
    setFile(null)
    setStatus(`Saved ${rows.length} items!`)
    onSaved()
  }
    const input = 'rounded border border-gray-600 bg-transparent p-1 text-sm'

  return (
    <div className="space-y-3 rounded-lg border border-gray-700 p-4">
      <h2 className="text-lg font-semibold">Import from syllabus</h2>
      {!drafts && (
        <div className="flex flex-wrap items-center gap-2">
          <input type="file" accept="application/pdf" className="text-sm"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <button onClick={analyze} disabled={busy || !file}
            className="rounded bg-blue-600 px-3 py-2 text-white disabled:opacity-50">
            {busy ? 'Reading…' : 'Analyze'}
          </button>
        </div>
      )}
      {status && <p className="text-sm text-gray-400">{status}</p>}
      {drafts && (
        <>
          <ul className="space-y-2">
            {drafts.map((d, i) => (
              <li key={i} className="flex flex-wrap items-center gap-2 rounded border border-gray-700 p-2">
                <input className={`${input} min-w-40 flex-1`} value={d.title}
                  onChange={(e) => update(i, { title: e.target.value })} />
                <select className={input} value={d.type} onChange={(e) => update(i, { type: e.target.value })}>
                  {TYPES.map((t) => <option key={t} value={t} className="bg-black">{t}</option>)}
                </select>
                {weekMode ? (
                  <>
                    <input type="number" min={1} max={20} className={`${input} w-16`} value={d.week ?? ''}
                      onChange={(e) => update(i, { week: Number(e.target.value) })} />
                    <select className={input} value={d.weekday ?? 1}
                      onChange={(e) => update(i, { weekday: Number(e.target.value) })}>
                      {WEEKDAYS.map((w, k) => <option key={w} value={k + 1} className="bg-black">{w}</option>)}
                    </select>
                  </>
                ) : (
                  <input type="date" className={input} value={d.due_date ?? ''}
                    onChange={(e) => update(i, { due_date: e.target.value })} />
                )}
                <button onClick={() => setDrafts(drafts.filter((_, j) => j !== i))}
                  className="text-sm text-red-400">✕</button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <button onClick={saveAll} disabled={busy}
              className="flex-1 rounded bg-blue-600 p-2 text-white disabled:opacity-50">
              Save {drafts.length} items
            </button>
            <button onClick={() => { setDrafts(null); setStatus('') }}
              className="rounded border border-gray-600 px-3">Cancel</button>
          </div>
        </>
      )}
    </div>
  )
}