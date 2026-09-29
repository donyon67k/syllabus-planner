'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { notifyCoursesChanged, notifyItemsChanged } from '@/lib/events'
import { COURSE_COLORS } from '@/design/brand'
import { Button, Field, Input, Segmented, cx } from '@/components/ui'
import type { Course } from '@/lib/types'

const DAYS = [
  { n: 1, label: 'Mon' }, { n: 2, label: 'Tue' }, { n: 3, label: 'Wed' },
  { n: 4, label: 'Thu' }, { n: 5, label: 'Fri' },
]

export default function CourseForm({ course, onDone, onDeleted }: {
  course: Course | null; onDone: () => void; onDeleted?: () => void
}) {
  const supabase = createClient()
  const [name, setName] = useState(course?.name ?? '')
  const [code, setCode] = useState(course?.code ?? '')
  const [color, setColor] = useState(course?.color ?? COURSE_COLORS[0])
  const [mode, setMode] = useState<'week' | 'date'>(course?.schedule_mode ?? 'week')
  const [termStart, setTermStart] = useState(course?.term_start ?? '')
  const [days, setDays] = useState<number[]>(course?.meeting_days ?? [])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const toggleDay = (n: number) =>
    setDays(days.includes(n) ? days.filter((d) => d !== n) : [...days, n].sort((a, b) => a - b))

  async function save() {
    if (!name.trim()) return setError('Add a course name')
    if (mode === 'week' && !termStart) return setError('Week-based courses need the Monday of Week 1')
    const row = {
      name: name.trim(),
      code: code.trim() || null,
      color,
      schedule_mode: mode,
      term_start: termStart || null,
      meeting_days: days,
    }
    setSaving(true)
    const { error } = course
      ? await supabase.from('courses').update(row).eq('id', course.id)
      : await supabase.from('courses').insert(row)
    setSaving(false)
    if (error) return setError(error.message)
    notifyCoursesChanged()
    notifyItemsChanged()
    onDone()
  }

  async function remove() {
    if (!course || !confirm(`Delete ${course.code ?? course.name} and all of its items?`)) return
    await supabase.from('courses').delete().eq('id', course.id)
    notifyCoursesChanged()
    notifyItemsChanged()
    onDeleted?.()
  }
    return (
    <div className="flex flex-col gap-4">
      <Field label="Course name">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Intro to American Politics" autoFocus />
      </Field>

      <Field label="Course code" hint="Match what Canvas shows (e.g. POLS 30101) so assignments sync to this course.">
        <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="POLS 30101" />
      </Field>

      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold text-muted">Color</span>
        <div className="flex flex-wrap items-center gap-2.5">
          {COURSE_COLORS.map((c) => (
            <button key={c} type="button" aria-label={`Color ${c}`} onClick={() => setColor(c)}
              className={cx('h-8 w-8 rounded-full transition',
                color === c && 'ring-2 ring-text ring-offset-2 ring-offset-surface')}
              style={{ background: c }} />
          ))}
          <label className="flex h-8 items-center gap-2 rounded-full border border-border px-2.5 text-xs font-semibold text-muted">
            Custom
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
              className="h-5 w-5 cursor-pointer rounded-full border-0 bg-transparent p-0" />
          </label>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold text-muted">How is the syllabus organized?</span>
        <Segmented value={mode} onChange={setMode}
          options={[{ value: 'week', label: 'By week' }, { value: 'date', label: 'By date' }]} />
      </div>

      {mode === 'week' && (
        <Field label="Monday of Week 1"
          hint="If a professor reused an old syllabus, set this to this semester's Week 1 and every item moves with it.">
          <Input type="date" value={termStart} onChange={(e) => setTermStart(e.target.value)} />
        </Field>
      )}

      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold text-muted">Class meets</span>
        <div className="flex gap-2">
          {DAYS.map((d) => (
            <button key={d.n} type="button" onClick={() => toggleDay(d.n)}
              className={cx('h-10 flex-1 rounded-control border text-sm font-semibold transition',
                days.includes(d.n)
                  ? 'border-primary bg-nav-active text-nav-active-text'
                  : 'border-border text-muted hover:text-text')}>
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm font-semibold text-warm-text">{error}</p>}

      <div className="flex items-center gap-2 pt-1">
        {course && <Button variant="danger" onClick={remove}>Delete course</Button>}
        <div className="flex-1" />
        <Button variant="secondary" onClick={onDone}>Cancel</Button>
        <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
      </div>
    </div>
  )
}