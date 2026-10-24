import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'
import type { ConversationEvent } from '@conexus/hub-api'
import { CompanyId, ProjectId } from '@conexus/hub-api'
import { call, post } from '../../hub/identity/test-hub.ts'
import type { Sent } from '../../platform/test-anthropic.ts'
import {
  answeredOf,
  conversing,
  hubBeside,
  messagesOf,
  sent,
  started,
  streamOf,
} from './test-conversation.ts'
import { connect } from './test-defaults.ts'
import { failuresOf } from './test-parts.ts'
import {
  answerUrl,
  ask,
  CLOSED,
  parkedRows,
  SUBMIT,
  stateOf,
  stepping,
  tool,
  untilCard,
  WHO,
  WRITE_PLAN,
  waitingRun,
  within,
} from './test-questions.ts'

const WRITE_A = tool('mastra_workspace_write_file', { path: 'a.ts', content: 'x\n' })

const QUESTION = { kind: 'answers', answers: ['Todos (recomendado)'] }
const APPROVED = { kind: 'plan', action: 'approved' }

async function rowOf(hub: { test: { asOwner(sql: string): Promise<unknown[]> } }) {
  const [row] = await hub.test.asOwner(
    'select state, owner, lease_until < now() as past from builder.run',
  )
  return Object(row)
}

/**
 * A card asked on a copy that is then stopped as an update stops it: the turn writes `a.ts`, asks,
 * and the copy closes; `next` is the copy that takes over, its machine still there.
 */
async function parkedThenUpdated(
  t: TestContext,
  type: 'question' | 'plan',
  steps = type === 'question' ? [[WRITE_A], [ask(WHO)]] : [[WRITE_A, WRITE_PLAN], [SUBMIT]],
  choose?: (world: Awaited<ReturnType<typeof conversing>>) => Promise<void>,
) {
  const calls: Sent[] = []
  const world = await conversing(t, stepping(steps, calls))
  const { hub, ana, conversations } = world
  await choose?.(world)
  const closing = await hubBeside(t, hub)
  const url = `${conversations}/${await started(closing, ana, conversations)}`
  const stream = await streamOf(closing, ana, url)
  t.after(() => stream.close())
  assert.equal((await sent(closing, ana, url, 'Crie um app de encomendas')).statusCode, 202)
  const { card } = await untilCard(stream, type)
  await waitingRun(hub)
  const left = await rowOf(hub)
  const closed = closing.close().then(() => 'closed')
  assert.equal(await within(5_000, closed), 'closed', 'the close does not wait for the answer')
  assert.equal(await stream.ended(), true)
  const next = await hubBeside(t, hub)
  next.builder.control.outcome = 'connected'
  const repository = next.builder.repository({
    companyId: CompanyId.parse(world.companyId),
    projectId: ProjectId.parse(world.projectId),
  })
  return { ...world, url, card, calls, next, left, version: () => repository.version() }
}

/** The stream of `next` on the conversation, opened with the adopted turn: its `turn` event first. */
async function adoptedStream(t: TestContext, where: Awaited<ReturnType<typeof parkedThenUpdated>>) {
  const stream = await streamOf(where.next, where.ana, where.url)
  t.after(() => stream.close())
  const first = await within(5_000, stream.next())
  assert.equal(first?.type, 'turn', 'the stream opens with the adopted turn')
  const messages = first?.type === 'turn' ? first.messages : []
  return { stream, messages }
}

/** Builder messages the turn started, by id: a resume that says one twice doubles a step. */
function startedIds(events: ConversationEvent[]): string[] {
  return events.flatMap((event) =>
    event.type === 'message_start' && event.message.role === 'builder' ? [event.message.id] : [],
  )
}

