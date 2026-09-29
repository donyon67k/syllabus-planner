// Change the model in .env.local with GEMINI_MODEL=... (no code change needed)
const MODEL = process.env.GEMINI_MODEL ?? 'gemini-3.8-flash'

export async function geminiJSON<T>(parts: unknown[], schema: unknown): Promise<T> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`
  const body = {
    contents: [{ role: 'user', parts }],
    generationConfig: { responseMimeType: 'application/json', responseSchema: schema },
  }

  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY! },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    if (res.ok) {
      const text = (json.candidates?.[0]?.content?.parts ?? [])
        .map((p: { text?: string }) => p.text ?? '').join('')
      return JSON.parse(text) as T
    }
    const busy = res.status === 503 || res.status === 429
    if (!busy || attempt === 3) throw new Error(json.error?.message ?? 'Gemini request failed')
    await new Promise((r) => setTimeout(r, attempt * 4000)) // wait 4s, then 8s
  }
  throw new Error('unreachable')
}