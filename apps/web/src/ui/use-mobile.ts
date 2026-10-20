import { useSyncExternalStore } from 'react'

// shadcn's `use-mobile` breakpoint. Read with useSyncExternalStore, not an effect, so the first
// paint at 390 px already has the drawer, not the sidebar a frame later.
const MOBILE = '(max-width: 767px)'

function subscribe(changed: () => void): () => void {
  const query = globalThis.matchMedia(MOBILE)
  query.addEventListener('change', changed)
  return () => query.removeEventListener('change', changed)
}

export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, () => globalThis.matchMedia(MOBILE).matches)
}
