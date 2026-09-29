'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { APP_NAME } from '@/design/brand'
import LilyPad from '@/components/app/Logo'
import { Button, Field, Input } from '@/components/ui'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    const { error } =
      mode === 'signin'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (error) return setMessage(error.message)
    router.push('/today')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg p-6 text-text">
      <form onSubmit={submit} className="flex w-full max-w-sm flex-col gap-5">
        <div className="flex flex-col items-center gap-3 pb-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-primary text-on-primary">
            <LilyPad size={28} />
          </div>
          <h1 className="font-display text-4xl font-semibold tracking-tight">{APP_NAME}</h1>
          <p className="text-muted">Your courses, organized.</p>
        </div>

        <Field label="Email">
          <Input type="email" autoComplete="email" value={email}
            onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label="Password">
          <Input type="password" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        </Field>

        {message && <p className="text-sm font-semibold text-warm-text">{message}</p>}

        <Button type="submit" disabled={loading}>
          {loading ? 'One moment…' : mode === 'signin' ? 'Sign in' : 'Create account'}
        </Button>
        <button type="button" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          className="text-sm font-semibold text-muted hover:text-text">
          {mode === 'signin' ? 'New here? Create an account' : 'Have an account? Sign in'}
        </button>
      </form>
    </main>
  )
}