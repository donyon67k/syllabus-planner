'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, RefreshCw, RotateCcw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { notifyCoursesChanged, notifyItemsChanged } from '@/lib/events'
import { toISO } from '@/lib/dates'
import { Button, Card, Field, Input, PageHeader, SectionLabel } from '@/components/ui'

export default function SettingsPage() {
  const supabase = createClient()
  const router = useRouter()
  const [userId, setUserId] = useState('')
  const [email, setEmail] = useState('')
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [semesterNote, setSemesterNote] = useState('')

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')
      setUserId(user.id)
      setEmail(user.email ?? '')
      const { data } = await supabase.from('user_settings').select('canvas_feed_url').maybeSingle()
      setUrl(data?.canvas_feed_url ?? '')
    })()
  }, [])

  async function save() {
    const { error } = await supabase
      .from('user_settings').upsert({ user_id: userId, canvas_feed_url: url.trim() })
    setStatus(error ? 'Error: ' + error.message : 'Link saved.')
  }

  async function sync() {
    setBusy(true)
    setStatus('Syncing with Canvas…')
    const res = await fetch('/api/canvas-sync', { method: 'POST' })
    const json = await res.json()
    setBusy(false)
    if (!res.ok) return setStatus('Error: ' + json.error)
    let msg = `Synced ${json.synced} assignments.`
    if (json.created?.length) msg += ` Created courses: ${json.created.join(', ')}.`
    if (json.unmatched?.length) msg += ` Not matched: ${json.unmatched.join(' · ')}`
    setStatus(msg)
    notifyCoursesChanged()
    notifyItemsChanged()
  }

  async function newSemester() {
    setClearing(true)
    await supabase.from('items').delete().eq('user_id', userId)
    const { error } = await supabase.from('courses').delete().eq('user_id', userId)
    await supabase.from('user_settings').upsert({
      user_id: userId,
      canvas_feed_url: url.trim() || null,
      semester_start: toISO(new Date()),
    })
    setClearing(false)
    setConfirming(false)
    setSemesterNote(error ? 'Error: ' + error.message : 'All clear. Your new semester starts today.')
    notifyCoursesChanged()
    notifyItemsChanged()
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex max-w-2xl flex-col gap-7">
      <PageHeader title="Settings" />

      <Card className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <SectionLabel>Canvas</SectionLabel>
          <p className="text-sm text-muted">
            In Canvas, open Calendar → Calendar Feed (bottom right) and paste the link here.
            Lily pulls in your assignments and creates courses automatically.
          </p>
        </div>
        <Field label="Calendar feed link">
          <Input value={url} onChange={(e) => setUrl(e.target.value)}
            placeholder="https://canvas.nd.edu/feeds/calendars/…" />
        </Field>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={save}>Save link</Button>
          <Button onClick={sync} disabled={busy}>
            <RefreshCw size={16} className={busy ? 'animate-spin' : ''} />
            {busy ? 'Syncing…' : 'Sync now'}
          </Button>
        </div>
        {status && <p className="text-sm text-muted">{status}</p>}
      </Card>

      <Card className="flex flex-col gap-4">
        <SectionLabel tone="warm">New semester</SectionLabel>
        {!confirming ? (
          <div className="flex flex-col items-start gap-2.5">
            <Button variant="secondary" onClick={() => setConfirming(true)}>
              <RotateCcw size={16} /> New semester
            </Button>
            <p className="text-sm text-muted">
              Clears every course and assignment so you can start the next term with a blank planner.
              Your account and Canvas link stay, and from now on Canvas sync only brings in assignments
              due today or later, so last semester won&apos;t come back. This can&apos;t be undone.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 rounded-control bg-warm-bg p-4">
            <p className="text-sm font-semibold text-warm-text">
              Delete all of your courses and assignments? This can&apos;t be undone.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => setConfirming(false)}>Cancel</Button>
              <Button variant="destructive" onClick={newSemester} disabled={clearing}>
                {clearing ? 'Clearing…' : 'Yes, start a new semester'}
              </Button>
            </div>
          </div>
        )}
        {semesterNote && <p className="text-sm text-muted">{semesterNote}</p>}
      </Card>

      <Card className="flex flex-col gap-4">
        <SectionLabel>Account</SectionLabel>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[15px] font-semibold">{email}</p>
            <p className="text-sm text-muted">Signed in</p>
          </div>
          <Button variant="secondary" onClick={signOut}>
            <LogOut size={16} /> Sign out
          </Button>
        </div>
      </Card>

      <Card className="flex flex-col gap-2">
        <SectionLabel>Appearance</SectionLabel>
        <p className="text-sm text-muted">Lily follows your device&apos;s light or dark mode.</p>
      </Card>
    </div>
  )
}