for (const [type, answer] of [
  ['question', QUESTION],
  ['plan', APPROVED],
] as const) {
  const name =
    type === 'question'
      ? 'atualizar com uma pergunta aberta: a cópia nova mostra a pergunta, a resposta segue o mesmo turno e ele monta (14.2, critério 41)'
      : 'atualizar com o plano aberto: aprovado na cópia nova, o turno segue e monta (14.2, critério 41)'
  test(name, { timeout: 60_000 }, async (t) => {
    const where = await parkedThenUpdated(t, type)
    const { hub, ana, url, card, calls, next, left } = where
    assert.deepEqual(
      { state: left.state, ...(await rowOf(hub)) },
      { state: 'waiting', owner: left.owner, past: true },
      'the stopped copy yields the lease and leaves the row waiting',
    )
    assert.equal(await parkedRows(hub), 1, 'Mastra keeps the parked run')
    await next.restart()
    const adopted = await rowOf(hub)
    assert.equal(adopted.state, 'waiting')
    assert.notEqual(adopted.owner, left.owner, 'the next copy holds the run')
    const read = (await messagesOf(next, ana, url)).flatMap((message) => message.parts)
    assert.deepEqual(stateOf(read, card.toolCallId), ['call'], 'the card reads open')
    assert.ok(!read.some((part) => part.type === 'data-conexus-restarted'), 'no restart is said')
    const { stream, messages } = await adoptedStream(t, where)
    const holding = messages.filter((message) => card.toolCallId in message.suspended)
    assert.equal(holding.length, 1, 'the turn shows the card once')
    assert.deepEqual(
      Object(holding[0]?.suspended[card.toolCallId]).suspendPayload,
      card.suspendPayload,
    )
    const answered = await post(next, ana, answerUrl(url, card.toolCallId), answer)
    assert.equal(answered.statusCode, 202, answered.body)
    const events = await within(15_000, stream.turn())
    assert.ok(events !== undefined, 'the resumed turn ended')
    assert.deepEqual(events.at(-1), { type: 'turnEnd', reason: 'complete' })
    const ids = startedIds(events)
    assert.deepEqual(ids, [...new Set(ids)], 'the resume says each step once')
    assert.equal(await where.version(), 1)
    assert.equal((await rowOf(hub)).state, 'saved')
    assert.equal(await parkedRows(hub), 0)
    const said = type === 'question' ? 'Todos (recomendado)' : 'approved'
    assert.ok(
      calls.at(-1)?.texts.some((text) => text.includes(said)),
      JSON.stringify(calls.at(-1)),
    )
  })
}

test('a pergunta vence na cópia nova: o prazo arma de novo lá', { timeout: 60_000 }, async (t) => {
  const where = await parkedThenUpdated(t, 'question')
  const { ana, url, card, next } = where
  // The next copy's clock starts at adoption (firstmate 2026-10-24, option C), on its own knob.
  next.builder.knobs.questionMs = 300
  const { stream } = await adoptedStream(t, { ...where, next: await restarted(next) })
  const events = await within(15_000, stream.turn())
  assert.ok(events !== undefined, 'the card expired on the next copy')
  assert.deepEqual(failuresOf(events), ['QUESTION_EXPIRED'])
  assert.deepEqual(events.at(-1), { type: 'turnEnd', reason: 'aborted' })
  const read = (await answeredOf(next, ana, url)).flatMap((message) => message.parts)
  assert.deepEqual(stateOf(read, card.toolCallId), CLOSED)
  assert.equal(await where.version(), 1, 'what was written is kept')
})

test('a hora do turno ainda fecha a pergunta adotada', { timeout: 60_000 }, async (t) => {
  const where = await parkedThenUpdated(t, 'question')
  const { hub, ana, url, card, next } = where
  // Thirty fresh minutes on the card, but the turn's hour, kept on the row, ends first.
  await hub.test.asOwner(`update builder.run set deadline_at = now() + interval '300 milliseconds'`)
  const { stream } = await adoptedStream(t, { ...where, next: await restarted(next) })
  const events = await within(15_000, stream.turn())
  assert.ok(events !== undefined, 'the turn hour ended the adopted turn')
  assert.ok(!failuresOf(events).includes('QUESTION_EXPIRED'))
  assert.deepEqual(events.at(-1), { type: 'turnEnd', reason: 'aborted' })
  const read = (await answeredOf(next, ana, url)).flatMap((message) => message.parts)
  assert.deepEqual(stateOf(read, card.toolCallId), CLOSED)
  assert.equal(await where.version(), 1, 'what was written is kept')
})

/** `next` once its settle at start ran, as `runServer` does once it listens. */
async function restarted<T extends { restart(): Promise<void> }>(next: T): Promise<T> {
  await next.restart()
  return next
}

test('Parar na cópia nova fecha a pergunta e guarda o que foi feito', {
  timeout: 60_000,
}, async (t) => {
  const where = await parkedThenUpdated(t, 'question')
  const { ana, url, card, next } = where
  await next.restart()
  const { stream } = await adoptedStream(t, where)
  assert.equal((await post(next, ana, `${url}/stop`, {})).statusCode, 204)
  const events = await within(15_000, stream.turn())
  assert.ok(events !== undefined, 'the turn ended')
  assert.deepEqual(events.at(-1), { type: 'turnEnd', reason: 'aborted' })
  const read = (await answeredOf(next, ana, url)).flatMap((message) => message.parts)
  assert.deepEqual(stateOf(read, card.toolCallId), CLOSED)
  assert.equal(await where.version(), 1)
})

test('uma mensagem na cópia nova fecha a pergunta e o turno segue', {
  timeout: 60_000,
}, async (t) => {
  const where = await parkedThenUpdated(t, 'question')
  const { ana, url, calls, next } = where
  await next.restart()
  const { stream } = await adoptedStream(t, where)
  const steered = await sent(next, ana, url, 'Melhor: só eu cadastro.')
  assert.equal(steered.statusCode, 202, steered.body)
  const events = await within(15_000, stream.turn())
  assert.ok(events !== undefined, 'the turn ended')
  assert.deepEqual(events.at(-1), { type: 'turnEnd', reason: 'complete' })
  assert.ok(calls.at(-1)?.texts.some((text) => text.includes('Melhor: só eu cadastro.')))
})

