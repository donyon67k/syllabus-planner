export type Course = {
  id: string
  name: string
  code: string | null
  color: string
  schedule_mode: 'week' | 'date'
  term_start: string | null
  meeting_days: number[] | null
}