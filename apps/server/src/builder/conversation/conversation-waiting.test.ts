import assert from 'node:assert/strict'
import { test } from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'
import { z } from 'zod'
import { post } from '../../hub/identity/test-hub.ts'
import { answeredOf, messagesOf, sent, streamOf } from './test-conversation.ts'
import { failuresOf, partsOf } from './test-parts.ts'
import {
  answerTo,
  ask,
  CLOSED,
  cards,
  conversingWith,
  parkedRows,
  SUBMIT,
  stateOf,
  untilCard,
  untilParked,
  WHO,
  WRITE_PLAN,
  within,
} from './test-questions.ts'

const Planned = z.object({ plan: z.string() })

const QUESTION = { kind: 'answers', answers: ['Todos (recomendado)'] }

/**
 * Mastra 1.78.0 can write the parked run's snapshot after the release that deletes it, so a row
 * may outlive the turn (reported to Mastra, feedback id 6edddc96-17b5-4e31-a6df-986c1598d366).
 * The tests that own the leftover row are `todo`: remove the option when Mastra's fix lands.
 */
const MASTRA_RACE =
  'Mastra 1.78.0 can recreate the parked snapshot after abort (report 6edddc96-17b5-4e31-a6df-986c1598d366)'

test('uma pergunta encerra o turno: o fim é dito, o Projeto fica livre e o cartão espera sem prazo', {
  timeout: 60_000,
}, async (t) => {
  const { hub, ana, url, stream, send, conversations } = await conversingWith(t, [[ask(WHO)]])
  assert.equal((await send()).statusCode, 202)
  const { card, events } = await untilCard(stream, 'question')
  assert.deepEqual(events.at(-1), { type: 'turnEnd', reason: 'complete' })
  assert.deepEqual(failuresOf(events), [])
  const other = `${conversations}/${String(Object((await post(hub, ana, conversations, {})).json()).conversation.id)}`
  const elsewhere = await sent(hub, ana, other, 'Outra coisa no mesmo Projeto')
  assert.equal(elsewhere.statusCode, 202, 'a card waiting holds no Projeto')
  const read = (await messagesOf(hub, ana, url)).flatMap((message) => message.parts)
  assert.deepEqual(stateOf(read, card.toolCallId), ['call'], 'the card stays open')
})

test('fechar a última aba com a pergunta aberta: o cartão continua, e a resposta numa aba nova segue', {
  timeout: 60_000,
}, async (t) => {
  const { hub, ana, url, stream, send } = await conversingWith(t, [[ask(WHO)]])
  assert.equal((await send()).statusCode, 202)
  const { card } = await untilCard(stream, 'question')
  stream.close()
  // The last stream's close lets the session go (`deleteSession`), a moment after the socket ends.
  await sleep(1_000)
  const read = (await messagesOf(hub, ana, url)).flatMap((message) => message.parts)
  assert.deepEqual(stateOf(read, card.toolCallId), ['call'], 'the card stays open')
  const fresh = await streamOf(hub, ana, url)
  t.after(() => fresh.close())
  const answered = await answerTo(hub, ana, url, card.toolCallId, QUESTION)
  assert.equal(answered.statusCode, 202, answered.body)
  assert.deepEqual((await within(15_000, fresh.turn()))?.at(-1), {
    type: 'turnEnd',
    reason: 'complete',
  })
})

test('Parar com uma pergunta aberta: a chamada fecha negada, sem turno a terminar', {
  timeout: 60_000,
}, async (t) => {
  const { hub, ana, url, stream, send } = await conversingWith(t, [[ask(WHO)]])
  assert.equal((await send()).statusCode, 202)
  const { card } = await untilCard(stream, 'question')
  assert.equal((await post(hub, ana, `${url}/stop`, {})).statusCode, 204)
  const read = (await answeredOf(hub, ana, url)).flatMap((message) => message.parts)
  assert.deepEqual(stateOf(read, card.toolCallId), CLOSED)
  assert.equal(await within(500, stream.next()), undefined, 'no turn runs to say an end')
})

test('uma mensagem com pergunta aberta a fecha e abre o turno seguinte, sem RUN_BUSY', {
  timeout: 60_000,
}, async (t) => {
  const { hub, ana, url, stream, send, calls } = await conversingWith(t, [[ask(WHO)]])
  assert.equal((await send()).statusCode, 202)
  const { card } = await untilCard(stream, 'question')
  const steered = await sent(hub, ana, url, 'Melhor: só eu cadastro.')
  assert.equal(steered.statusCode, 202, steered.body)
  const events = await stream.turn()
  assert.deepEqual(cards(events), [], 'the question is not asked again')
  assert.deepEqual(stateOf(partsOf(events), card.toolCallId).at(-1), CLOSED[0])
  assert.deepEqual(events.at(-1), { type: 'turnEnd', reason: 'complete' })
  assert.ok(calls.at(-1)?.texts.some((text) => text.includes('Melhor: só eu cadastro.')))
})

