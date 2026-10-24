import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Reply, Sent } from '../../platform/test-anthropic.ts'
import { asked, conversing, KEY, title } from './test-conversation.ts'
import { noticesOf } from './test-parts.ts'

const OTHER = 'sk-ant-conversation-key-0002'
const REFUSED: Reply = { kind: 'refuse', status: 400, cyber: true }

/** A turn's streamed calls answered by `reply`, in order; the title's call is plain text. */
function answering(reply: (streamed: number) => Reply) {
  let streamed = 0
  return (call: Sent): Reply => {
    const plain = title(call)
    if (plain !== undefined) return plain
    streamed += 1
    return reply(streamed)
  }
}

test('a recusa de cyber na trilha de erro é repetida uma vez com o aviso, na mesma conta, sem aviso à pessoa (14.2, 33)', async (t) => {
  const { hub, ana, conversations, anthropic, link } = await conversing(
    t,
    answering((n) => (n === 1 ? REFUSED : { kind: 'text', text: 'Pronto.' })),
  )
  await link('Time 2', OTHER)
  const { events } = await asked(t, { hub, person: ana, conversations })
  const streamed = anthropic.sent.filter((each) => each.stream)
  assert.deepEqual(
    streamed.map((each) => each.key),
    [KEY, KEY],
    'the same account took the repeat',
  )
  assert.ok(
    streamed[1]?.texts.some((text) => text.includes('continue')),
    'the repeat carries the nudge',
  )
  assert.deepEqual(noticesOf(events), [])
  assert.deepEqual(events.at(-1), { type: 'turnEnd', reason: 'complete' })
})

test('uma segunda recusa de cyber é do modelo: o turno acaba e a conta não gira (14.2, 33)', async (t) => {
  const { hub, ana, conversations, anthropic, link } = await conversing(
    t,
    answering(() => REFUSED),
  )
  await link('Time 2', OTHER)
  const { events } = await asked(t, { hub, person: ana, conversations })
  const keys = anthropic.sent.filter((each) => each.stream).map((each) => each.key)
  assert.deepEqual(keys, [KEY, KEY])
  assert.deepEqual(noticesOf(events), [])
  assert.notDeepEqual(events.at(-1), { type: 'turnEnd', reason: 'complete' })
})
