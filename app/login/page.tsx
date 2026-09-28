'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handle(mode: 'signin' | 'signup') {
    setLoading(true)
    setMessage('')
    const { error } =
      mode === 'signin'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (error) return setMessage(error.message)
        router.push('/courses')
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">Syllabus Planner</h1>
                <input
          className="w-full rounded border border-gray-600 bg-transparent p-2"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full rounded border border-gray-600 bg-transparent p-2"
          type="password"
          placeholder="Password (6+ characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="flex gap-2">
          <button
            className="flex-1 rounded bg-blue-600 p-2 text-white disabled:opacity-50"
            disabled={loading}
            onClick={() => handle('signin')}
          >
            Sign in
          </button>
          <button
            className="flex-1 rounded border border-gray-600 p-2 disabled:opacity-50"
            disabled={loading}
            onClick={() => handle('signup')}
          >
            Sign up
          </button>
        </div>
        {message && <p className="text-sm text-red-400">{message}</p>}
      </div>
    </main>
  )
}