test('um plano fechado por Parar, relido, traz o texto que o Mastra guardou ao suspender', {
  timeout: 60_000,
}, async (t) => {
  const { hub, ana, url, stream, send } = await conversingWith(t, [[WRITE_PLAN], [SUBMIT]])
  assert.equal((await send()).statusCode, 202)
  const { card } = await untilCard(stream, 'plan')
  assert.ok(Planned.parse(card.suspendPayload).plan.length > 0)
  assert.equal((await post(hub, ana, `${url}/stop`, {})).statusCode, 204)
  const messages = await answeredOf(hub, ana, url)
  const closed = messages.flatMap((message) => message.parts)
  assert.deepEqual(stateOf(closed, card.toolCallId), CLOSED)
  assert.deepEqual(
    Object(
      messages.find((message) => card.toolCallId in message.suspended)?.suspended[card.toolCallId],
    ).suspendPayload,
    card.suspendPayload,
    'read again, the plan keeps the text Mastra saved when it suspended',
  )
})

test('Parar com uma pergunta aberta: nada fica no banco do Mastra', {
  timeout: 60_000,
  todo: MASTRA_RACE,
}, async (t) => {
  const { hub, ana, url, stream, send } = await conversingWith(t, [[ask(WHO)]])
  assert.equal((await send()).statusCode, 202)
  await untilCard(stream, 'question')
  assert.equal((await post(hub, ana, `${url}/stop`, {})).statusCode, 204)
  await answeredOf(hub, ana, url)
  assert.equal(await parkedRows(hub), 0)
})

for (const [type, steps] of [
  ['question', [[ask(WHO)]]],
  ['plan', [[WRITE_PLAN], [SUBMIT]]],
] as const) {
  test(`uma vista nova (recarregar, Voltar, outra aba) com o ${type} esperando lê o cartão aberto e o responde`, {
    timeout: 60_000,
  }, async (t) => {
    const { hub, ana, url, stream, send } = await conversingWith(
      t,
      steps.map((step) => [...step]),
    )
    assert.equal((await send()).statusCode, 202)
    const { card } = await untilCard(stream, type)
    const fresh = await streamOf(hub, ana, url)
    t.after(() => fresh.close())
    const messages = await messagesOf(hub, ana, url)
    const waiting = messages.find((message) => card.toolCallId in message.suspended)
    assert.deepEqual(
      Object(waiting?.suspended[card.toolCallId]).suspendPayload,
      card.suspendPayload,
      'the card is open, with what the call suspended with',
    )
    assert.deepEqual(stateOf(waiting?.parts ?? [], card.toolCallId), ['call'])
    const answer = type === 'question' ? QUESTION : { kind: 'plan', action: 'approved' }
    const answered = await answerTo(hub, ana, url, card.toolCallId, answer)
    assert.equal(answered.statusCode, 202, answered.body)
    assert.deepEqual((await within(15_000, fresh.turn()))?.at(-1), {
      type: 'turnEnd',
      reason: 'complete',
    })
  })
}

/** Mastra keeps the parked run as it had not written it yet: its own resume refuses an answer then. */
const NOT_PARKED_YET = `update mastra.mastra_workflow_snapshot set snapshot = jsonb_set(snapshot, '{status}', '"pending"') where workflow_name = 'agentic-loop'`

test('resume recusado: a resposta diz a falha, o cartão fica aberto, e Parar o fecha uma vez', {
  timeout: 60_000,
}, async (t) => {
  const { hub, ana, url, stream, send } = await conversingWith(t, [[ask(WHO)]])
  assert.equal((await send()).statusCode, 202)
  const { card } = await untilCard(stream, 'question')
  await untilParked(hub)
  await hub.test.mastraPool.query(NOT_PARKED_YET)
  const answered = await post(hub, ana, `${url}/questions/${card.toolCallId}`, QUESTION)
  assert.equal(answered.statusCode, 202, answered.body)
  const refused = await within(15_000, stream.turn())
  assert.ok(refused !== undefined, 'the answer’s turn ended')
  assert.deepEqual(failuresOf(refused), ['INTERNAL_UNEXPECTED'])
  assert.deepEqual(refused.at(-1), { type: 'turnEnd', reason: 'error' })
  const read = (await messagesOf(hub, ana, url)).flatMap((message) => message.parts)
  assert.deepEqual(stateOf(read, card.toolCallId), ['call'], 'the card stays open')
  assert.equal((await post(hub, ana, `${url}/stop`, {})).statusCode, 204)
  const closed = (await answeredOf(hub, ana, url)).flatMap((message) => message.parts)
  assert.deepEqual(stateOf(closed, card.toolCallId), CLOSED)
  assert.equal(await within(500, stream.next()), undefined, 'Parar ends no second turn')
  assert.equal((await sent(hub, ana, url, 'De novo')).statusCode, 202, 'the Projeto is free')
  assert.deepEqual((await within(15_000, stream.turn()))?.at(-1), {
    type: 'turnEnd',
    reason: 'complete',
  })
})
