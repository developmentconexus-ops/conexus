import assert from 'node:assert/strict'
import { tmpdir } from 'node:os'
import { test } from 'node:test'
import { endOf } from '../conversation/test-conversation.ts'
import { created, talking } from './test-assistant.ts'
import { API_KEY_FILE, QUESTION, subscribed } from './test-real-model.ts'

const MESSAGES_URL = 'https://api.anthropic.com/v1/messages'

/**
 * The real API key path: Anthropic binds each thinking block to the tools list of the request that
 * made it, and the Assistant adds its typed Sankhya reads mid-turn, so without `drop_block` the next
 * request is refused with 400 on a new API-key account and the history keeps it broken. Three turns
 * on Claude Opus 5.5 at max, the first two reading the connection; every call must answer 200.
 */
test('o modelo de verdade pela chave de API: o pensamento preso a outra lista de ferramentas não derruba o turno nem a conversa seguinte', {
  timeout: 1_700_000,
}, async (t) => {
  if (API_KEY_FILE === undefined) {
    t.skip(
      'opt-in: set CONEXUS_EVAL_ANTHROPIC_API_KEY_FILE to a file that holds an Anthropic API key',
    )
    return
  }
  const statuses: number[] = []
  const real = globalThis.fetch
  globalThis.fetch = async (input, init) => {
    const response = await real(input, init)
    const target = String(input instanceof Request ? input.url : input)
    if (target.startsWith(MESSAGES_URL)) statuses.push(response.status)
    return response
  }
  t.after(() => {
    globalThis.fetch = real
  })
  const on = await subscribed(t, tmpdir(), 'key')
  const url = await created(on.hub, on.ana, on.assistant, { connections: [on.matriz] })
  const talk = await talking(t, on.hub, on.ana, url)
  const ends: (string | undefined)[] = []
  for (const text of [
    QUESTION,
    'E o que isso diz do vendedor que mais vendeu?',
    'Oi, resuma o que fizemos.',
  ])
    ends.push(endOf(await talk.say(text)))
  const refused = statuses.filter((status) => status !== 200)
  console.log(
    `calls ${statuses.length}, not 200: ${JSON.stringify(refused)}, turns: ${JSON.stringify(ends)}`,
  )
  assert.deepEqual(refused, [])
  assert.deepEqual(ends, ['complete', 'complete', 'complete'])
})
