'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SettingsPage() {
  const supabase = createClient()
  const router = useRouter()
  const [userId, setUserId] = useState('')
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')
      setUserId(user.id)
      const { data } = await supabase
        .from('user_settings').select('canvas_feed_url').maybeSingle()
      setUrl(data?.canvas_feed_url ?? '')
    })()
  }, [])

  async function save() {
    const { error } = await supabase
      .from('user_settings').upsert({ user_id: userId, canvas_feed_url: url.trim() })
    setStatus(error ? 'Error: ' + error.message : 'Saved!')
  }

  async function sync() {
    setBusy(true)
    setStatus('Syncing with Canvas…')
    const res = await fetch('/api/canvas-sync', { method: 'POST' })
    const json = await res.json()
    setBusy(false)
    if (!res.ok) return setStatus('Error: ' + json.error)
    let msg = `Synced ${json.synced} assignments.`
    if (json.unmatched.length)
      msg += ` Not matched to any course: ${json.unmatched.join(' · ')}`
    setStatus(msg)
  }
    const input = 'w-full rounded border border-gray-600 bg-transparent p-2'

  return (
    <main className="mx-auto max-w-xl space-y-6 p-6">
      <Link href="/week" className="text-sm text-gray-400">← This week</Link>
      <h1 className="text-2xl font-semibold">Settings</h1>

      <section className="space-y-3 rounded-lg border border-gray-700 p-4">
        <h2 className="text-lg font-semibold">Canvas</h2>
        <p className="text-sm text-gray-400">
          In Canvas: Calendar → Calendar Feed (bottom right) → copy the link.
        </p>
        <input className={input} placeholder="https://canvas.nd.edu/feeds/calendars/..."
          value={url} onChange={(e) => setUrl(e.target.value)} />
        <div className="flex gap-2">
          <button onClick={save} className="rounded border border-gray-600 px-3 py-2">
            Save link
          </button>
          <button onClick={sync} disabled={busy}
            className="flex-1 rounded bg-blue-600 px-3 py-2 text-white disabled:opacity-50">
            {busy ? 'Syncing…' : 'Sync now'}
          </button>
        </div>
        {status && <p className="text-sm text-gray-400">{status}</p>}
        <p className="text-xs text-gray-500">
          Assignments are matched by course code, so make sure each course&apos;s
          code (e.g. POLS 30101) matches what Canvas shows.
        </p>
      </section>
    </main>
  )
}