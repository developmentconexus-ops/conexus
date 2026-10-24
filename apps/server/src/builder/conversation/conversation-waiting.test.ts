import assert from 'node:assert/strict'
import { test } from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'
import type { ConversationEvent } from '@conexus/hub-api'
import { z } from 'zod'
import { post } from '../../hub/identity/test-hub.ts'
import { answeredOf, sent, streamOf } from './test-conversation.ts'
import { failuresOf, partsOf } from './test-parts.ts'
import {
  answerUrl,
  ask,
  CLOSED,
  cards,
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

/**
 * Mastra 1.78.0 can write the parked run's snapshot after the release that deletes it, so a row
 * may outlive the turn (reported to Mastra, feedback id 6edddc96-17b5-4e31-a6df-986c1598d366).
 * The tests that own the leftover row are `todo`: remove the option when Mastra's fix lands.
 */
const MASTRA_RACE =
  'Mastra 1.78.0 can recreate the parked snapshot after abort (report 6edddc96-17b5-4e31-a6df-986c1598d366)'

test('uma pergunta sem resposta em 30 minutos expira: a volta termina e diz QUESTION_EXPIRED', async (t) => {
  const { hub, ana, url, stream, send } = await conversingWith(t, [[ask(WHO)]])
  hub.builder.knobs.questionMs = 150
  assert.equal((await send()).statusCode, 202)
  const events = await stream.turn()
  const [asked] = cards(events)
  assert.equal(cards(events).length, 1)
  assert.ok(asked !== undefined)
  assert.deepEqual(failuresOf(events), ['QUESTION_EXPIRED'])
  assert.deepEqual(events.at(-1), { type: 'turnEnd', reason: 'aborted' })
  const read = (await answeredOf(hub, ana, url)).flatMap((message) => message.parts)
  assert.deepEqual(stateOf(read, asked.toolCallId), CLOSED)
  const waiting = await hub.test.asOwner('select state from builder.run')
  assert.deepEqual(waiting, [{ state: 'unchanged' }])
})

test('Parar com uma pergunta aberta: a chamada fecha negada, a pergunta fecha', async (t) => {
  const { hub, ana, url, stream, send } = await conversingWith(t, [[ask(WHO)]])
  assert.equal((await send()).statusCode, 202)
  const { card } = await untilCard(stream, 'question')
  assert.equal((await post(hub, ana, `${url}/stop`, {})).statusCode, 204)
  const events = await stream.turn()
  assert.deepEqual(cards(events), [], 'the question is not asked again')
  assert.deepEqual(stateOf(partsOf(events), card.toolCallId).at(-1), CLOSED[0])
  assert.deepEqual(events.at(-1), { type: 'turnEnd', reason: 'aborted' })
  assert.deepEqual(await hub.test.asOwner('select state from builder.run'), [
    { state: 'unchanged' },
  ])
  const read = (await answeredOf(hub, ana, url)).flatMap((message) => message.parts)
  assert.deepEqual(stateOf(read, card.toolCallId), CLOSED)
})

test('uma mensagem com pergunta aberta a fecha e segue na mesma volta, sem RUN_BUSY', async (t) => {
  const { hub, ana, url, stream, send, calls } = await conversingWith(t, [[ask(WHO)]])
  assert.equal((await send()).statusCode, 202)
  const { card } = await untilCard(stream, 'question')
  const steered = await sent(hub, ana, url, 'Melhor: só eu cadastro.')
  assert.equal(steered.statusCode, 202, steered.body)
  const events = await stream.turn()
  assert.deepEqual(cards(events), [], 'the question is not asked again')
  assert.deepEqual(stateOf(partsOf(events), card.toolCallId).at(-1), CLOSED[0])
  assert.deepEqual(events.at(-1), { type: 'turnEnd', reason: 'complete' })
  assert.equal(events.filter((event) => event.type === 'turnEnd').length, 1)
  assert.ok(calls.at(-1)?.texts.some((text) => text.includes('Melhor: só eu cadastro.')))
})

test('um plano fechado por Parar, relido, traz o texto que o Mastra guardou ao suspender', async (t) => {
  const { hub, ana, url, stream, send } = await conversingWith(t, [[WRITE_PLAN], [SUBMIT]])
  assert.equal((await send()).statusCode, 202)
  const { card } = await untilCard(stream, 'plan')
  assert.ok(Planned.parse(card.suspendPayload).plan.length > 0)
  assert.equal((await post(hub, ana, `${url}/stop`, {})).statusCode, 204)
  await stream.turn()
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
  todo: MASTRA_RACE,
}, async (t) => {
  const { hub, ana, url, stream, send } = await conversingWith(t, [[ask(WHO)]])
  assert.equal((await send()).statusCode, 202)
  await untilCard(stream, 'question')
  assert.equal((await post(hub, ana, `${url}/stop`, {})).statusCode, 204)
  await stream.turn()
  assert.equal(await parkedRows(hub), 0)
})

for (const [type, steps] of [
  ['question', [[ask(WHO)]]],
  ['plan', [[WRITE_PLAN], [SUBMIT]]],
] as const) {
  test(`uma vista nova (recarregar, Voltar, outra aba) com o ${type} esperando abre com o cartão aberto`, async (t) => {
    const { hub, ana, url, stream, send } = await conversingWith(
      t,
      steps.map((step) => [...step]),
    )
    assert.equal((await send()).statusCode, 202)
    const { card } = await untilCard(stream, type)
    const fresh = await streamOf(hub, ana, url)
    t.after(() => fresh.close())
    const first = await within(5_000, fresh.next())
    assert.equal(first?.type, 'turn', 'the fresh view opens with the turn in progress')
    const messages = first?.type === 'turn' ? first.messages : []
    const waiting = messages.find((message) => card.toolCallId in message.suspended)
    assert.deepEqual(
      Object(waiting?.suspended[card.toolCallId]).suspendPayload,
      card.suspendPayload,
      'the card is open, with what the call suspended with',
    )
    assert.deepEqual(stateOf(waiting?.parts ?? [], card.toolCallId), ['call'])
    const where = answerUrl(url, card.toolCallId)
    let answered = await post(hub, ana, where, answerOf(type))
    // Mastra 1.78.0 can show a call before it saved the parked run: an answer that comes that fast
    // loses Mastra's own claim, the card stays open, and the next answer is taken.
    if (answered.statusCode === 500) answered = await post(hub, ana, where, answerOf(type))
    assert.equal(answered.statusCode, 202, answered.body)
    assert.deepEqual((await within(15_000, fresh.turn()))?.at(-1), {
      type: 'turnEnd',
      reason: 'complete',
    })
  })
}

function answerOf(type: 'question' | 'plan') {
  return type === 'question'
    ? { kind: 'answers', answers: ['Todos (recomendado)'] }
    : { kind: 'plan', action: 'approved' }
}

/** The delays, in milliseconds, between an answer and what races it. */
const RACE_DELAYS = [0, 1, 2, 3, 4, 5, 6, 8, 12]

/**
 * After an answer raced something else: the turn ends once and says nothing after, no run is left
 * in progress, and the next message is a turn of its own that completes.
 */
async function endsOnce(conversation: Awaited<ReturnType<typeof conversingWith>>, delay: number) {
  const { hub, ana, url, stream } = conversation
  const events = await within(15_000, stream.turn())
  assert.ok(events !== undefined, `delay ${delay}: the turn never ended`)
  const late: ConversationEvent[] = []
  const until = Date.now() + 500
  for (let said = await within(500, stream.next()); said !== undefined; ) {
    late.push(said)
    said = await within(Math.max(until - Date.now(), 0), stream.next())
  }
  assert.deepEqual(late, [], `delay ${delay}: nothing is said after the turn's end`)
  const runs = await hub.test.asOwner('select state from builder.run')
  assert.ok(
    runs.every((run) => !['open', 'waiting', 'saving'].includes(String(run.state))),
    `delay ${delay}: ${JSON.stringify(runs)}`,
  )
  const next = await sent(hub, ana, url, 'Outra coisa')
  assert.equal(next.statusCode, 202, `delay ${delay}: ${next.body}`)
  const after = await within(15_000, stream.turn())
  assert.deepEqual(
    after?.at(-1),
    { type: 'turnEnd', reason: 'complete' },
    `delay ${delay}: ${JSON.stringify(after)}`,
  )
}

test('uma resposta e Parar quase juntos: a volta termina uma vez e o Projeto fica livre', async (t) => {
  for (const delay of RACE_DELAYS) {
    const conversation = await conversingWith(t, [[ask(WHO)]])
    const { hub, ana, url, stream, send } = conversation
    assert.equal((await send()).statusCode, 202)
    const { card } = await untilCard(stream, 'question')
    const answering = post(hub, ana, answerUrl(url, card.toolCallId), answerOf('question'))
    await sleep(delay)
    const stopping = post(hub, ana, `${url}/stop`, {})
    const [answered, stopped] = await Promise.all([answering, stopping])
    // 500: Mastra refused a resume that came before it saved the parked run; the card stays open.
    assert.ok([202, 409, 500].includes(answered.statusCode), answered.body)
    assert.equal(stopped.statusCode, 204)
    await endsOnce(conversation, delay)
  }
})

test('uma resposta e uma mensagem quase juntas: a volta termina uma vez e o Projeto fica livre', async (t) => {
  for (const delay of RACE_DELAYS) {
    const conversation = await conversingWith(t, [[ask(WHO)]])
    const { hub, ana, url, stream, send } = conversation
    assert.equal((await send()).statusCode, 202)
    const { card } = await untilCard(stream, 'question')
    const answering = post(hub, ana, answerUrl(url, card.toolCallId), answerOf('question'))
    await sleep(delay)
    const steering = sent(hub, ana, url, 'Melhor: só eu cadastro.')
    const [answered, steered] = await Promise.all([answering, steering])
    // The answer took the card first, and the message joins the turn the answer resumed; or the
    // message closed the card first, and the answer meets a closed one.
    assert.ok(
      (answered.statusCode === 202 && steered.statusCode === 202) ||
        ([409, 500].includes(answered.statusCode) && steered.statusCode === 202),
      `delay ${delay}: ${answered.statusCode} ${steered.statusCode} ${steered.body}`,
    )
    await endsOnce(conversation, delay)
  }
})

test('o banco recusa a espera quando a pergunta abre: a volta termina e o Hub segue', async (t) => {
  const { hub, ana, url, stream, send } = await conversingWith(t, [[ask(WHO)]])
  await hub.test.asOwner(`
    create function builder.refuse_waiting() returns trigger language plpgsql as $$
    begin raise exception 'refused'; end $$;
    create trigger refuse_waiting before update on builder.run
      for each row when (new.state = 'waiting') execute function builder.refuse_waiting();
  `)
  assert.equal((await send()).statusCode, 202)
  const events = await within(15_000, stream.turn())
  assert.ok(events !== undefined, 'the turn ended')
  assert.deepEqual(events.at(-1), { type: 'turnEnd', reason: 'aborted' })
  assert.deepEqual(failuresOf(events), ['INTERNAL_UNEXPECTED'])
  assert.deepEqual(await hub.test.asOwner('select state from builder.run'), [
    { state: 'unchanged' },
  ])
  assert.equal((await sent(hub, ana, url, 'De novo')).statusCode, 202)
})
