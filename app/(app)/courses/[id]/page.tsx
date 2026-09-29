'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft, Pencil, Plus } from 'lucide-react'
import { Button, CourseDot, ListCard, PageHeader, SectionLabel } from '@/components/ui'
import ItemRow from '@/components/app/ItemRow'
import Sheet from '@/components/app/Sheet'
import CourseForm from '@/components/app/CourseForm'
import SyllabusImport from '@/components/SyllabusImport'
import { useItemEditor } from '@/components/app/ItemEditor'
import { parseDate } from '@/lib/dates'
import { notifyItemsChanged } from '@/lib/events'
import { usePlanner } from '@/lib/usePlanner'

export default function CoursePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { items, courses, loading, toggle } = usePlanner()
  const { openItem } = useItemEditor()
  const [editing, setEditing] = useState(false)

  if (loading) return <p className="text-muted">Loading…</p>

  const course = courses.find((c) => c.id === id)
  if (!course) {
    return (
      <p className="text-muted">
        Course not found. <Link href="/courses" className="font-semibold text-text underline">Back to courses</Link>
      </p>
    )
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const mine = items.filter((i) => i.course_id === id)
  const pastDue = mine.filter((i) => i.status !== 'done' && i.date && i.date < today)
  const upcoming = mine.filter((i) => i.status !== 'done' && (!i.date || i.date >= today))
  const done = mine.filter((i) => i.status === 'done')
  const tracked = mine.reduce((s, i) => s + (i.weight ?? 0), 0)

  const short = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const subtitle = [
    course.code,
    course.schedule_mode === 'week'
      ? `By week${course.term_start ? ` · Week 1 starts ${short(parseDate(course.term_start))}` : ''}`
      : 'By date',
    tracked > 0 && `${tracked}% of grade tracked`,
  ].filter(Boolean).join(' · ')

  const list = (rows: typeof mine) => (
    <ListCard>
      {rows.map((i) => (
        <ItemRow key={i.id} item={i} leading={i.date ? short(i.date) : '—'} onToggle={() => toggle(i)} />
      ))}
    </ListCard>
  )
    return (
    <div className="flex flex-col gap-7">
      <Link href="/courses"
        className="-mb-3 inline-flex w-fit items-center gap-1 text-sm font-semibold text-muted hover:text-text">
        <ChevronLeft size={16} /> Courses
      </Link>

      <PageHeader
        title={<span className="flex items-center gap-3"><CourseDot color={course.color} size={14} />{course.name}</span>}
        subtitle={subtitle}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setEditing(true)}>
              <Pencil size={15} /> Edit
            </Button>
            <Button onClick={() => openItem(null, course.id)}>
              <Plus size={16} strokeWidth={2.5} /> New item
            </Button>
          </div>
        }
      />

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-6">
          {pastDue.length > 0 && (
            <section className="flex flex-col gap-2.5">
              <SectionLabel tone="warm" count={pastDue.length}>Past due</SectionLabel>
              {list(pastDue)}
            </section>
          )}

          <section className="flex flex-col gap-2.5">
            <SectionLabel count={upcoming.length}>Upcoming</SectionLabel>
            {upcoming.length === 0
              ? <p className="px-1 text-sm text-faint">Nothing upcoming. Import the syllabus or add an item.</p>
              : list(upcoming)}
          </section>

          {done.length > 0 && (
            <section className="flex flex-col gap-2.5">
              <SectionLabel count={done.length}>Done</SectionLabel>
              {list(done)}
            </section>
          )}
        </div>

        <SyllabusImport course={course} onSaved={notifyItemsChanged} />
      </div>

      <Sheet open={editing} onClose={() => setEditing(false)} title="Edit course">
        {editing && (
          <CourseForm course={course} onDone={() => setEditing(false)}
            onDeleted={() => router.push('/courses')} />
        )}
      </Sheet>
    </div>
  )
}