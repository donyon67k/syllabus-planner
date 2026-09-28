import { GoogleGenAI, Type } from '@google/genai'
import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

// The exact JSON shape we want back
const schema = {
  type: Type.OBJECT,
  properties: {
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          type: {
            type: Type.STRING,
            enum: ['assignment', 'reading', 'exam', 'quiz', 'project', 'other'],
          },
          week: { type: Type.INTEGER },
          weekday: { type: Type.INTEGER },
          due_date: { type: Type.STRING },
        },
        required: ['title', 'type'],
      },
    },
  },
  required: ['items'],
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
  if (file.size > 10 * 1024 * 1024)
    return NextResponse.json({ error: 'File is over 10 MB' }, { status: 400 })

  const pdf = Buffer.from(await file.arrayBuffer()).toString('base64')

  const rules = mode === 'week'
    ? `This course is organized BY WEEK. For every item set "week" (starting at 1)
and "weekday" (1=Mon ... 7=Sun). Do NOT set due_date. If the syllabus lists
calendar dates (possibly from an old semester), convert them: the week
containing the first class is Week 1.`
    : `This course is organized BY DATE. For every item set "due_date" as
YYYY-MM-DD. If no year is given, assume ${new Date().getFullYear()}.`

  try {
    const res = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: [{
        role: 'user',
        parts: [
          { inlineData: { mimeType: 'application/pdf', data: pdf } },
          { text: `Extract every graded item and required reading from this syllabus.\n${rules}` },
        ],
      }],
      config: { responseMimeType: 'application/json', responseSchema: schema },
    })
    return NextResponse.json(JSON.parse(res.text ?? '{"items":[]}'))
  } catch (e) {
    const message = e instanceof Error ? e.message : 'AI request failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}