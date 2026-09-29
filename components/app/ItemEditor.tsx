'use client'
import { createContext, useCallback, useContext, useState } from 'react'
import { Plus } from 'lucide-react'
import Sheet from './Sheet'
import ItemForm from './ItemForm'
import type { Item } from '@/lib/types'

type EditorState = { open: boolean; item: Item | null; courseId?: string }
const EditorContext = createContext<{ openItem: (item?: Item | null, courseId?: string) => void }>({
  openItem: () => {},
})

export const useItemEditor = () => useContext(EditorContext)

export function ItemEditorProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<EditorState>({ open: false, item: null })
  const openItem = useCallback(
    (item?: Item | null, courseId?: string) => setState({ open: true, item: item ?? null, courseId }), [])
  const close = useCallback(() => setState((s) => ({ ...s, open: false })), [])

  return (
    <EditorContext.Provider value={{ openItem }}>
      {children}
      <Sheet open={state.open} onClose={close} title={state.item ? 'Edit item' : 'New item'}>
        {state.open && (
          <ItemForm key={state.item?.id ?? 'new'} item={state.item}
            defaultCourseId={state.courseId} onDone={close} />
        )}
      </Sheet>
    </EditorContext.Provider>
  )
}

// Floating "+" on phones
export function NewItemFab() {
  const { openItem } = useItemEditor()
  return (
    <button aria-label="New item" onClick={() => openItem()}
      className="fixed bottom-7 right-5 z-30 flex h-14.5 w-14.5 items-center justify-center rounded-[18px] bg-primary text-on-primary shadow-lg md:hidden">
      <Plus size={22} strokeWidth={2.5} />
    </button>
  )
}