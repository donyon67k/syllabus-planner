export type Course = {
  id: string
  name: string
  code: string | null
  color: string
  schedule_mode: 'week' | 'date'
  term_start: string | null
  meeting_days: number[] | null
}
export type Item = {
  id: string
  course_id: string
  title: string
  type: 'assignment' | 'reading' | 'exam' | 'quiz' | 'project' | 'other'
  week: number | null
  weekday: number | null
  due_date: string | null
  due_time: string | null
  status: 'todo' | 'done'
  source: string
  notes: string | null
}