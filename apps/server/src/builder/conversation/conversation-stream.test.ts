import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import type { ConversationEvent } from '@conexus/hub-api'
import { CONVERSATION_HEARTBEAT_MS, streamConversation } from '@conexus/hub-api'
import { call, post } from '../../hub/identity/test-hub.ts'
import type { Reply, Sent } from '../../platform/test-anthropic.ts'
import { conversing, hubBeside, sent, started, streamOf } from './test-conversation.ts'

const PARTIAL = 'Começo da resposta'

/**
 * A provider answer that sends `PARTIAL` and then holds until released; released at the test's
 * end at the latest, before the Hub drains its turns. Call it before `conversing`.
 */
function holding(t: TestContext) {
  const hold = Promise.withResolvers<void>()
  t.after(() => hold.resolve())
  const reply: Reply = { kind: 'hold', until: hold.promise, text: PARTIAL }
  return { reply, release: () => hold.resolve() }
}

function title(asked: Sent): Reply | undefined {
  return asked.stream ? undefined : { kind: 'text', text: 'Título' }
}

function rolesAndParts(read: { json(): unknown }) {
  const { messages } = Object(read.json()).conversation
  return messages.map((message: { role: string; parts: unknown[] }) => [
    message.role,
    message.parts,
  ])
}

/** The conversation's messages once they are `count`, read again for at most five seconds. */
async function readOnce(read: () => Promise<{ json(): unknown }>, count: number) {
  for (let attempt = 0; ; attempt += 1) {
    const messages = rolesAndParts(await read())
    if (messages.length >= count || attempt === 50) return messages
    await new Promise((done) => setTimeout(done, 100))
  }
}

async function settles(promise: Promise<unknown>): Promise<boolean> {
  let settled = false
  promise.then(
    () => (settled = true),
    () => (settled = true),
  )
  for (let round = 0; round < 20; round += 1) await new Promise((done) => setImmediate(done))
  return settled
}

test('o stream diz que está vivo de 25 em 25 segundos, e o primeiro sinal vem antes de qualquer evento', async (t) => {
  const { hub, ana, conversations } = await conversing(t, () => ({ kind: 'text', text: 'ok' }))
  assert.equal(CONVERSATION_HEARTBEAT_MS, 25_000)
  assert.equal(streamConversation.success.heartbeatMs, CONVERSATION_HEARTBEAT_MS)
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  t.mock.timers.enable({ apis: ['setInterval'] })
  const stream = await streamOf(hub, ana, url)
  t.after(() => stream.close())
  await stream.until(() => stream.seen.comments === 1)
  assert.equal(stream.seen.raw, ': \n\n')
  t.mock.timers.tick(CONVERSATION_HEARTBEAT_MS - 1)
  assert.equal(await settles(stream.until(() => stream.seen.comments > 1)), false)
  t.mock.timers.tick(1)
  await stream.until(() => stream.seen.comments === 2)
  t.mock.timers.reset()
})

test('reconectar no meio de um turno: primeiro a resposta até ali, depois o resto', async (t) => {
  const held = holding(t)
  const { hub, ana, conversations } = await conversing(t, (asked) => title(asked) ?? held.reply)
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const first = await streamOf(hub, ana, url)
  t.after(() => first.close())
  assert.equal((await sent(hub, ana, url, 'Uma pergunta')).statusCode, 202)
  assert.deepEqual(await first.next(), { type: 'text', delta: PARTIAL })
  first.close()
  const again = await streamOf(hub, ana, url)
  t.after(() => again.close())
  const snapshot = await again.next()
  assert.equal(snapshot.type, 'turn')
  assert.ok(snapshot.type === 'turn')
  assert.equal(snapshot.message.role, 'builder')
  assert.deepEqual(snapshot.message.parts, [{ type: 'text', text: PARTIAL }])
  assert.deepEqual(rolesAndParts(await call(hub, ana, 'GET', url)), [
    ['person', [{ type: 'text', text: 'Uma pergunta' }]],
  ])
  held.release()
  const rest = await again.turn()
  assert.deepEqual(rest.at(-1), { type: 'turnEnd', reason: 'complete' })
  assert.equal(
    rest.some((event) => event.type === 'text'),
    false,
  )
})

