'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Course = { id: string; name: string }

export default function TestPage() {
  const supabase = createClient()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [courses, setCourses] = useState<Course[]>([])
  const [message, setMessage] = useState('Checking...')

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    setEmail(user.email ?? '')
    const { data, error } = await supabase
      .from('courses')
      .select('id, name')
      .order('created_at')
    if (error) setMessage('Error: ' + error.message)
    else {
      setCourses(data)
      setMessage('')
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function addTestCourse() {
    const { error } = await supabase
      .from('courses')
      .insert({ name: 'Test Course ' + (courses.length + 1) })
    if (error) setMessage('Error: ' + error.message)
    else load()
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <main className="p-8 space-y-4">
      <p>Logged in as: <strong>{email}</strong></p>
      <div className="flex gap-2">
        <button className="rounded bg-blue-600 px-3 py-2 text-white" onClick={addTestCourse}>
          Add test course
        </button>
        <button className="rounded border border-gray-600 px-3 py-2" onClick={signOut}>
          Sign out
        </button>
      </div>
      {message && <p className="text-red-400">{message}</p>}
      <ul className="list-disc pl-6">
        {courses.map((c) => (
          <li key={c.id}>{c.name}</li>
        ))}
      </ul>
    </main>
  )
}