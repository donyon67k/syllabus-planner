'use client'
import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Sheet({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/40" />
      <div role="dialog" aria-modal="true" aria-label={title}
        className="relative max-h-[90vh] w-full overflow-y-auto rounded-t-card bg-surface p-6 shadow-xl md:max-w-lg md:rounded-card">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold tracking-tight">{title}</h2>
          <button aria-label="Close" onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-control text-muted hover:bg-chip">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}