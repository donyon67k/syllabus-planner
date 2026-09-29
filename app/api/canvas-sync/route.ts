import { NextResponse } from 'next/server'
import ical from 'node-ical'
import { createServerSupabase } from '@/lib/supabase/server'

const TIMEZONE = 'America/Indiana/Indianapolis'
const COLORS = ['#297045', '#006DAA', '#FFB17A', '#73E2A7', '#C2573A', '#7A5CA8', '#3A8F8A', '#B08D57']

// Canvas stores due times in UTC; convert to your local date and time
function localDate(d: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d)
}
function localTime(d: Date) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: TIMEZONE, hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(d)
}

// "POLS 30101" and "FA26-POLS-30101-01" both become comparable letters/numbers
const norm = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '')
const text = (v: unknown) =>
  typeof v === 'string' ? v : ((v as { val?: string })?.val ?? '')

// "FA26-POLS-30101-CX-01" -> "POLS 30101"
function codeFromLabel(label: string) {
  const m = label.match(/([A-Z]{2,5})-(\d{5})/)
  return m ? `${m[1]} ${m[2]}` : null
}

export async function POST() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })

  const { data: settings } = await supabase
    .from('user_settings').select('canvas_feed_url, semester_start').maybeSingle()
  if (!settings?.canvas_feed_url)
    return NextResponse.json({ error: 'Add your Canvas feed link first' }, { status: 400 })

  const feed = await fetch(settings.canvas_feed_url)
  if (!feed.ok)
    return NextResponse.json({ error: 'Could not download the Canvas feed' }, { status: 400 })
  type IcsEvent = { type?: string; uid?: string; start?: Date & { dateOnly?: boolean }; summary?: unknown }
  const events = Object.values(ical.sync.parseICS(await feed.text())) as unknown as IcsEvent[]

  // 1. Pull out assignments (skipping anything before the semester start)
  const assignments = events.flatMap((ev) => {
    if (!ev || ev.type !== 'VEVENT' || !String(ev.uid).includes('assignment') || !ev.start) return []
    const start = ev.start
    const dueKey = start.dateOnly ? start.toISOString().slice(0, 10) : localDate(start)
    if (settings.semester_start && dueKey < settings.semester_start) return []
    const summary = text(ev.summary)
    return [{
      uid: String(ev.uid),
      start,
      dueKey,
      label: summary.match(/\[([^\]]+)\]\s*$/)?.[1] ?? '',
      title: summary.replace(/\s*\[[^\]]+\]\s*$/, ''),
    }]
  })

  // 2. Create any courses we don't have yet
  const { data: existing } = await supabase.from('courses').select('id, code')
  const courses = existing ?? []
  const findCourse = (label: string) =>
    courses.find((c) => c.code && norm(label).includes(norm(c.code)))

  const created: string[] = []
  for (const label of new Set(assignments.map((a) => a.label))) {
    const code = codeFromLabel(label)
    if (!code || findCourse(label)) continue
    const { data, error } = await supabase.from('courses').insert({
      user_id: user.id,
      name: code,
      code,
      schedule_mode: 'date',
      color: COLORS[courses.length % COLORS.length],
    }).select('id, code').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    courses.push(data)
    created.push(code)
  }

  // 3. Turn assignments into planner items
  const rows = []
  const unmatched = new Set<string>()
  for (const a of assignments) {
    const course = findCourse(a.label)
    if (!course) {
      if (a.label) unmatched.add(a.label)
      continue
    }
    rows.push({
      user_id: user.id,
      course_id: course.id,
      title: a.title,
      type: /exam|midterm|final/i.test(a.title) ? 'exam'
        : /quiz/i.test(a.title) ? 'quiz' : 'assignment',
      due_date: a.dueKey,
      due_time: a.start.dateOnly ? null : localTime(a.start),
      source: 'canvas',
      external_id: a.uid,
    })
  }

  if (rows.length) {
    const { error } = await supabase
      .from('items').upsert(rows, { onConflict: 'user_id,external_id' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ synced: rows.length, created, unmatched: [...unmatched] })
}