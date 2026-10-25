import { useSyncExternalStore } from 'react'

// shadcn's `use-mobile` breakpoint. Read with useSyncExternalStore, not an effect, so the first
// paint at 390 px already has the drawer, not the sidebar a frame later.
const MOBILE = '(max-width: 767px)'

function subscribe(changed: () => void): () => void {
  const query = globalThis.matchMedia(MOBILE)
  query.addEventListener('change', changed)
  return () => query.removeEventListener('change', changed)
}

/** Whether the screen is a phone's now, for a decision taken once, such as a route's redirect. */
export function isMobile(): boolean {
  return globalThis.matchMedia(MOBILE).matches
}

export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, isMobile)
}

// Under 22rem (a 200% zoom of a phone) a row of controls has no room for one more.
const NARROW = '(max-width: 351px)'

function subscribeNarrow(changed: () => void): () => void {
  const query = globalThis.matchMedia(NARROW)
  query.addEventListener('change', changed)
  return () => query.removeEventListener('change', changed)
}

export function useIsNarrow(): boolean {
  return useSyncExternalStore(subscribeNarrow, () => globalThis.matchMedia(NARROW).matches)
}
