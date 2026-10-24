import assert from 'node:assert/strict'
import { test } from 'node:test'
import { call, post } from '../../hub/identity/test-hub.ts'
import type { Reply } from '../../platform/test-anthropic.ts'
import { asked, conversing, KEY } from '../conversation/test-conversation.ts'
import { noticesOf } from '../conversation/test-parts.ts'
import { GROQ_MODEL } from './test-defaults.ts'

/** A reply that is `first` for the first `times` streamed calls, then text. */
function failingFirst(first: Reply, times: number) {
  let left = times
  return (stream: boolean): Reply => {
    if (!stream || left === 0) return { kind: 'text', text: 'Pronto.' }
    left -= 1
    return first
  }
}

test('conexão cortada duas vezes no meio da resposta: o Mastra repete na mesma conta antes de qualquer troca', async (t) => {
  const reply = failingFirst({ kind: 'reset' }, 2)
  const base = await conversing(t, (sent) => reply(sent.stream))
  const { hub, ana, companyId, conversations, anthropic } = base
  const other = 'sk-ant-retry-other-key-0001'
  const body = { owner: 'company', provider: 'anthropic', label: 'Dois', key: other }
  const linked = await post(hub, ana, `/api/companies/${companyId}/model-accounts`, body)
  assert.equal(linked.statusCode, 201)
  const { events } = await asked(t, { hub, person: ana, conversations })
  const streamed = anthropic.sent.filter((each) => each.stream).map((each) => each.key)
  assert.deepEqual(streamed, [KEY, KEY, KEY])
  assert.deepEqual(noticesOf(events), [])
  assert.deepEqual(events.at(-1), { type: 'turnEnd', reason: 'complete' })
})

test('MALFORMED_FUNCTION_CALL do Gemini (pelo CLIProxy, em Chat Completions): repete na mesma conta antes de qualquer troca', async (t) => {
  const groq = GROQ_MODEL
  const { hub, ana, companyId, conversations, anthropic } = await conversing(t, () => ({
    kind: 'text',
    text: 'Pronto.',
  }))
  const company = `/api/companies/${companyId}`
  const keys = ['gsk-malformed-key-0001', 'gsk-malformed-key-0002']
  for (const [index, key] of keys.entries()) {
    const body = { owner: 'company', provider: 'groq', label: `Groq ${index + 1}`, key }
    assert.equal((await post(hub, ana, `${company}/model-accounts`, body)).statusCode, 201)
  }
  const chosen = await call(hub, ana, 'PUT', `${company}/default-model`, {
    model: groq,
    effort: 'off',
  })
  assert.equal(chosen.statusCode, 200)
  const reply = failingFirst({ kind: 'malformed' }, 1)
  anthropic.chat = (sent) => reply(sent.stream)
  const { events } = await asked(t, { hub, person: ana, conversations })
  const streamed = anthropic.chats.filter((each) => each.stream).map((each) => each.bearer)
  assert.deepEqual(streamed, [keys[0], keys[0]])
  assert.deepEqual(noticesOf(events), [])
  assert.deepEqual(events.at(-1), { type: 'turnEnd', reason: 'complete' })
})
