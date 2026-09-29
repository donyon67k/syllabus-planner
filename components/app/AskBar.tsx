'use client'
import { useState } from 'react'
import { Check, MessageSquare } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { applyChanges, type AiChange } from '@/lib/aiChanges'
import type { PlannerItem } from '@/lib/usePlanner'

export default function AskBar({ items }: { items: PlannerItem[] }) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ summary: string; changes: AiChange[] } | null>(null)
  const [picked, setPicked] = useState<boolean[]>([])

  async function ask(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || busy) return
    setBusy(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/ai-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setResult(json)
      setPicked(json.changes.map(() => true))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    }
    setBusy(false)
  }

  async function apply() {
    if (!result) return
    setBusy(true)
    await applyChanges(result.changes.filter((_, i) => picked[i]), items)
    setBusy(false)
    setResult(null)
    setText('')
  }

  const count = picked.filter(Boolean).length

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={ask}
        className="flex h-13 items-center gap-3 rounded-[14px] border border-border bg-surface px-4.5 text-muted focus-within:ring-2 focus-within:ring-primary/40">
        <MessageSquare size={18} className="shrink-0" />
        <label htmlFor="ask-lily" className="sr-only">Tell Lily about a change</label>
        <input id="ask-lily" value={text} onChange={(e) => setText(e.target.value)} disabled={busy}
          placeholder="Tell Lily about a change — “Econ is running a week behind”"
          className="min-w-0 flex-1 bg-transparent text-[15px] text-text placeholder:text-muted focus:outline-none" />
        <button type="submit" disabled={busy || !text.trim()}
          className="shrink-0 rounded-md bg-chip px-2 py-1 text-xs font-semibold text-muted disabled:opacity-50">
          {busy ? 'Thinking…' : 'Enter'}
        </button>
      </form>

      {error && <p className="px-1 text-sm font-semibold text-warm-text">{error}</p>}

      {result && (
        <Card className="flex flex-col gap-4">
          <p className="text-[15px]">{result.summary}</p>
          {result.changes.length > 0 && (
            <ul className="flex flex-col divide-y divide-divider rounded-control border border-border">
              {result.changes.map((c, i) => (
                <li key={i}>
                  <label className="flex cursor-pointer items-center gap-3 px-4 py-3 text-sm">
                    <input type="checkbox" checked={picked[i]} className="h-4 w-4 accent-[var(--primary)]"
                      onChange={() => setPicked(picked.map((p, j) => (j === i ? !p : p)))} />
                    {c.description}
                  </label>
                </li>
              ))}
            </ul>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setResult(null)}>
              {result.changes.length ? 'Cancel' : 'Close'}
            </Button>
            {result.changes.length > 0 && (
              <Button onClick={apply} disabled={busy || count === 0}>
                <Check size={16} /> Apply {count} {count === 1 ? 'change' : 'changes'}
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}