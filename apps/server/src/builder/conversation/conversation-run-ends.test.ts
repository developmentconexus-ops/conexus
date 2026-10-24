import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import type { ConversationEvent } from '@conexus/hub-api'
import type {
  AgentSignalInput as Signal,
  SendAgentSignalOptions as Target,
} from '@mastra/core/agent'
import { Agent } from '@mastra/core/agent'
import { AgentController, Session } from '@mastra/core/agent-controller'
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
import { dataOf, failuresOf } from './test-parts.ts'

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

test('o Mastra não consegue guardar a resposta no fim do turno: o turno termina, e desligar não espera para sempre', {
  timeout: 60_000,
}, async (t) => {
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

test('desligar no meio do turno o para como Parar: o fim diz parado, a versão fica guardada e o desligar acaba dentro do prazo', {
  timeout: 60_000,
}, async (t) => {
  const held = holding(t)
  const write = {
    type: 'tool_use',
    name: 'mastra_workspace_write_file',
    input: { path: 'a.ts', content: 'x\n' },
  } as const
  let step = 0
  const { hub, ana, conversations } = await conversing(t, (asked) => {
    if (title(asked) !== undefined) return { kind: 'text', text: 'Título' }
    step += 1
    return step === 1 ? { kind: 'blocks', blocks: [write] } : held.reply
  })
  const closing = await hubBeside(t, hub)
  const url = `${conversations}/${await started(closing, ana, conversations)}`
  const stream = await streamOf(closing, ana, url)
  t.after(() => stream.close())
  assert.equal((await sent(closing, ana, url, 'Crie o app')).statusCode, 202)
  assert.equal(await stream.text(), PARTIAL)
  const closed = closing.close()
  const events = await stream.turn()
  assert.deepEqual(events.at(-1), { type: 'turnEnd', reason: 'aborted' })
  assert.deepEqual(
    dataOf(events, 'data-conexus-version').map((version) => Object(version).number),
    [1],
  )
  assert.equal(await within(closed, 10_000), 'settled', 'the close ends within the deadline')
})

test('a linha cai e o turno acaba sem ela: a leitura diz que nenhum turno está em curso, para a tela sair de "trabalhando"', {
  timeout: 60_000,
}, async (t) => {
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

/**
 * The sessions the Hub opens, caught as Mastra makes them; with Mastra's own seams for each way a
 * run can end without `agent_end` (`send-message-settles.test.ts`). Call it before `conversing`.
 */
function sessionsOf(t: TestContext): Session[] {
  const sessions: Session[] = []
  const create = AgentController.prototype.createSession
  t.mock.method(
    AgentController.prototype,
    'createSession',
    async function (this: AgentController, ...input: Parameters<typeof create>) {
      const session = await create.apply(this, input)
      sessions.push(session)
      return session
    },
  )
  return sessions
}

/** The run loop that consumes the thread's stream never ends, nor says anything. */
function hungConsumer(t: TestContext): void {
  t.mock.method(
    Session.prototype,
    'processSubscribedThreadStream',
    () => new Promise(() => undefined),
  )
}

/** Resolves once Mastra accepted the next message (it decided where it goes). */
function nextAcceptance(t: TestContext): Promise<void> {
  const accepted = Promise.withResolvers<void>()
  const send = Agent.prototype.sendSignal
  const mocked = t.mock.method(Agent.prototype, 'sendSignal', send)
  mocked.mock.mockImplementationOnce(function <O>(this: Agent, signal: Signal, target: Target<O>) {
    const result = (send<O>).call(this, signal, target)
    void result.accepted.then(() => accepted.resolve())
    return result
  })
  return accepted.promise
}

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

test('o Mastra recusa a mensagem ao aceitá-la: o turno termina com erro, uma vez', {
  timeout: 60_000,
}, async (t) => {
  const send = Agent.prototype.sendSignal
  const mocked = t.mock.method(Agent.prototype, 'sendSignal', send)
  mocked.mock.mockImplementationOnce(() => {
    throw new Error('no route')
  })
  const { stream } = await askedOnce(t, (asked) => title(asked) ?? { kind: 'text', text: 'Oi.' })
  assert.deepEqual(await endOf(stream), { ends: ['error'], failures: ['INTERNAL_UNEXPECTED'] })
})

test('Parar enquanto o Mastra aceita a mensagem: o turno termina parado, uma vez', {
  timeout: 60_000,
}, async (t) => {
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

test('o Mastra desmonta a linha do turno antes do fim: o turno termina parado, uma vez', {
  timeout: 60_000,
}, async (t) => {
  const sessions = sessionsOf(t)
  hungConsumer(t)
  const accepted = nextAcceptance(t)
  const { stream } = await askedOnce(t, (asked) => title(asked) ?? { kind: 'text', text: 'Oi.' })
  await accepted
  const session = sessions.at(-1) // the conversation's open one: making it opened and closed another
  assert.ok(session !== undefined)
  session.stream.detach()
  assert.deepEqual(await endOf(stream), { ends: ['aborted'], failures: [] })
})

test('o laço que lê a linha do Mastra falha: o turno termina com erro, uma vez', {
  timeout: 60_000,
}, async (t) => {
  t.mock.method(Session.prototype, 'processSubscribedThreadStream', () =>
    Promise.reject(new Error('consumer blew up')),
  )
  const { stream } = await askedOnce(t, (asked) => title(asked) ?? { kind: 'text', text: 'Oi.' })
  assert.deepEqual(await endOf(stream), { ends: ['error'], failures: ['INTERNAL_UNEXPECTED'] })
})

test('Parar e o Mastra nunca diz o fim da execução: o turno termina parado, e desligar não espera', {
  timeout: 60_000,
}, async (t) => {
  hungConsumer(t)
  const accepted = nextAcceptance(t)
  const { hub, ana, conversations } = await conversing(
    t,
    (asked) => title(asked) ?? { kind: 'text', text: 'Oi.' },
  )
  const closing = await hubBeside(t, hub)
  const url = `${conversations}/${await started(closing, ana, conversations)}`
  const stream = await streamOf(closing, ana, url)
  t.after(() => stream.close())
  assert.equal((await sent(closing, ana, url, 'Uma pergunta')).statusCode, 202)
  await accepted
  assert.equal((await post(closing, ana, `${url}/stop`, {})).statusCode, 204)
  assert.deepEqual(await endOf(stream), { ends: ['aborted'], failures: [] })
  assert.equal(await within(closing.close(), 10_000), 'settled', 'the close does not hang')
})
