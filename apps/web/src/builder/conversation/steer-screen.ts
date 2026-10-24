import type { Message } from '@conexus/hub-api'
import { useEffect } from 'react'
import type { Draft } from './draft.ts'
import type { Live, Step } from './live.ts'
import { STEER_RETURNED } from './text.ts'

/**
 * The saved messages without the person's the answer on screen told: Mastra saves a steer where it
 * reads it and the stream tells it there too, so it shows once, in the answer. With no answer on
 * screen the saved messages are all there is.
 */
export function withoutTold(
  state: Live,
  messages: readonly Message[],
  answering: boolean,
): readonly Message[] {
  if (state.kind === 'idle' || !answering) return messages
  const told = new Set(state.turn.messages.map((message) => message.id))
  return messages.filter((message) => message.role !== 'person' || !told.has(message.id))
}

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
