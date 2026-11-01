import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { post } from '../../hub/identity/test-hub.ts'
import type { Reply, Sent } from '../../platform/test-anthropic.ts'
import {
  answeredOf,
  asked,
  conversing,
  endOf,
  holding,
  PARTIAL,
  sent,
  sessionUrl,
  title,
} from '../conversation/test-conversation.ts'
import { failuresOf } from '../conversation/test-parts.ts'
import { created, talking } from './test-assistant.ts'

/** Whether the call is the Assistant's: its fixed message opens its system. */
function isAssistant(call: Sent): boolean {
  return call.system.startsWith('You are the Conexus assistant.')
}

/**
 * A company with one model account whose Assistant answers what `next` holds (once, when `once`),
 * else `Pronto.`; the Builder always `Pronto.`.
 */
async function oneAccount(t: TestContext) {
  const next: { reply: Reply | undefined; once?: boolean } = { reply: undefined }
  const on = await conversing(t, (call) => {
    const titled = title(call)
    if (titled !== undefined) return titled
    if (!isAssistant(call)) return { kind: 'text', text: 'Pronto.' }
    const reply = next.reply ?? { kind: 'text', text: 'Pronto.' }
    if (next.once) next.reply = undefined
    return reply
  })
  const assistant = `/api/companies/${on.companyId}/assistant/conversations`
  const url = await created(on.hub, on.ana, assistant, { connections: [] })
  const conversation = await talking(t, on.hub, on.ana, url)
  /** The next turns start: the Assistant's in the same conversation, and the Builder's, each to its end. */
  async function bothStart(label: string) {
    assert.equal(endOf(await conversation.say('E agora?')), 'complete', label)
    const builder = await asked(t, { hub: on.hub, person: on.ana, conversations: on.conversations })
    assert.equal(endOf(builder.events), 'complete', label)
  }
  /** The question sent, without waiting for its turn: the test reads the stream itself. */
  async function ask(content: string) {
    const sentIt = await sent(on.hub, on.ana, url, content)
    assert.equal(sentIt.statusCode, 200, sentIt.body)
  }
  return { ...on, url, next, conversation, bothStart, ask }
}

test('a conta: um turno do Assistente e um do Builder da mesma pessoa correm juntos', async (t) => {
  const on = await oneAccount(t)
  const held = holding(t)
  on.next.reply = held.reply
  await on.ask('Uma pergunta longa')
  assert.equal(await on.conversation.stream.text(), PARTIAL)
  const builder = await asked(t, { hub: on.hub, person: on.ana, conversations: on.conversations })
  assert.equal(endOf(builder.events), 'complete')
  held.release()
  assert.equal(endOf(await on.conversation.stream.turn()), 'complete')
})

test('a conta: sem conta que responda, o turno do Assistente termina com a frase de hoje', async (t) => {
  const on = await oneAccount(t)
  on.next.reply = { kind: 'refuse', status: 401 }
  const events = await on.conversation.say('Quanto vendemos?')
  assert.equal(endOf(events), 'error')
  assert.deepEqual(failuresOf(events), ['MODEL_NO_ACCOUNT'])
})

test('o fim do turno solta a conta: depois de um turno que acaba, um que falha e um parado pela pessoa, o seguinte e um do Builder começam', async (t) => {
  const on = await oneAccount(t)
  assert.equal(endOf(await on.conversation.say('Oi')), 'complete')
  await on.bothStart('acabou')

  on.next.reply = { kind: 'refuse', status: 500 }
  assert.equal(endOf(await on.conversation.say('Falhe')), 'error')
  on.next.reply = undefined
  await on.bothStart('falhou')

  const held = holding(t)
  on.next.reply = held.reply
  await on.ask('Pare no meio')
  assert.equal(await on.conversation.stream.text(), PARTIAL)
  const stopped = await post(on.hub, on.ana, `${sessionUrl(on.url)}/abort`, {})
  assert.equal(stopped.statusCode, 200, stopped.body)
  assert.equal(endOf(await on.conversation.stream.turn()), 'aborted')
  on.next.reply = undefined
  held.release()
  await on.bothStart('parado')
})

test('a chamada sem argumentos: uma ferramenta guardada sem argumentos é refeita como {} e a conversa segue', async (t) => {
  const said = t.mock.method(console, 'error', () => undefined)
  const on = await oneAccount(t)
  on.next.once = true
  on.next.reply = {
    kind: 'blocks',
    blocks: [{ type: 'tool_use', name: 'conexus_overview', input: '{"cut' }],
  }
  const events = await on.conversation.say('Como está a empresa?')
  assert.deepEqual(failuresOf(events), [])
  assert.equal(endOf(await on.conversation.say('E agora?')), 'complete')
  assert.equal(said.mock.calls[0]?.arguments[0], 'Error converting tool call input to JSON')
  const replayed = on.anthropic.sent.filter((call) => call.stream && isAssistant(call)).at(-1)
  assert.deepEqual(replayed?.toolUses, [{ name: 'conexus_overview', input: {} }])
  const stored = (await answeredOf(on.hub, on.ana, on.url)).at(-1)
  assert.equal(stored?.role, 'builder')
})