test('a resposta chega antes da cópia nova assentar', { timeout: 60_000 }, async (t) => {
  const where = await parkedThenUpdated(t, 'question')
  const { ana, url, card, next } = where
  const stream = await streamOf(next, ana, url)
  t.after(() => stream.close())
  const answered = await post(next, ana, answerUrl(url, card.toolCallId), QUESTION)
  assert.equal(answered.statusCode, 202, answered.body)
  const events = await within(15_000, stream.turn())
  assert.deepEqual(events?.at(-1), { type: 'turnEnd', reason: 'complete' })
  assert.equal(await where.version(), 1)
})

test('o Hub cai com uma pergunta aberta: a cópia nova adota, a velha solta sem negar', {
  timeout: 60_000,
}, async (t) => {
  const calls: Sent[] = []
  const { hub, ana, conversations, lines } = await conversing(
    t,
    stepping([[WRITE_A], [ask(WHO)]], calls),
  )
  hub.builder.knobs.renewMs = 100
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const alive = await streamOf(hub, ana, url)
  t.after(() => alive.close())
  assert.equal((await sent(hub, ana, url, 'Crie um app de encomendas')).statusCode, 202)
  const { card } = await untilCard(alive, 'question')
  await waitingRun(hub)
  await hub.test.asOwner(`update builder.run set lease_until = now() - interval '1 second'`)
  const next = await hubBeside(t, hub)
  next.builder.control.outcome = 'connected'
  await next.restart()
  for (let tries = 0; !lines.some((line) => line.message === 'RUN_LEASE_LOST'); tries += 1) {
    assert.ok(tries < 50, 'the first copy finds its lease lost')
    await sleep(100)
  }
  const stream = await streamOf(next, ana, url)
  t.after(() => stream.close())
  const answered = await post(next, ana, answerUrl(url, card.toolCallId), QUESTION)
  assert.equal(answered.statusCode, 202, answered.body)
  const events = await within(15_000, stream.turn())
  assert.deepEqual(events?.at(-1), { type: 'turnEnd', reason: 'complete' })
  const read = (await answeredOf(next, ana, url)).flatMap((message) => message.parts)
  assert.ok(
    !stateOf(read, card.toolCallId).includes('output-denied'),
    'the first copy denied nothing',
  )
  assert.ok(calls.at(-1)?.texts.some((text) => text.includes('Todos (recomendado)')))
})

test('o snapshot do Mastra fica até a resposta e sai depois', { timeout: 60_000 }, async (t) => {
  const where = await parkedThenUpdated(t, 'question')
  const { hub, ana, url, card, next } = where
  await next.restart()
  assert.equal(await parkedRows(hub), 1)
  const { stream } = await adoptedStream(t, where)
  assert.equal((await post(next, ana, answerUrl(url, card.toolCallId), QUESTION)).statusCode, 202)
  await within(15_000, stream.turn())
  assert.equal(await parkedRows(hub), 0)
})

const LONG = 'As encomendas da padaria chegam pelo telefone e pelo balcão. '.repeat(3000)
const OBSERVED = [
  '<observations>',
  '* 🔴 (10:00) Ana quer um app de encomendas da padaria.',
  '</observations>',
  '<thread-title>Encomendas da padaria</thread-title>',
].join('\n')

test('a cópia que adota o turno lê a escolha da empresa: o Observador chama o dublê do Groq (14.2, 35)', {
  timeout: 60_000,
}, async (t) => {
  const groq = 'groq/llama-3.3-70b-versatile'
  const where = await parkedThenUpdated(
    t,
    'question',
    [[WRITE_A], [ask(WHO)], [{ type: 'text', text: LONG }, WRITE_A]],
    async ({ hub, ana, companyId, anthropic }) => {
      anthropic.chat = () => ({ kind: 'text', text: OBSERVED })
      await connect(hub, ana, `/api/companies/${companyId}/model-accounts`, 'groq')
      const settings = `/api/companies/${companyId}/observational-memory-models`
      const saved = await call(hub, ana, 'PUT', settings, { role: 'observer', model: groq })
      assert.equal(saved.statusCode, 200, saved.body)
    },
  )
  const { ana, url, card, next, anthropic } = where
  await next.restart()
  const { stream } = await adoptedStream(t, where)
  assert.equal((await post(next, ana, answerUrl(url, card.toolCallId), QUESTION)).statusCode, 202)
  const events = await within(30_000, stream.turn())
  assert.deepEqual(events?.at(-1), { type: 'turnEnd', reason: 'complete' })
  assert.ok(anthropic.chats.length > 0, 'the adopted turn’s memory called the Groq double')
})
