import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

const MODEL = 'gemini-3.8-flash'
const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

// The exact JSON shape we want back
const schema = {
  type: 'OBJECT',
  properties: {
    items: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          title: { type: 'STRING' },
          type: {
            type: 'STRING',
            enum: ['assignment', 'reading', 'exam', 'quiz', 'project', 'other'],
          },
          week: { type: 'INTEGER' },
          weekday: { type: 'INTEGER' },
          due_date: { type: 'STRING' },
        },
        required: ['title', 'type'],
      },
    },
  },
  required: ['items'],
}
// Try up to 3 times if Google is busy (503) or rate-limiting (429)
async function callGemini(body: unknown) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY!,
      },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    if (res.ok) return { ok: true, json }
    const busy = res.status === 503 || res.status === 429
    if (!busy || attempt === 3) return { ok: false, json }
    await new Promise((r) => setTimeout(r, attempt * 4000)) // wait 4s, then 8s
  }
  throw new Error('unreachable')
}

export async function POST(req: Request) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })

  const form = await req.formData()
  const file = form.get('file') as File | null
  const mode = form.get('mode') === 'date' ? 'date' : 'week'
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })
  if (file.type !== 'application/pdf')
    return NextResponse.json({ error: 'PDF files only for now' }, { status: 400 })

  const pdf = Buffer.from(await file.arrayBuffer()).toString('base64')

  const rules = mode === 'week'
    ? `This course is organized BY WEEK. For every item set "week" (starting at 1)
and "weekday" (1=Mon ... 7=Sun). Do NOT set due_date. If the syllabus lists
calendar dates (possibly from an old semester), convert them: the week
containing the first class is Week 1.`
    : `This course is organized BY DATE. For every item set "due_date" as
YYYY-MM-DD. If no year is given, assume ${new Date().getFullYear()}.`

  const { ok, json } = await callGemini({
    contents: [{
      role: 'user',
      parts: [
        { inline_data: { mime_type: 'application/pdf', data: pdf } },
        { text: `Extract every graded item and required reading from this syllabus.\n${rules}` },
      ],
    }],
    generationConfig: { responseMimeType: 'application/json', responseSchema: schema },
  })

  if (!ok) {
    return NextResponse.json(
      { error: json.error?.message ?? 'Gemini request failed' },
      { status: 500 })
  }

  const parts = json.candidates?.[0]?.content?.parts ?? []
  const text = parts.map((p: { text?: string }) => p.text ?? '').join('')
  try {
    return NextResponse.json(JSON.parse(text || '{"items":[]}'))
  } catch {
    return NextResponse.json({ error: 'AI returned invalid JSON' }, { status: 500 })
  }
}