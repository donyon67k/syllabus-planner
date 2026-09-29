export const ITEMS_CHANGED = 'lily:items-changed'
export const COURSES_CHANGED = 'lily:courses-changed'

export function notifyItemsChanged() {
  window.dispatchEvent(new Event(ITEMS_CHANGED))
}

export function notifyCoursesChanged() {
  window.dispatchEvent(new Event(COURSES_CHANGED))
}