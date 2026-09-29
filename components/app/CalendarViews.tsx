'use client'
import { Flag } from 'lucide-react'
import { Card, CheckCircle, CourseDot, ListCard, SectionLabel, cx } from '@/components/ui'
import ItemRow from '@/components/app/ItemRow'
import { useItemEditor } from '@/components/app/ItemEditor'
import { addDays, startOfWeek, toISO } from '@/lib/dates'
import type { PlannerItem } from '@/lib/usePlanner'

type ViewProps = { items: PlannerItem[]; anchor: Date; toggle: (i: PlannerItem) => void }

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function groupByDay(items: PlannerItem[]) {
  const map = new Map<string, PlannerItem[]>()
  for (const i of items) {
    if (!i.date) continue
    const k = toISO(i.date)
    map.set(k, [...(map.get(k) ?? []), i])
  }
  return map
}

// Small item card used inside week columns
function ItemChip({ item, onToggle }: { item: PlannerItem; onToggle: () => void }) {
  const { openItem } = useItemEditor()
  const done = item.status === 'done'
  return (
    <div className="flex items-start gap-2 rounded-[10px] bg-bg p-2">
      <CheckCircle done={done} onClick={onToggle} />
      <button onClick={() => openItem(item)} className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
        <span className={cx('line-clamp-2 text-[13px] font-semibold leading-snug',
          done && 'text-muted line-through')}>
          {item.title}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted">
          <CourseDot color={item.course.color} size={6} />
          <span className="truncate">{item.course.code ?? item.course.name}</span>
          {item.priority === 'high' && !done && (
            <Flag size={10} fill="currentColor" strokeWidth={0} className="shrink-0 text-warm-text" />
          )}
        </span>
      </button>
    </div>
  )
}

/* ---------------- DAY ---------------- */
export function DayView({ items, anchor, toggle }: ViewProps) {
  const key = toISO(anchor)
  const list = items.filter((i) => i.date && toISO(i.date) === key)
  if (list.length === 0) return <Card className="text-[15px] text-muted">Nothing due this day.</Card>
  return (
    <ListCard>
      {list.map((i) => <ItemRow key={i.id} item={i} onToggle={() => toggle(i)} />)}
    </ListCard>
  )
}
/* ---------------- WEEK ---------------- */
export function WeekView({ items, anchor, toggle, onOpenDay }: ViewProps & { onOpenDay: (d: Date) => void }) {
  const weekStart = startOfWeek(anchor)
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const byDay = groupByDay(items)
  const todayKey = toISO(new Date())

  return (
    <>
      {/* Desktop: 7 columns */}
      <div className="hidden overflow-hidden rounded-card border border-border bg-surface md:grid md:grid-cols-7">
        {days.map((day, idx) => {
          const key = toISO(day)
          const list = byDay.get(key) ?? []
          return (
            <div key={key} className={cx('flex min-h-80 min-w-0 flex-col gap-2 p-2.5',
              idx !== 6 && 'border-r border-divider')}>
              <button onClick={() => onOpenDay(day)}
                className="flex flex-col items-start gap-0.5 rounded-control px-1.5 py-1 hover:bg-chip">
                <span className="text-xs font-bold uppercase tracking-[0.08em] text-muted">{WEEKDAYS[idx]}</span>
                <span className={cx('font-display text-2xl font-semibold',
                  key === todayKey && 'text-nav-active-text')}>
                  {day.getDate()}
                </span>
              </button>
              {list.map((i) => <ItemChip key={i.id} item={i} onToggle={() => toggle(i)} />)}
            </div>
          )
        })}
      </div>

      {/* Phone: stacked days */}
      <div className="flex flex-col gap-6 md:hidden">
        {days.map((day) => {
          const key = toISO(day)
          const list = byDay.get(key) ?? []
          return (
            <section key={key} className="flex flex-col gap-2.5">
              <SectionLabel tone={key === todayKey ? 'soft' : 'muted'} count={key === todayKey ? 'Today' : undefined}>
                {day.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </SectionLabel>
              {list.length === 0 ? (
                <p className="px-1 text-sm text-faint">Nothing due</p>
              ) : (
                <ListCard>
                  {list.map((i) => <ItemRow key={i.id} item={i} onToggle={() => toggle(i)} />)}
                </ListCard>
              )}
            </section>
          )
        })}
      </div>
    </>
  )
}
/* ---------------- MONTH ---------------- */
export function MonthView({ items, anchor, toggle, onSelect }: ViewProps & { onSelect: (d: Date) => void }) {
  const month = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  const selected = toISO(anchor)
  const todayKey = toISO(new Date())
  const offset = (month.getDay() + 6) % 7
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const rows = Math.ceil((offset + daysInMonth) / 7)
  const gridStart = startOfWeek(month)
  const cells = Array.from({ length: rows * 7 }, (_, i) => addDays(gridStart, i))
  const byDay = groupByDay(items)
  const selectedItems = byDay.get(selected) ?? []

  return (
    <div className="flex flex-col gap-7">
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
              <button key={key} onClick={() => onSelect(day)}
                aria-label={`${day.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}, ${list.length} items`}
                className={cx('flex min-h-16 flex-col gap-1 border-divider p-1.5 text-left transition md:min-h-28 md:p-2',
                  idx % 7 !== 6 && 'border-r',
                  idx < (rows - 1) * 7 && 'border-b',
                  !inMonth && 'bg-bg/60',
                  key === selected ? 'bg-nav-active' : 'hover:bg-chip/60')}>
                <span className={cx('flex h-6.5 w-6.5 items-center justify-center rounded-full text-[13px] font-semibold',
                  key === todayKey ? 'bg-primary text-on-primary' : inMonth ? 'text-text' : 'text-faint')}>
                  {day.getDate()}
                </span>
                <div className="flex flex-wrap gap-1 px-0.5 md:hidden">
                  {list.slice(0, 4).map((i) => <CourseDot key={i.id} color={i.course.color} size={6} />)}
                </div>
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
          {anchor.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
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