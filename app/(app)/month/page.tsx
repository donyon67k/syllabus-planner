'use client'
import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button, CourseDot, ListCard, PageHeader, SectionLabel, cx } from '@/components/ui'
import ItemRow from '@/components/app/ItemRow'
import { addDays, parseDate, startOfWeek, toISO } from '@/lib/dates'
import { usePlanner, type PlannerItem } from '@/lib/usePlanner'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function MonthPage() {
  const { items, loading, toggle } = usePlanner()
  const [month, setMonth] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [selected, setSelected] = useState(() => toISO(new Date()))

  const todayKey = toISO(new Date())
  const offset = (month.getDay() + 6) % 7 // blank days before the 1st (week starts Monday)
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const rows = Math.ceil((offset + daysInMonth) / 7)
  const gridStart = startOfWeek(month)
  const cells = Array.from({ length: rows * 7 }, (_, i) => addDays(gridStart, i))

  // Group items by day
  const byDay = new Map<string, PlannerItem[]>()
  for (const i of items) {
    if (!i.date) continue
    const k = toISO(i.date)
    byDay.set(k, [...(byDay.get(k) ?? []), i])
  }

  const shift = (n: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1))
  const goToday = () => {
    const d = new Date()
    setMonth(new Date(d.getFullYear(), d.getMonth(), 1))
    setSelected(toISO(d))
  }
  const selectedItems = byDay.get(selected) ?? []

  if (loading) return <p className="text-muted">Loading…</p>
    return (
    <div className="flex flex-col gap-7">
      <PageHeader
        title={month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" size="icon" aria-label="Previous month" onClick={() => shift(-1)}>
              <ChevronLeft size={18} />
            </Button>
            <Button variant="secondary" className="h-10 px-4 text-sm" onClick={goToday}>Today</Button>
            <Button variant="secondary" size="icon" aria-label="Next month" onClick={() => shift(1)}>
              <ChevronRight size={18} />
            </Button>
          </div>
        }
      />

      <div className="overflow-hidden rounded-card border border-border bg-surface">
        <div className="grid grid-cols-7 border-b border-border">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-2.5 text-center text-xs font-bold uppercase tracking-[0.08em] text-muted">
              <span className="md:hidden">{d[0]}</span>
              <span className="hidden md:inline">{d}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            const key = toISO(day)
            const list = byDay.get(key) ?? []
            const inMonth = day.getMonth() === month.getMonth()
            return (
              <button
                key={key}
                onClick={() => setSelected(key)}
                aria-label={`${day.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}, ${list.length} items`}
                className={cx(
                  'flex min-h-16 flex-col gap-1 border-divider p-1.5 text-left transition md:min-h-28 md:p-2',
                  idx % 7 !== 6 && 'border-r',
                  idx < (rows - 1) * 7 && 'border-b',
                  !inMonth && 'bg-bg/60',
                  key === selected ? 'bg-nav-active' : 'hover:bg-chip/60',
                )}
              >
                <span className={cx(
                  'flex h-6.5 w-6.5 items-center justify-center rounded-full text-[13px] font-semibold',
                  key === todayKey ? 'bg-primary text-on-primary' : inMonth ? 'text-text' : 'text-faint',
                )}>
                  {day.getDate()}
                </span>

                {/* Phone: dots */}
                <div className="flex flex-wrap gap-1 px-0.5 md:hidden">
                  {list.slice(0, 4).map((i) => <CourseDot key={i.id} color={i.course.color} size={6} />)}
                </div>

                {/* Desktop: titles */}
                <div className="hidden min-w-0 flex-col gap-0.5 md:flex">
                  {list.slice(0, 3).map((i) => (
                    <span key={i.id} className={cx('flex min-w-0 items-center gap-1.5 text-xs',
                      i.status === 'done' ? 'text-faint line-through' : 'text-text')}>
                      <CourseDot color={i.course.color} size={6} />
                      <span className="truncate">{i.title}</span>
                    </span>
                  ))}
                  {list.length > 3 && <span className="text-xs text-muted">+{list.length - 3} more</span>}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <section className="flex flex-col gap-2.5">
        <SectionLabel count={selectedItems.length || undefined}>
          {parseDate(selected).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </SectionLabel>
        {selectedItems.length === 0 ? (
          <p className="px-1 text-sm text-faint">Nothing due</p>
        ) : (
          <ListCard>
            {selectedItems.map((i) => <ItemRow key={i.id} item={i} onToggle={() => toggle(i)} />)}
          </ListCard>
        )}
      </section>
    </div>
  )
}