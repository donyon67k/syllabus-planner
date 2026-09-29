'use client'
import Link from 'next/link'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button, Card, CourseDot, PageHeader } from '@/components/ui'
import Sheet from '@/components/app/Sheet'
import CourseForm from '@/components/app/CourseForm'
import { usePlanner } from '@/lib/usePlanner'

export default function CoursesPage() {
  const { items, courses, loading } = usePlanner()
  const [adding, setAdding] = useState(false)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const sorted = [...courses].sort((a, b) => (a.code ?? a.name).localeCompare(b.code ?? b.name))

  if (loading) return <p className="text-muted">Loading…</p>

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        title="Courses"
        subtitle={`${courses.length} ${courses.length === 1 ? 'course' : 'courses'} this semester`}
        action={
          <Button onClick={() => setAdding(true)}>
            <Plus size={16} strokeWidth={2.5} /> New course
          </Button>
        }
      />

      {courses.length === 0 ? (
        <Card className="text-[15px] text-muted">
          No courses yet. Add one, or sync Canvas from the sidebar to create them automatically.
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sorted.map((c) => {
            const mine = items.filter((i) => i.course_id === c.id)
            const upcoming = mine.filter((i) => i.date && i.date >= today && i.status !== 'done')
            const next = upcoming[0]
            const done = mine.filter((i) => i.status === 'done').length
            return (
              <Link key={c.id} href={`/courses/${c.id}`}
                className="flex min-h-44 flex-col gap-3 rounded-card border border-border bg-surface p-5 transition hover:border-faint">
                <div className="flex items-center gap-2.5">
                  <CourseDot color={c.color} size={10} />
                  <span className="text-sm font-bold text-muted">{c.code ?? 'No code'}</span>
                </div>
                <p className="font-display text-2xl font-semibold leading-tight tracking-tight">{c.name}</p>
                <div className="mt-auto flex flex-col gap-1 text-sm text-muted">
                  <span className="truncate">
                    {next
                      ? `Next: ${next.title} · ${next.date!.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                      : 'Nothing upcoming'}
                  </span>
                  <span>
                    {upcoming.length} upcoming · {done} done · {c.schedule_mode === 'week' ? 'By week' : 'By date'}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      <Sheet open={adding} onClose={() => setAdding(false)} title="New course">
        {adding && <CourseForm course={null} onDone={() => setAdding(false)} />}
      </Sheet>
    </div>
  )
}