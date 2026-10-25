import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'
import { z } from 'zod'
import { post } from '../../hub/identity/test-hub.ts'

import type { StreamEvent } from './test-conversation.ts'
import { answeredOf, endOf, messagesOf, sent, stopped, streamOf } from './test-conversation.ts'
import { failuresOf } from './test-parts.ts'
import {
  answered,
  answerTo,
  ask,
  CLOSED,
  conversingWith,
  parkedRows,
  SUBMIT,
  stateOf,
  untilCard,
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

/**
 * The conversation read again once Mastra has written the denial of the call: it writes the call and
 * its denial a moment after the abort, as it resumes the call with it, so the read is polled, bounded.
 */
async function closedRead(
  hub: Parameters<typeof answeredOf>[0],
  ana: Parameters<typeof answeredOf>[1],
  url: string,
  toolCallId: string,
) {
  let messages = await answeredOf(hub, ana, url)
  for (
    let attempt = 0;
    attempt < 50 &&
    stateOf(
      messages.flatMap((message) => message.parts),
      toolCallId,
    ).at(-1) !== CLOSED.at(-1);
    attempt += 1
  ) {
    await sleep(100)
    messages = await answeredOf(hub, ana, url)
  }
  return messages
}

/**
 * Mastra's refusal of a resume whose claim it lost (`AGENT_RESUME_ALREADY_CLAIMED`, core 1.79
 * `alreadyClaimedResumeError`): an answer within milliseconds of the asking run's end can meet it.
 */
function lostClaim(event: StreamEvent | undefined) {
  return (
    event?.type === 'error' &&
    event.error.message.includes('another resume of it already claimed it')
  )
}

/** The events up to the run's end, or up to Mastra's refusal of a lost claim, which ends no run. */
async function endOrLostClaim(stream: Awaited<ReturnType<typeof streamOf>>) {
  const said: StreamEvent[] = []
  for (;;) {
    const event = await stream.next()
    said.push(event)
    if (event.type === 'agent_end' || lostClaim(event)) return said
  }
}

test('uma pergunta encerra o turno: o fim é dito, o Projeto fica livre e o cartão espera sem prazo', {
  timeout: 60_000,
}, async (t) => {
  const { hub, ana, url, stream, send, conversations } = await conversingWith(t, [[ask(WHO)]])
  assert.equal((await send()).statusCode, 200)
  const { card, events } = await untilCard(stream, 'question')
  assert.equal(endOf(events), 'suspended')
  assert.deepEqual(failuresOf(events), [])
  const other = `${conversations}/${String(Object((await post(hub, ana, conversations, {}, randomUUID())).json()).conversation.id)}`
  const elsewhere = await sent(hub, ana, other, 'Outra coisa no mesmo Projeto')
  assert.equal(elsewhere.statusCode, 200, 'a card waiting holds no Projeto')
  const read = (await messagesOf(hub, ana, url)).flatMap((message) => message.parts)
  assert.deepEqual(stateOf(read, card.toolCallId), ['call'], 'the card stays open')
})

test('fechar a última aba com a pergunta aberta: o cartão continua, e a resposta numa aba nova segue', {
  timeout: 60_000,
}, async (t) => {
  const { hub, ana, url, stream, send } = await conversingWith(t, [[ask(WHO)]])
  assert.equal((await send()).statusCode, 200)
  const { card } = await untilCard(stream, 'question')
  stream.close()
  // The last stream's close lets the session go (`deleteSession`), a moment after the socket ends.
  await sleep(1_000)
  const read = (await messagesOf(hub, ana, url)).flatMap((message) => message.parts)
  assert.deepEqual(stateOf(read, card.toolCallId), ['call'], 'the card stays open')
  const fresh = await streamOf(hub, ana, url)
  t.after(() => fresh.close())
  const answered = await answerTo(hub, ana, url, card.toolCallId, QUESTION)
  assert.equal(answered.statusCode, 200, answered.body)
  assert.equal(endOf(await within(15_000, fresh.turn())), 'complete')
})

test('Parar com uma pergunta aberta: a chamada fecha negada, numa volta do Mastra que termina parada, sem o modelo', {
  timeout: 60_000,
}, async (t) => {
  const { hub, ana, url, stream, send, calls } = await conversingWith(t, [[ask(WHO)]])
  assert.equal((await send()).statusCode, 200)
  const { card } = await untilCard(stream, 'question')
  const asked = calls.length
  assert.equal((await stopped(hub, ana, url)).statusCode, 200)
  // Mastra resumes the parked call with its denial in a run of its own, which ends aborted.
  assert.equal(endOf(await within(15_000, stream.turn())), 'aborted')
  const read = (await closedRead(hub, ana, url, card.toolCallId)).flatMap((m) => m.parts)
  assert.deepEqual(stateOf(read, card.toolCallId), CLOSED)
  assert.equal(calls.length, asked, 'the denial reaches no model')
})

test('um plano fechado por Parar, relido, traz o texto que o Mastra guardou ao suspender', {
  timeout: 60_000,
}, async (t) => {
  const { hub, ana, url, stream, send } = await conversingWith(t, [[WRITE_PLAN], [SUBMIT]])
  assert.equal((await send()).statusCode, 200)
  const { card } = await untilCard(stream, 'plan')
  assert.ok(Planned.parse(card.suspendPayload).plan.length > 0)
  assert.equal((await stopped(hub, ana, url)).statusCode, 200)
  const messages = await closedRead(hub, ana, url, card.toolCallId)
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
  assert.equal((await send()).statusCode, 200)
  await untilCard(stream, 'question')
  assert.equal((await stopped(hub, ana, url)).statusCode, 200)
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
    assert.equal((await send()).statusCode, 200)
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
    assert.equal(answered.statusCode, 200, answered.body)
    assert.equal(endOf(await within(15_000, fresh.turn())), 'complete')
  })
}

