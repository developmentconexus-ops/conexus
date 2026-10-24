import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import type { ConversationEvent } from '@conexus/hub-api'
import type {
  AgentSignalInput as Signal,
  SendAgentSignalOptions as Target,
} from '@mastra/core/agent'
import { Agent } from '@mastra/core/agent'
import { call, post } from '../../hub/identity/test-hub.ts'
import {
  conversing,
  holding,
  hubBeside,
  PARTIAL,
  sent,
  started,
  streamOf,
  title,
} from './test-conversation.ts'
import { failuresOf } from './test-parts.ts'

/** Whether `promise` settles within `ms`. */
async function within(promise: Promise<unknown>, ms: number): Promise<'settled' | 'hung'> {
  const late = new Promise<'hung'>((done) => setTimeout(() => done('hung'), ms).unref())
  return Promise.race([promise.then(() => 'settled' as const), late])
}

function inProgressOf(read: { json(): unknown }): unknown {
  const body = read.json()
  assert.ok(typeof body === 'object' && body !== null && 'conversation' in body)
  const { conversation } = body
  assert.ok(typeof conversation === 'object' && conversation !== null)
  return 'inProgress' in conversation ? conversation.inProgress : undefined
}

test('o Mastra não consegue guardar a resposta no fim do turno: o turno termina, e desligar não espera para sempre', async (t) => {
  const held = holding(t)
  const { hub, ana, conversations } = await conversing(t, (asked) => title(asked) ?? held.reply)
  const closing = await hubBeside(t, hub)
  const url = `${conversations}/${await started(closing, ana, conversations)}`
  const stream = await streamOf(closing, ana, url)
  t.after(() => stream.close())
  assert.equal((await sent(closing, ana, url, 'Uma pergunta')).statusCode, 202)
  assert.equal(await stream.text(), PARTIAL)
  const pool = hub.test.mastraPool
  await pool.query('alter table mastra.mastra_messages rename to mastra_messages_out')
  held.release()
  assert.equal(await within(stream.turn(), 10_000), 'settled', 'the turn ends')
  await pool.query('alter table mastra.mastra_messages_out rename to mastra_messages')
  assert.equal(await within(closing.close(), 10_000), 'settled', 'the close does not hang')
})

test('a linha cai e o turno acaba sem ela: a leitura diz que nenhum turno está em curso, para a tela sair de "trabalhando"', async (t) => {
  const held = holding(t)
  const { hub, ana, conversations } = await conversing(t, (asked) => title(asked) ?? held.reply)
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const first = await streamOf(hub, ana, url)
  t.after(() => first.close())
  assert.equal((await sent(hub, ana, url, 'Uma pergunta')).statusCode, 202)
  assert.equal(await first.text(), PARTIAL)
  assert.equal(inProgressOf(await call(hub, ana, 'GET', url)), true)
  first.close()
  held.release()
  for (let attempt = 0; inProgressOf(await call(hub, ana, 'GET', url)) !== false; attempt += 1) {
    assert.ok(attempt < 50, 'the read says the turn is over')
    await new Promise((done) => setTimeout(done, 100))
  }
})

/** The next message's acceptance waits for `release`. */
function gatedAcceptance(t: TestContext) {
  const gate = Promise.withResolvers<void>()
  t.after(() => gate.resolve())
  const signalled = Promise.withResolvers<void>()
  const send = Agent.prototype.sendSignal
  const mocked = t.mock.method(Agent.prototype, 'sendSignal', send)
  mocked.mock.mockImplementationOnce(function <O>(this: Agent, signal: Signal, target: Target<O>) {
    const result = (send<O>).call(this, signal, target)
    signalled.resolve()
    const accepted: typeof result.accepted = gate.promise.then(() => result.accepted)
    return { ...result, accepted }
  })
  return { signalled: signalled.promise, release: () => gate.resolve() }
}

/** A conversation with its stream open, and the turn of one message sent on it. */
async function askedOnce(t: TestContext, answer: Parameters<typeof conversing>[1]) {
  const { hub, ana, conversations } = await conversing(t, answer)
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const stream = await streamOf(hub, ana, url)
  t.after(() => stream.close())
  assert.equal((await sent(hub, ana, url, 'Uma pergunta')).statusCode, 202)
  return { hub, ana, url, stream }
}

/** How the turn ends, said once, within 10 s; `hung` when it does not end. */
async function endOf(stream: Awaited<ReturnType<typeof streamOf>>) {
  async function ended() {
    const events = await stream.turn()
    await new Promise((done) => setTimeout(done, 300))
    const later: ConversationEvent[] = []
    while (stream.seen.ids.length > events.length + later.length) later.push(await stream.next())
    const ends = [...events, ...later].flatMap((event) =>
      event.type === 'turnEnd' ? [event.reason] : [],
    )
    return { ends, failures: failuresOf(events) }
  }
  const late = new Promise<'hung'>((done) => setTimeout(() => done('hung'), 10_000).unref())
  return Promise.race([ended(), late])
}

test('o Mastra recusa a mensagem ao aceitá-la: o turno termina com erro, uma vez', async (t) => {
  const send = Agent.prototype.sendSignal
  const mocked = t.mock.method(Agent.prototype, 'sendSignal', send)
  mocked.mock.mockImplementationOnce(() => {
    throw new Error('no route')
  })
  const { stream } = await askedOnce(t, (asked) => title(asked) ?? { kind: 'text', text: 'Oi.' })
  assert.deepEqual(await endOf(stream), { ends: ['error'], failures: ['INTERNAL_UNEXPECTED'] })
})

test('Parar enquanto o Mastra aceita a mensagem: o turno termina parado, uma vez', async (t) => {
  const gated = gatedAcceptance(t)
  const { hub, ana, conversations } = await conversing(
    t,
    (asked) => title(asked) ?? { kind: 'text', text: 'Oi.' },
  )
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const stream = await streamOf(hub, ana, url)
  t.after(() => stream.close())
  assert.equal((await sent(hub, ana, url, 'Uma pergunta')).statusCode, 202)
  await gated.signalled
  assert.equal((await post(hub, ana, `${url}/stop`, {})).statusCode, 204)
  gated.release()
  assert.deepEqual(await endOf(stream), { ends: ['aborted'], failures: [] })
})
