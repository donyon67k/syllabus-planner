'use client'
import { CheckCircle, Chip, CourseDot, PriorityBadge, cx } from '@/components/ui'
import { TYPE_LABEL, formatTime } from '@/lib/format'
import type { PlannerItem } from '@/lib/usePlanner'

export default function ItemRow({ item, onToggle, leading }: {
  item: PlannerItem
  onToggle: () => void
  leading?: string // optional day label on the left, e.g. "Wed"
}) {
  const done = item.status === 'done'
  const when = formatTime(item.due_time) ?? (item.type === 'reading' ? 'Before class' : null)
  const meta = [item.course.code ?? item.course.name, TYPE_LABEL[item.type], when]
    .filter(Boolean).join(' · ')

  return (
    <div className="flex items-center gap-3.5 px-4.5 py-3.5">
      {leading && <span className="w-10 shrink-0 text-[13px] font-bold text-muted">{leading}</span>}
      <CheckCircle done={done} onClick={onToggle} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className={cx('truncate text-[15px] font-semibold', done && 'text-muted line-through')}>
          {item.title}
        </p>
        <div className="flex items-center gap-2 text-[13px] text-muted">
          <CourseDot color={item.course.color} />
          <span className="truncate">{meta}</span>
        </div>
      </div>
      {item.priority === 'high' && !done && (
        <>
          <span className="hidden sm:inline-flex"><PriorityBadge /></span>
          <span className="inline-flex sm:hidden"><PriorityBadge compact /></span>
        </>
      )}
      {item.weight != null && <Chip>{item.weight}%</Chip>}
    </div>
  )
}