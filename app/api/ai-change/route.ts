import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { geminiJSON } from '@/lib/gemini'
import { dueDate, toISO } from '@/lib/dates'
import type { AiChange } from '@/lib/aiChanges'
import type { Course, Item } from '@/lib/types'

const schema = {
  type: 'OBJECT',
  properties: {
    summary: { type: 'STRING' },
    changes: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          action: {
            type: 'STRING',
            enum: ['shift_course', 'set_term_start', 'update_item', 'delete_item', 'add_item'],
          },
          description: { type: 'STRING' },
          course_id: { type: 'STRING' },
          item_id: { type: 'STRING' },
          days: { type: 'INTEGER' },
          from_date: { type: 'STRING' },
          term_start: { type: 'STRING' },
          title: { type: 'STRING' },
          type: {
            type: 'STRING',
            enum: ['assignment', 'reading', 'exam', 'quiz', 'project', 'other'],
          },
          due_date: { type: 'STRING' },
          due_time: { type: 'STRING' },
          priority: { type: 'STRING', enum: ['normal', 'high'] },
          status: { type: 'STRING', enum: ['todo', 'done'] },
          weight: { type: 'NUMBER' },
        },
        required: ['action', 'description'],
      },
    },
  },
  required: ['summary', 'changes'],
}

export async function POST(req: Request) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })

  const { message } = await req.json()
  if (!message?.trim()) return NextResponse.json({ error: 'Type a change first' }, { status: 400 })

  const [{ data: courses }, { data: items }] = await Promise.all([
    supabase.from('courses').select('*'),
    supabase.from('items').select('*').eq('status', 'todo'),
  ])
  const byId = new Map((courses ?? []).map((c: Course) => [c.id, c]))

  const courseList = (courses ?? []).map((c: Course) => ({
    id: c.id, code: c.code, name: c.name, mode: c.schedule_mode, week1_monday: c.term_start,
  }))
  const itemList = (items ?? []).map((i: Item) => {
    const c = byId.get(i.course_id)
    const d = c ? dueDate(i, c) : null
    return {
      id: i.id, course_id: i.course_id, course: c?.code ?? c?.name, title: i.title,
      type: i.type, due: d ? toISO(d) : null, week: i.week, priority: i.priority, weight: i.weight,
    }
  })

  const today = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Indiana/Indianapolis',
    weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date())

  const prompt = `You update a college student's planner app. Today is ${today}.

COURSES:
${JSON.stringify(courseList)}

UPCOMING ITEMS (not done yet):
${JSON.stringify(itemList)}

THE STUDENT SAYS: "${message}"

Return the smallest set of changes that does what they asked, using only ids from the lists above.
- shift_course: move a course's items by "days" (one week later = 7, earlier = negative).
  Add "from_date" (YYYY-MM-DD) to shift only items due on or after that date.
- set_term_start: for a course with mode "week" whose whole schedule is off (for example a syllabus
  reused from a past semester), set "term_start" to the correct Monday of Week 1 (YYYY-MM-DD).
- update_item: change one item; include only the fields that change. Dates are YYYY-MM-DD, times HH:MM.
  To mark something finished (e.g. "completed in class", "already turned in"), set status "done".
  Use one update_item per item; you may return many.
- delete_item: remove one item.
- add_item: create an item; needs course_id, title, type and due_date.
Each change needs a short "description" a student would understand, for example
"Move Problem Set 4 to Fri, Oct 2" or "Mark Quiz 2 done".
If the request is unclear or matches nothing, return no changes and explain why in "summary".
Otherwise "summary" is one friendly sentence about what you'll do.`

  try {
    const result = await geminiJSON<{ summary: string; changes: AiChange[] }>([{ text: prompt }], schema)
    return NextResponse.json({ summary: result.summary, changes: result.changes ?? [] })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'AI request failed' }, { status: 500 })
  }
}