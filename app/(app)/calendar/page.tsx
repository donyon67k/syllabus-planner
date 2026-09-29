'use client'
import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button, PageHeader, Select } from '@/components/ui'
import { DayView, MonthView, WeekView } from '@/components/app/CalendarViews'
import { addDays, startOfWeek } from '@/lib/dates'
import { usePlanner } from '@/lib/usePlanner'

type View = 'month' | 'week' | 'day'

const todayMidnight = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export default function CalendarPage() {
  const { items, loading, toggle } = usePlanner()
  const [view, setView] = useState<View>('month') // Month is the default view
  const [anchor, setAnchor] = useState(todayMidnight)

  function step(dir: 1 | -1) {
    if (view === 'month') setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() + dir, 1))
    else setAnchor(addDays(anchor, dir * (view === 'week' ? 7 : 1)))
  }

  const short = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const weekStart = startOfWeek(anchor)
  const title =
    view === 'month' ? anchor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      : view === 'week' ? `${short(weekStart)} – ${short(addDays(weekStart, 6))}`
        : anchor.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  if (loading) return <p className="text-muted">Loading…</p>

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        title={title}
        action={
          <div className="flex flex-wrap gap-2">
            <Select aria-label="Calendar view" value={view} className="h-10 w-28"
              onChange={(e) => setView(e.target.value as View)}>
              <option value="month">Month</option>
              <option value="week">Week</option>
              <option value="day">Day</option>
            </Select>
            <Button variant="secondary" size="icon" aria-label="Previous" onClick={() => step(-1)}>
              <ChevronLeft size={18} />
            </Button>
            <Button variant="secondary" className="h-10 px-4 text-sm" onClick={() => setAnchor(todayMidnight())}>
              Today
            </Button>
            <Button variant="secondary" size="icon" aria-label="Next" onClick={() => step(1)}>
              <ChevronRight size={18} />
            </Button>
          </div>
        }
      />

      {view === 'month' && <MonthView items={items} anchor={anchor} toggle={toggle} onSelect={setAnchor} />}
      {view === 'week' && (
        <WeekView items={items} anchor={anchor} toggle={toggle}
          onOpenDay={(d) => { setAnchor(d); setView('day') }} />
      )}
      {view === 'day' && <DayView items={items} anchor={anchor} toggle={toggle} />}
    </div>
  )
}