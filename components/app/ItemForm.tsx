'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { notifyItemsChanged } from '@/lib/events'
import { Button, Field, Input, Segmented, Select, Textarea } from '@/components/ui'
import type { Course, Item } from '@/lib/types'

const TYPES = ['assignment', 'reading', 'exam', 'quiz', 'project', 'other'] as const
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function ItemForm({ item, defaultCourseId, onDone }: {
  item: Item | null; defaultCourseId?: string; onDone: () => void
}) {
  const supabase = createClient()
  const [courses, setCourses] = useState<Course[]>([])
  const [courseId, setCourseId] = useState(item?.course_id ?? defaultCourseId ?? '')
  const [title, setTitle] = useState(item?.title ?? '')
  const [type, setType] = useState<Item['type']>(item?.type ?? 'assignment')
  const [when, setWhen] = useState<'week' | 'date'>(item?.week && !item?.due_date ? 'week' : 'date')
  const [week, setWeek] = useState(String(item?.week ?? 1))
  const [weekday, setWeekday] = useState(String(item?.weekday ?? 1))
  const [date, setDate] = useState(item?.due_date ?? '')
  const [time, setTime] = useState(item?.due_time?.slice(0, 5) ?? '')
  const [priority, setPriority] = useState<'normal' | 'high'>(item?.priority ?? 'normal')
  const [weight, setWeight] = useState(item?.weight != null ? String(item.weight) : '')
  const [notes, setNotes] = useState(item?.notes ?? '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('courses').select('*').order('code').then(({ data }) => {
      const list = (data ?? []) as Course[]
      setCourses(list)
      if (!courseId && list[0]) setCourseId(list[0].id)
    })
  }, [])

  const course = courses.find((c) => c.id === courseId)
  const canUseWeeks = course?.schedule_mode === 'week' && !!course.term_start

  // A new item in a week-mode course starts on "Week & day"
  useEffect(() => {
    if (!item && course) setWhen(canUseWeeks ? 'week' : 'date')
  }, [courseId, courses.length])

  async function save() {
    if (!title.trim()) return setError('Add a title')
    if (!courseId) return setError('Pick a course')
    const useWeek = when === 'week' && canUseWeeks
    if (!useWeek && !date) return setError('Pick a due date')
    const row = {
      course_id: courseId,
      title: title.trim(),
      type,
      week: useWeek ? Number(week) : null,
      weekday: useWeek ? Number(weekday) : null,
      due_date: useWeek ? null : date,
      due_time: time || null,
      priority,
      weight: weight === '' ? null : Number(weight),
      notes: notes.trim() || null,
    }
    setSaving(true)
    const { error } = item
      ? await supabase.from('items').update(row).eq('id', item.id)
      : await supabase.from('items').insert(row)
    setSaving(false)
    if (error) return setError(error.message)
    notifyItemsChanged()
    onDone()
  }

  async function remove() {
    if (!item || !confirm('Delete this item?')) return
    await supabase.from('items').delete().eq('id', item.id)
    notifyItemsChanged()
    onDone()
  }
    return (
    <div className="flex flex-col gap-4">
      <Field label="Title">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Problem Set 5" autoFocus />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Course">
          <Select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.code ?? c.name}</option>)}
          </Select>
        </Field>
        <Field label="Type">
          <Select value={type} onChange={(e) => setType(e.target.value as Item['type'])}>
            {TYPES.map((t) => <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>)}
          </Select>
        </Field>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold text-muted">Due</span>
        {canUseWeeks && (
          <Segmented value={when} onChange={setWhen}
            options={[{ value: 'week', label: 'Week & day' }, { value: 'date', label: 'Exact date' }]} />
        )}
        {when === 'week' && canUseWeeks ? (
          <div className="grid grid-cols-2 gap-3">
            <Select aria-label="Week" value={week} onChange={(e) => setWeek(e.target.value)}>
              {Array.from({ length: 16 }, (_, i) => i + 1).map((w) => <option key={w} value={w}>Week {w}</option>)}
            </Select>
            <Select aria-label="Day" value={weekday} onChange={(e) => setWeekday(e.target.value)}>
              {WEEKDAYS.map((d, i) => <option key={d} value={i + 1}>{d}</option>)}
            </Select>
          </div>
        ) : (
          <Input aria-label="Due date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Time (optional)">
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </Field>
        <Field label="Grade weight (%)">
          <Input type="number" min={0} max={100} step="0.5" placeholder="—"
            value={weight} onChange={(e) => setWeight(e.target.value)} />
        </Field>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold text-muted">Priority</span>
        <Segmented value={priority} onChange={setPriority}
          options={[{ value: 'normal', label: 'Normal' }, { value: 'high', label: 'High' }]} />
      </div>

      <Field label="Notes">
        <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
      </Field>

      {error && <p className="text-sm font-semibold text-warm-text">{error}</p>}

      <div className="flex items-center gap-2 pt-1">
        {item && <Button variant="danger" onClick={remove}>Delete</Button>}
        <div className="flex-1" />
        <Button variant="secondary" onClick={onDone}>Cancel</Button>
        <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
      </div>
    </div>
  )
}