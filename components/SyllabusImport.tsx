'use client'
import { useState } from 'react'
import { FileText, Upload, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button, Card, Input, SectionLabel, Select } from '@/components/ui'
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
    setStatus('Reading the syllabus… this can take up to a minute.')
    try {
      const body = new FormData()
      body.append('file', file)
      body.append('mode', course.schedule_mode)
      const res = await fetch('/api/parse-syllabus', { method: 'POST', body })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setDrafts(json.items ?? [])
      setStatus(`Found ${json.items?.length ?? 0} items. Check them, then save.`)
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
    setStatus(`Saved ${rows.length} items.`)
    onSaved()
  }
    return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <SectionLabel>Import from syllabus</SectionLabel>
        <p className="text-sm text-muted">Upload the PDF. You review everything before it&apos;s saved.</p>
      </div>

      {!drafts && (
        <>
          <label className="flex cursor-pointer items-center gap-3 rounded-control border border-dashed border-border px-4 py-3.5 hover:bg-chip">
            <FileText size={18} className="shrink-0 text-muted" />
            <span className="flex-1 truncate text-sm font-medium">{file ? file.name : 'Choose a PDF'}</span>
            <input type="file" accept="application/pdf" className="sr-only"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
          <Button onClick={analyze} disabled={busy || !file}>
            <Upload size={16} /> {busy ? 'Reading…' : 'Analyze syllabus'}
          </Button>
        </>
      )}

      {status && <p className="text-sm text-muted">{status}</p>}

      {drafts && (
        <>
          <div className="flex max-h-[440px] flex-col divide-y divide-divider overflow-y-auto rounded-control border border-border">
            {drafts.map((d, i) => (
              <div key={i} className="flex flex-col gap-2 p-3">
                <div className="flex gap-2">
                  <Input aria-label="Title" className="h-9 text-sm" value={d.title}
                    onChange={(e) => update(i, { title: e.target.value })} />
                  <button aria-label="Remove item" onClick={() => setDrafts(drafts.filter((_, j) => j !== i))}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control text-muted hover:bg-chip">
                    <X size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Select aria-label="Type" className="h-9 text-sm" value={d.type}
                    onChange={(e) => update(i, { type: e.target.value })}>
                    {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </Select>
                  {weekMode ? (
                    <>
                      <Select aria-label="Week" className="h-9 text-sm" value={d.week ?? 1}
                        onChange={(e) => update(i, { week: Number(e.target.value) })}>
                        {Array.from({ length: 16 }, (_, k) => k + 1).map((w) => (
                          <option key={w} value={w}>Week {w}</option>
                        ))}
                      </Select>
                      <Select aria-label="Day" className="h-9 text-sm" value={d.weekday ?? 1}
                        onChange={(e) => update(i, { weekday: Number(e.target.value) })}>
                        {WEEKDAYS.map((w, k) => <option key={w} value={k + 1}>{w}</option>)}
                      </Select>
                    </>
                  ) : (
                    <Input aria-label="Due date" type="date" className="col-span-2 h-9 text-sm"
                      value={d.due_date ?? ''} onChange={(e) => update(i, { due_date: e.target.value })} />
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => { setDrafts(null); setStatus('') }}>Cancel</Button>
            <Button className="flex-1" onClick={saveAll} disabled={busy}>Save {drafts.length} items</Button>
          </div>
        </>
      )}
    </Card>
  )
}