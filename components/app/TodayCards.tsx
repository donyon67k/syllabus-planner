'use client'
import { Card, CourseDot, SectionLabel, cx } from '@/components/ui'
import { addDays, toISO } from '@/lib/dates'
import { formatTime } from '@/lib/format'
import type { PlannerItem } from '@/lib/usePlanner'

export function NextExamCard({ items, today }: { items: PlannerItem[]; today: Date }) {
  const exam = items.find((i) => i.type === 'exam' && i.date && i.date >= today && i.status !== 'done')
  if (!exam || !exam.date) return null
  const days = Math.round((exam.date.getTime() - today.getTime()) / 86400000)
  const when = exam.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  return (
    <section className="flex flex-col gap-3.5 rounded-card bg-soft-bg p-5.5">
      <SectionLabel tone="soft">Next exam</SectionLabel>
      <div className="flex flex-col gap-1.5">
        <p className="font-display text-[28px] font-semibold tracking-tight">{exam.title}</p>
        <p className="flex items-center gap-2 text-sm text-muted">
          <CourseDot color={exam.course.color} />
          {[exam.course.code, when, formatTime(exam.due_time)].filter(Boolean).join(' · ')}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-control bg-surface px-3.5 py-3">
          <p className="font-display text-[26px] font-semibold">{days === 0 ? 'Today' : days}</p>
          <p className="text-[13px] text-muted">{days === 0 ? 'good luck' : days === 1 ? 'day away' : 'days away'}</p>
        </div>
        <div className="rounded-control bg-surface px-3.5 py-3">
          <p className="font-display text-[26px] font-semibold">{exam.weight != null ? `${exam.weight}%` : '—'}</p>
          <p className="text-[13px] text-muted">of your grade</p>
        </div>
      </div>
    </section>
  )
}

export function WeekLoadCard({ items, weekStart, today }: {
  items: PlannerItem[]; weekStart: Date; today: Date
}) {
  const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  const days = labels.map((label, i) => {
    const key = toISO(addDays(weekStart, i))
    return { label, key, count: items.filter((it) => it.date && toISO(it.date) === key).length }
  })
  const total = days.reduce((s, d) => s + d.count, 0)
  const max = Math.max(1, ...days.map((d) => d.count))
  const todayKey = toISO(today)

  return (
    <Card className="flex flex-col gap-4.5 p-5.5">
      <div className="flex items-baseline justify-between">
        <SectionLabel>This week</SectionLabel>
        <span className="text-[13px] text-muted">{total} items</span>
      </div>
      <div className="grid h-30 grid-cols-7 items-end gap-2">
        {days.map((d) => (
          <div key={d.key} className="flex h-full flex-col items-center justify-end gap-2">
            <span className="text-xs font-semibold text-muted">{d.count}</span>
            <div
              className={cx('w-full rounded-[7px]', d.key === todayKey ? 'bg-primary' : 'bg-border')}
              style={{ height: d.count === 0 ? 4 : `${(d.count / max) * 80}px` }}
            />
          </div>
        ))}
      </div>
      <div className="-mt-2 grid grid-cols-7 gap-2">
        {days.map((d) => (
          <span key={d.key} className={cx('text-center text-xs',
            d.key === todayKey ? 'font-extrabold text-nav-active-text' : 'font-semibold text-muted')}>
            {d.label}
          </span>
        ))}
      </div>
    </Card>
  )
}