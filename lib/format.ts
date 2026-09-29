// "23:59:00" -> "11:59 PM"
export function formatTime(t: string | null) {
  if (!t) return null
  const [h, m] = t.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export const TYPE_LABEL: Record<string, string> = {
  assignment: 'Assignment', reading: 'Reading', exam: 'Exam',
  quiz: 'Quiz', project: 'Project', other: 'Other',
}