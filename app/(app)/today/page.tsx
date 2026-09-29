'use client'
import { Plus } from 'lucide-react'
import { Button, ListCard, PageHeader, SectionLabel } from '@/components/ui'
import { useItemEditor } from '@/components/app/ItemEditor'
import ItemRow from '@/components/app/ItemRow'
import { NextExamCard, WeekLoadCard } from '@/components/app/TodayCards'
import { addDays, startOfWeek, toISO } from '@/lib/dates'
import { usePlanner } from '@/lib/usePlanner'

export default function TodayPage() {
  const { items, loading, toggle } = usePlanner()
  const { openItem } = useItemEditor()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayKey = toISO(today)
  const weekStart = startOfWeek(today)
  const weekEnd = addDays(weekStart, 7)
  const horizon = addDays(today, 8)

  const dated = items.filter((i) => i.date)
  const overdue = dated.filter((i) => i.date! < today && i.status !== 'done')
  const dueToday = dated.filter((i) => toISO(i.date!) === todayKey)
  const upcoming = dated.filter((i) => i.date! > today && i.date! < horizon && i.status !== 'done')
  const thisWeek = dated.filter((i) => i.date! >= weekStart && i.date! < weekEnd)

  const left = dueToday.filter((i) => i.status !== 'done').length
  const weight = thisWeek.reduce((s, i) => s + (i.weight ?? 0), 0)
  const subtitle = [
    `${left} left today`,
    overdue.length > 0 && `${overdue.length} overdue`,
    weight > 0 && `${weight}% of your grade due this week`,
  ].filter(Boolean).join(' · ')

  const title = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const dayLabel = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'short' })

  if (loading) return <p className="text-muted">Loading…</p>

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        title={title}
        subtitle={subtitle}
        action={
          <Button onClick={() => openItem()} className="hidden md:inline-flex">
            <Plus size={16} strokeWidth={2.5} /> New item
          </Button>
        }
      />

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_330px]">
        <div className="flex flex-col gap-6">
          {overdue.length > 0 && (
            <section className="flex flex-col gap-2.5">
              <SectionLabel tone="warm" count={overdue.length}>Overdue</SectionLabel>
              <ListCard>
                {overdue.map((i) => <ItemRow key={i.id} item={i} onToggle={() => toggle(i)} />)}
              </ListCard>
            </section>
          )}

          <section className="flex flex-col gap-2.5">
            <SectionLabel count={dueToday.length ? `${left} of ${dueToday.length} left` : undefined}>
              Today
            </SectionLabel>
            <ListCard>
              {dueToday.length === 0
                ? <p className="px-4.5 py-4 text-[15px] text-muted">Nothing due today.</p>
                : dueToday.map((i) => <ItemRow key={i.id} item={i} onToggle={() => toggle(i)} />)}
            </ListCard>
          </section>

          <section className="flex flex-col gap-2.5">
            <SectionLabel>Coming up</SectionLabel>
            <ListCard>
              {upcoming.length === 0
                ? <p className="px-4.5 py-4 text-[15px] text-muted">Nothing in the next week.</p>
                : upcoming.map((i) => (
                    <ItemRow key={i.id} item={i} leading={dayLabel(i.date!)} onToggle={() => toggle(i)} />
                  ))}
            </ListCard>
          </section>
        </div>

        <div className="flex flex-col gap-5">
          <NextExamCard items={items} today={today} />
          <WeekLoadCard items={items} weekStart={weekStart} today={today} />
        </div>
      </div>
    </div>
  )
}