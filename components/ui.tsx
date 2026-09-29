import type {
  ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes,
  ReactNode, SelectHTMLAttributes,
} from 'react'
import { Check, Flag } from 'lucide-react'

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

/* ---------- BUTTON ---------- */
const buttonVariants = {
  primary: 'bg-primary text-on-primary font-bold hover:brightness-110',
  secondary: 'bg-surface text-text font-semibold border border-border hover:bg-chip',
  ghost: 'text-muted font-medium hover:text-text hover:bg-chip',
  danger: 'text-warm-text font-semibold hover:bg-warm-bg',
    destructive: 'bg-warm-text text-surface font-bold hover:brightness-110',
}
const buttonSizes = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-5 text-[15px]',
  icon: 'h-10 w-10',
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof buttonVariants
  size?: keyof typeof buttonSizes
}

export function Button({ variant = 'primary', size = 'md', className, ...props }: ButtonProps) {
  return (
    <button
      className={cx('inline-flex items-center justify-center gap-2 rounded-control transition',
        'disabled:opacity-50', buttonVariants[variant], buttonSizes[size], className)}
      {...props}
    />
  )
}

/* ---------- CARDS ---------- */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('rounded-card border border-border bg-surface p-5', className)} {...props} />
}

// A card whose rows are separated by thin lines (item lists)
export function ListCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx('divide-y divide-divider rounded-card border border-border bg-surface', className)}
      {...props} />
  )
}

/* ---------- INPUTS ---------- */
const field = cx('h-11 w-full rounded-control border border-border bg-surface px-3.5 text-[15px]',
  'text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/40')

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(field, className)} {...props} />
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cx(field, className)} {...props} />
}
/* ---------- TEXT ---------- */
export function PageHeader({ title, subtitle, action }: {
  title: ReactNode; subtitle?: ReactNode; action?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-4xl font-semibold leading-none tracking-tight md:text-[44px]">
          {title}
        </h1>
        {subtitle && <p className="text-[15px] text-muted md:text-base">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function SectionLabel({ children, count, tone = 'muted' }: {
  children: ReactNode; count?: ReactNode; tone?: 'muted' | 'warm' | 'soft'
}) {
  const color = { muted: 'text-muted', warm: 'text-warm-text', soft: 'text-soft-text' }[tone]
  return (
    <div className={cx('flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.08em]', color)}>
      {children}
      {count !== undefined && (
        <span className="font-semibold normal-case tracking-normal text-muted">{count}</span>
      )}
    </div>
  )
}

/* ---------- SMALL PIECES ---------- */
export function CourseDot({ color, size = 8 }: { color: string; size?: number }) {
  return <span className="shrink-0 rounded-full" style={{ background: color, width: size, height: size }} />
}

// Grade weight, e.g. "8%"
export function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="min-w-10 rounded-full bg-chip px-2 py-1 text-center text-xs font-semibold text-muted">
      {children}
    </span>
  )
}

export function PriorityBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span aria-label="High priority"
      className={cx('inline-flex items-center justify-center gap-1.5 rounded-full bg-warm-bg',
        'text-xs font-bold text-warm-text', compact ? 'h-6.5 w-6.5' : 'px-2.5 py-1')}>
      <Flag size={11} fill="currentColor" strokeWidth={0} />
      {!compact && 'High'}
    </span>
  )
}

// Round "mark complete" checkbox
export function CheckCircle({ done, onClick }: { done: boolean; onClick?: () => void }) {
  return (
    <button
      aria-label={done ? 'Mark not done' : 'Mark complete'}
      onClick={onClick}
      className={cx('flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full border-[1.5px] transition',
        done ? 'border-primary bg-primary text-on-primary' : 'border-faint hover:border-primary')}
    >
      {done && <Check size={12} strokeWidth={3.5} />}
    </button>
  )
}
/* ---------- FORM PIECES ---------- */
export function Field({ label, children, hint }: {
  label: string; children: ReactNode; hint?: string
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-semibold text-muted">{label}</span>
      {children}
      {hint && <span className="text-xs text-faint">{hint}</span>}
    </label>
  )
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cx('w-full rounded-control border border-border bg-surface px-3.5 py-2.5 text-[15px]',
        'text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/40', className)}
      {...props}
    />
  )
}

// Pill-style toggle between a few options
export function Segmented<T extends string>({ value, options, onChange }: {
  value: T; options: { value: T; label: string }[]; onChange: (v: T) => void
}) {
  return (
    <div className="flex gap-1 rounded-control bg-chip p-1">
      {options.map((o) => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)}
          className={cx('h-9 flex-1 rounded-[9px] text-sm font-semibold transition',
            value === o.value ? 'bg-surface text-text shadow-sm' : 'text-muted hover:text-text')}>
          {o.label}
        </button>
      ))}
    </div>
  )
}