test('Parar: o turno termina `aborted` e o texto até ali fica na conversa', async (t) => {
  const held = holding(t)
  const { hub, ana, conversations } = await conversing(t, (asked) => title(asked) ?? held.reply)
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const stream = await streamOf(hub, ana, url)
  t.after(() => stream.close())
  assert.equal((await sent(hub, ana, url, 'Uma pergunta')).statusCode, 202)
  assert.deepEqual(await stream.next(), { type: 'text', delta: PARTIAL })
  const stopped = await post(hub, ana, `${url}/stop`, {})
  assert.equal(stopped.statusCode, 204)
  assert.deepEqual((await stream.turn()).at(-1), { type: 'turnEnd', reason: 'aborted' })
  // Mastra saves the stopped answer just after its `agent_end`, so a read may come before it.
  assert.deepEqual(await readOnce(() => call(hub, ana, 'GET', url), 2), [
    ['person', [{ type: 'text', text: 'Uma pergunta' }]],
    ['builder', [{ type: 'text', text: PARTIAL }]],
  ])
})

test('desligar espera o turno em curso, guarda o texto e só então fecha o stream', async (t) => {
  const held = holding(t)
  const { hub, ana, conversations } = await conversing(t, (asked) => title(asked) ?? held.reply)
  const closing = await hubBeside(t, hub)
  const url = `${conversations}/${await started(closing, ana, conversations)}`
  const stream = await streamOf(closing, ana, url)
  t.after(() => stream.close())
  assert.equal((await sent(closing, ana, url, 'Uma pergunta')).statusCode, 202)
  assert.deepEqual(await stream.next(), { type: 'text', delta: PARTIAL })
  const closed = closing.close()
  assert.equal(await settles(closed), false, 'the close waits for the turn')
  assert.equal(stream.seen.ended, false)
  held.release()
  await closed
  assert.deepEqual((await stream.turn()).at(-1), { type: 'turnEnd', reason: 'complete' })
  assert.equal(await stream.ended(), true)
  assert.deepEqual(rolesAndParts(await call(hub, ana, 'GET', url)), [
    ['person', [{ type: 'text', text: 'Uma pergunta' }]],
    ['builder', [{ type: 'text', text: PARTIAL }]],
  ])
})

test('o processo para no meio de um turno: a pergunta não se perde, e aparece uma vez só depois', async (t) => {
  const held = holding(t)
  const { hub, ana, conversations } = await conversing(t, (asked) => title(asked) ?? held.reply)
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const stream = await streamOf(hub, ana, url)
  t.after(() => stream.close())
  assert.equal((await sent(hub, ana, url, 'Uma pergunta que não pode sumir')).statusCode, 202)
  assert.deepEqual(await stream.next(), { type: 'text', delta: PARTIAL })
  const other = await hubBeside(t, hub)
  const asked = [['person', [{ type: 'text', text: 'Uma pergunta que não pode sumir' }]]]
  assert.deepEqual(rolesAndParts(await call(other, ana, 'GET', url)), asked)
  held.release()
  assert.deepEqual((await stream.turn()).at(-1), { type: 'turnEnd', reason: 'complete' })
  assert.deepEqual(rolesAndParts(await call(other, ana, 'GET', url)), [
    ...asked,
    ['builder', [{ type: 'text', text: PARTIAL }]],
  ])
})

test('uma pessoa com duas conversas ao mesmo tempo: sessões separadas, eventos sem mistura', async (t) => {
  const held = holding(t)
  const { hub, ana, conversations } = await conversing(
    t,
    (asked) =>
      title(asked) ??
      (asked.texts.includes('Pergunta X') ? held.reply : { kind: 'text', text: 'Resposta Y' }),
  )
  const x = `${conversations}/${await started(hub, ana, conversations)}`
  const y = `${conversations}/${await started(hub, ana, conversations)}`
  const onX = await streamOf(hub, ana, x)
  t.after(() => onX.close())
  const onY = await streamOf(hub, ana, y)
  t.after(() => onY.close())
  assert.equal((await sent(hub, ana, x, 'Pergunta X')).statusCode, 202)
  assert.deepEqual(await onX.next(), { type: 'text', delta: PARTIAL })
  assert.equal((await sent(hub, ana, y, 'Pergunta Y')).statusCode, 202)
  const ofY = await onY.turn()
  assert.deepEqual(textsOf(ofY), ['Resposta Y'])
  assert.deepEqual(ofY.at(-1), { type: 'turnEnd', reason: 'complete' })
  held.release()
  const ofX = await onX.turn()
  assert.deepEqual(textsOf(ofX), [])
  assert.deepEqual(ofX.at(-1), { type: 'turnEnd', reason: 'complete' })
  assert.doesNotMatch(onX.seen.raw, /Resposta Y/)
  assert.doesNotMatch(onY.seen.raw, new RegExp(PARTIAL))
})

function textsOf(events: ConversationEvent[]): string[] {
  return events.flatMap((event) => (event.type === 'text' ? [event.delta] : []))
}
