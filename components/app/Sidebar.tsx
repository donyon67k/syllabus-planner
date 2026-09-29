'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { BookOpen, Calendar, CalendarDays, RefreshCw, Settings, Sun } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { COURSES_CHANGED, notifyItemsChanged } from '@/lib/events'
import { APP_NAME } from '@/design/brand'
import LilyPad from '@/components/app/Logo'
import { CourseDot, cx } from '@/components/ui'

// Sidebar links, in order. Add, remove or rename here.
const NAV = [
  { href: '/today', label: 'Today', icon: Sun },
  { href: '/week', label: 'Week', icon: CalendarDays },
  { href: '/month', label: 'Month', icon: Calendar },
  { href: '/courses', label: 'Courses', icon: BookOpen },
  { href: '/settings', label: 'Settings', icon: Settings },
]

type SidebarCourse = { id: string; code: string | null; name: string; color: string }

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const supabase = createClient()
  const [courses, setCourses] = useState<SidebarCourse[]>([])
  const [syncing, setSyncing] = useState(false)
  const [syncNote, setSyncNote] = useState('Tap to sync')

  const loadCourses = useCallback(() => {
    supabase.from('courses').select('id, code, name, color').order('code')
      .then(({ data }) => setCourses(data ?? []))
  }, [])

  useEffect(() => {
    loadCourses()
    window.addEventListener(COURSES_CHANGED, loadCourses)
    return () => window.removeEventListener(COURSES_CHANGED, loadCourses)
  }, [loadCourses])

  async function sync() {
    setSyncing(true)
    const res = await fetch('/api/canvas-sync', { method: 'POST' })
    setSyncing(false)
    if (!res.ok) return setSyncNote('Sync failed')
    const time = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    setSyncNote(`Synced at ${time}`)
    loadCourses()
    notifyItemsChanged()
  }

  return (
    <div className="flex h-full flex-col gap-7 px-4.5 pb-5 pt-7">
      <div className="flex items-center gap-2.5 px-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-primary text-on-primary">
          <LilyPad size={19} />
        </div>
        <span className="font-display text-[21px] font-semibold tracking-tight">{APP_NAME}</span>
      </div>

      <nav aria-label="Main" className="flex flex-col gap-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link key={href} href={href} onClick={onNavigate}
              className={cx('flex h-10.5 items-center gap-3 rounded-[11px] px-3 text-[15px] transition',
                active ? 'bg-nav-active font-bold text-nav-active-text'
                  : 'font-medium text-muted hover:text-text')}>
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="flex min-h-0 flex-col gap-1 overflow-y-auto">
        <p className="px-3 pb-1.5 text-xs font-bold uppercase tracking-[0.08em] text-muted">Courses</p>
        {courses.map((c) => (
          <Link key={c.id} href={`/courses/${c.id}`} onClick={onNavigate}
            className={cx('flex h-9 shrink-0 items-center gap-3 rounded-[10px] px-3 text-sm font-medium hover:bg-chip',
              pathname === `/courses/${c.id}` && 'bg-chip')}>
            <CourseDot color={c.color} size={9} />
            <span className="truncate">{c.code ?? c.name}</span>
          </Link>
        ))}
      </div>

      <div className="mt-auto flex items-center gap-2.5 rounded-control border border-border bg-surface py-3 pl-3.5 pr-3">
        <div className="flex-1">
          <p className="text-[13px] font-semibold">Canvas</p>
          <p className="text-xs text-muted">{syncNote}</p>
        </div>
        <button aria-label="Sync with Canvas" onClick={sync} disabled={syncing}
          className="flex h-8.5 w-8.5 items-center justify-center rounded-[9px] border border-border hover:bg-chip disabled:opacity-50">
          <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
        </button>
      </div>
    </div>
  )
}