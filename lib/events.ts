export const ITEMS_CHANGED = 'lily:items-changed'

export function notifyItemsChanged() {
  window.dispatchEvent(new Event(ITEMS_CHANGED))
}