import { expect, test } from 'vitest'
import { OPENED, session } from './session-state.ts'
import { recordedRun } from './test-recorded.ts'
import { shownOf } from './transcript.tsx'

/** The turns of the screen, each with the cards it draws. */
function cardsByTurn(state: Parameters<typeof shownOf>[0]) {
  return shownOf(state).map((turn) => turn.items.filter((item) => item.kind === 'card').length)
}

// Defect (step 14.2 live check, D2): the approved plan's card drew again below the version line and
// went away on reload. Mastra tells the resumed run's result in a message of its own, and stores
// it inside the message that called; the read left the told one after the whole read, in the turn
// the person's steer opened.
test('o plano aprovado e uma mensagem escrita durante a obra: o cartão está uma vez só, ao vivo e relido', () => {
  const { events, read } = recordedRun('plan')
  let state = OPENED
  for (const event of events) state = session(state, { type: 'event', event })
  expect(cardsByTurn(state)).toEqual([1, 0])
  state = session(state, { type: 'loaded', messages: read })
  expect(cardsByTurn(state)).toEqual([1, 0])
  const reread = session(OPENED, { type: 'loaded', messages: read })
  expect(shownOf(state).map((turn) => turn.items.map((item) => item.kind))).toEqual(
    shownOf(reread).map((turn) => turn.items.map((item) => item.kind)),
  )
})
