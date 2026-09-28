'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TestPage() {
  const [result, setResult] = useState('Checking...')

  useEffect(() => {
    const supabase = createClient()
    supabase.from('courses').select('*').then(({ data, error }) => {
      if (error) setResult('Error: ' + error.message)
      else setResult('Connected! Rows visible: ' + data.length)
    })
  }, [])

  return <main className="p-8 text-lg">{result}</main>
}