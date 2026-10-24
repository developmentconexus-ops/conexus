import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
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
import {
  answerTo,
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
  within,
} from './test-questions.ts'

const WRITE_A = tool('mastra_workspace_write_file', { path: 'a.ts', content: 'x\n' })

const QUESTION = { kind: 'answers', answers: ['Todos (recomendado)'] }
const APPROVED = { kind: 'plan', action: 'approved' }

/**
 * A card asked on a copy that is then stopped as an update stops it: the turn writes `a.ts`, asks,
 * its version is saved, and the copy closes without waiting for the answer; `next` is the copy
 * that takes over, its machine still there.
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
  const { card, events } = await untilCard(stream, type)
  assert.deepEqual(
    events.at(-1),
    { type: 'turnEnd', reason: 'complete' },
    'the question ends the turn',
  )
  const closed = closing.close().then(() => 'closed')
  assert.equal(await within(5_000, closed), 'closed', 'the close waits for nothing parked')
  assert.equal(await stream.ended(), true)
  const next = await hubBeside(t, hub)
  next.builder.control.outcome = 'connected'
  const repository = next.builder.repository({
    companyId: CompanyId.parse(world.companyId),
    projectId: ProjectId.parse(world.projectId),
  })
  return { ...world, url, card, calls, next, version: () => repository.version() }
}

/** Builder messages the turn started, by id: a resume that says one twice doubles a step. */
function startedIds(events: Awaited<ReturnType<Awaited<ReturnType<typeof streamOf>>['turn']>>) {
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
      ? 'atualizar com uma pergunta aberta: a versão já está guardada, a cópia nova mostra a pergunta e a resposta abre o turno seguinte (14.2, critério 41)'
      : 'atualizar com o plano aberto: a versão já está guardada, aprovado na cópia nova o turno seguinte monta (14.2, critério 41)'
  test(name, { timeout: 60_000 }, async (t) => {
    const { hub, ana, url, card, calls, next, version } = await parkedThenUpdated(t, type)
    assert.equal(await version(), 1, 'the version was saved when the Builder asked')
    assert.equal(await parkedRows(hub), 1, 'Mastra keeps the parked run')
    const read = (await messagesOf(next, ana, url)).flatMap((message) => message.parts)
    assert.deepEqual(stateOf(read, card.toolCallId), ['call'], 'the card reads open')
    const stream = await streamOf(next, ana, url)
    t.after(() => stream.close())
    const answered = await answerTo(next, ana, url, card.toolCallId, answer)
    assert.equal(answered.statusCode, 202, answered.body)
    const events = await within(15_000, stream.turn())
    assert.ok(events !== undefined, 'the answered turn ended')
    assert.equal(events[0]?.type, 'turn')
    assert.deepEqual(events.at(-1), { type: 'turnEnd', reason: 'complete' })
    const ids = startedIds(events)
    assert.deepEqual(ids, [...new Set(ids)], 'the resume says each step once')
    assert.equal(await version(), 1, 'the answered turn wrote nothing more')
    assert.equal(await parkedRows(hub), 0)
    const said = type === 'question' ? 'Todos (recomendado)' : 'approved'
    assert.ok(
      calls.at(-1)?.texts.some((text) => text.includes(said)),
      JSON.stringify(calls.at(-1)),
    )
  })
}

test('Parar na cópia nova fecha a pergunta; a versão guardada fica', {
  timeout: 60_000,
}, async (t) => {
  const { ana, url, card, next, version } = await parkedThenUpdated(t, 'question')
  const stream = await streamOf(next, ana, url)
  t.after(() => stream.close())
  assert.equal((await post(next, ana, `${url}/stop`, {})).statusCode, 204)
  const read = (await answeredOf(next, ana, url)).flatMap((message) => message.parts)
  assert.deepEqual(stateOf(read, card.toolCallId), CLOSED)
  assert.equal(await version(), 1)
  assert.equal(await within(500, stream.next()), undefined, 'no turn ran to say an end')
})

test('uma mensagem na cópia nova fecha a pergunta e abre o turno seguinte', {
  timeout: 60_000,
}, async (t) => {
  const { ana, url, card, calls, next } = await parkedThenUpdated(t, 'question')
  const stream = await streamOf(next, ana, url)
  t.after(() => stream.close())
  const steered = await sent(next, ana, url, 'Melhor: só eu cadastro.')
  assert.equal(steered.statusCode, 202, steered.body)
  const events = await within(15_000, stream.turn())
  assert.ok(events !== undefined, 'the turn ended')
  assert.deepEqual(events.at(-1), { type: 'turnEnd', reason: 'complete' })
  assert.ok(calls.at(-1)?.texts.some((text) => text.includes('Melhor: só eu cadastro.')))
  const read = (await answeredOf(next, ana, url)).flatMap((message) => message.parts)
  assert.deepEqual(stateOf(read, card.toolCallId), CLOSED)
})

test('a resposta chega antes da cópia nova assentar', { timeout: 60_000 }, async (t) => {
  const { hub, ana, url, card, next, version } = await parkedThenUpdated(t, 'question')
  const stream = await streamOf(next, ana, url)
  t.after(() => stream.close())
  const answered = await answerTo(next, ana, url, card.toolCallId, QUESTION)
  assert.equal(answered.statusCode, 202, answered.body)
  const events = await within(15_000, stream.turn())
  assert.deepEqual(events?.at(-1), { type: 'turnEnd', reason: 'complete' })
  assert.equal(await version(), 1)
  assert.equal(await parkedRows(hub), 0, 'the answered run leaves Mastra’s database')
})

const LONG = 'As encomendas da padaria chegam pelo telefone e pelo balcão. '.repeat(3000)
const OBSERVED = [
  '<observations>',
  '* 🔴 (10:00) Ana quer um app de encomendas da padaria.',
  '</observations>',
  '<thread-title>Encomendas da padaria</thread-title>',
].join('\n')

test('a resposta na cópia nova lê a escolha da empresa: o Observador chama o dublê do Groq (14.2, 35)', {
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
  const stream = await streamOf(next, ana, url)
  t.after(() => stream.close())
  assert.equal((await answerTo(next, ana, url, card.toolCallId, QUESTION)).statusCode, 202)
  const events = await within(30_000, stream.turn())
  assert.deepEqual(events?.at(-1), { type: 'turnEnd', reason: 'complete' })
  assert.ok(anthropic.chats.length > 0, 'the answered turn’s memory called the Groq double')
})
