'use client'
import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button, ListCard, PageHeader, SectionLabel } from '@/components/ui'
import ItemRow from '@/components/app/ItemRow'
import { addDays, startOfWeek, toISO } from '@/lib/dates'
import { usePlanner } from '@/lib/usePlanner'

export default function WeekPage() {
  const { items, loading, toggle } = usePlanner()
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))

  const todayKey = toISO(new Date())
  const weekEnd = addDays(weekStart, 7)
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const inWeek = items.filter((i) => i.date && i.date >= weekStart && i.date < weekEnd)
  const short = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  if (loading) return <p className="text-muted">Loading…</p>

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        title={`Week of ${short(weekStart)}`}
        subtitle={`${short(weekStart)} – ${short(addDays(weekStart, 6))} · ${inWeek.length} items`}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" size="icon" aria-label="Previous week"
              onClick={() => setWeekStart(addDays(weekStart, -7))}>
              <ChevronLeft size={18} />
            </Button>
            <Button variant="secondary" className="h-10 px-4 text-sm"
              onClick={() => setWeekStart(startOfWeek(new Date()))}>
              This week
            </Button>
            <Button variant="secondary" size="icon" aria-label="Next week"
              onClick={() => setWeekStart(addDays(weekStart, 7))}>
              <ChevronRight size={18} />
            </Button>
          </div>
        }
      />

      <div className="flex flex-col gap-6">
        {days.map((day) => {
          const key = toISO(day)
          const due = inWeek.filter((i) => toISO(i.date!) === key)
          const isToday = key === todayKey
          return (
            <section key={key} className="flex flex-col gap-2.5">
              <SectionLabel tone={isToday ? 'soft' : 'muted'} count={isToday ? 'Today' : undefined}>
                {day.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </SectionLabel>
              {due.length === 0 ? (
                <p className="px-1 text-sm text-faint">Nothing due</p>
              ) : (
                <ListCard>
                  {due.map((i) => <ItemRow key={i.id} item={i} onToggle={() => toggle(i)} />)}
                </ListCard>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}