test('a resposta no instante do fim do turno: o Mastra a retoma, ou a recusa e o cartão fica aberto (a janela do instantâneo, como na rota do Mastra)', {
  timeout: 60_000,
}, async (t) => {
  const { hub, ana, url, stream, send } = await conversingWith(t, [[ask(WHO)]])
  assert.equal((await send()).statusCode, 200)
  const { card } = await untilCard(stream, 'question')
  const answer = await answered(hub, ana, url, card.toolCallId, QUESTION)
  assert.equal(answer.statusCode, 200, answer.body)
  if (answer.json().ok === false) {
    // Mastra's claim found no pending suspension yet (`claimToolSuspension`): nothing runs.
    const read = (await messagesOf(hub, ana, url)).flatMap((message) => message.parts)
    assert.deepEqual(stateOf(read, card.toolCallId), ['call'], 'the card stays open')
    return
  }
  const events = await within(15_000, endOrLostClaim(stream))
  assert.ok(events !== undefined, 'the answer’s turn ended')
  if (lostClaim(events.at(-1))) {
    // Mastra saw the run's snapshot move under its claim (`waitForSuspendedSnapshot`): it says the
    // error, ends no run, and keeps the call waiting, so the same answer, sent again, resumes it.
    const read = (await messagesOf(hub, ana, url)).flatMap((message) => message.parts)
    assert.deepEqual(stateOf(read, card.toolCallId), ['call'], 'the card stays open')
    const again = await answered(hub, ana, url, card.toolCallId, QUESTION)
    assert.deepEqual(again.json(), { ok: true })
    assert.equal(endOf(await within(15_000, stream.turn())), 'complete')
    return
  }
  const read = (await answeredOf(hub, ana, url)).flatMap((message) => message.parts)
  if (events.at(-1)?.type === 'agent_end' && failuresOf(events).length === 0) {
    assert.equal(endOf(events), 'complete')
    assert.equal(stateOf(read, card.toolCallId).at(-1), 'result')
  } else {
    assert.deepEqual(failuresOf(events), ['INTERNAL_UNEXPECTED'])
    assert.equal(endOf(events), 'error')
    assert.deepEqual(stateOf(read, card.toolCallId), ['call'], 'the card stays open')
  }
})
