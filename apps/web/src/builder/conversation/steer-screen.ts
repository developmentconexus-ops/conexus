import { useEffect } from 'react'
import type { Draft } from './draft.ts'
import { STEER_RETURNED } from './text.ts'
import type { Live, Step } from './timeline.ts'

/**
 * The steers the Builder did not read when the turn ended go back in the field, once, with the
 * line that says so. A steer whose send has not settled still sits in the field: it is not put
 * there twice.
 */
export function useReturnedSteers(
  state: Live,
  draft: Draft,
  say: (line: string) => void,
  dispatch: (step: Step) => void,
) {
  const returned = state.kind === 'ended' ? state.returned : []
  useEffect(() => {
    if (returned.length === 0) return
    const back = returned.filter((each) => each !== draft.text).join('\n\n')
    if (back !== '') draft.change(draft.text.trim() === '' ? back : `${back}\n\n${draft.text}`)
    say(STEER_RETURNED)
    dispatch({ type: 'returnedShown' })
  }, [returned, draft, say, dispatch])
}
