'use client'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import Sidebar from './Sidebar'
import { APP_NAME } from '@/design/brand'
import { ItemEditorProvider, NewItemFab } from './ItemEditor'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <ItemEditorProvider>
    <div className="flex min-h-screen bg-bg text-text">
      {/* Desktop sidebar */}
      <aside className="hidden w-66 shrink-0 border-r border-border bg-sidebar md:block">
        <div className="sticky top-0 h-screen">
          <Sidebar />
        </div>
      </aside>

      {/* Phone drawer */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button aria-label="Close menu" onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40" />
          <aside className="relative h-full w-72 bg-sidebar">
            <button aria-label="Close menu" onClick={() => setOpen(false)}
              className="absolute right-3 top-6 flex h-10 w-10 items-center justify-center text-muted">
              <X size={20} />
            </button>
            <Sidebar onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Phone header */}
        <header className="flex h-14 items-center justify-between px-3 md:hidden">
          <button aria-label="Open menu" onClick={() => setOpen(true)}
            className="flex h-11 w-11 items-center justify-center">
            <Menu size={22} />
          </button>
          <span className="font-display text-lg font-semibold">{APP_NAME}</span>
          <span className="w-11" />
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-24 pt-4 md:px-14 md:pt-11">
          {children}
                </main>
      </div>
    </div>
      <NewItemFab />
    </ItemEditorProvider>
  )
}