import type { RefObject } from 'react'
import { createContext, useCallback, useRef } from 'react'
import type { PanelImperativeHandle } from 'react-resizable-panels'
import { usePanelRef } from 'react-resizable-panels'

/**
 * The share of the page the test panel takes while a file of the agent's Computador is open beside
 * the conversation (step 24.4): the panel's own maximum, the most the page's 40% minimum allows. At
 * 1366 px that leaves the conversation over its 320 px minimum and the file over its 280 px one.
 */
const TEST_WITH_FILE = 60

/** What the room tells the page: a file opened (`true`) or closed (`false`) beside the conversation. */
export const FileWidth = createContext<(open: boolean) => void>(() => undefined)

/**
 * The test panel's native handle and the widening around it: opening a file widens the panel only
 * when it is narrower than that, and closing returns it to the width it had before, so a width the
 * person dragged to is respected.
 */
export function useFileWidth(): {
  panel: RefObject<PanelImperativeHandle | null>
  widen: (open: boolean) => void
} {
  const panel = usePanelRef()
  const before = useRef<number>(undefined)
  const widen = useCallback(
    (open: boolean) => {
      const handle = panel.current
      if (handle === null) return
      if (open) {
        const { inPixels, asPercentage } = handle.getSize()
        if (asPercentage >= TEST_WITH_FILE - 0.5) return
        before.current = inPixels
        handle.resize(`${TEST_WITH_FILE}%`)
      } else if (before.current !== undefined) {
        handle.resize(before.current)
        before.current = undefined
      }
    },
    [panel],
  )
  return { panel, widen }
}
