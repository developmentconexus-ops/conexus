import assert from 'node:assert/strict'
import { test } from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'
import type { ConversationEvent } from '@conexus/hub-api'
import { post } from '../../hub/identity/test-hub.ts'
import { answeredOf, hubBeside, sent, streamOf } from './test-conversation.ts'
import {
  answerUrl,
  ask,
  cards,
  conversingWith,
  SUBMIT,
  untilCard,
  WHO,
  WRITE_PLAN,
} from './test-questions.ts'

const PARKED = `select 1 from mastra.mastra_workflow_snapshot where snapshot->>'status' = 'suspended'`

/**
 * Mastra 1.78.0 can write the parked run's snapshot after the release that deletes it, so a row
 * may outlive the turn (reported to Mastra, feedback id 6edddc96-17b5-4e31-a6df-986c1598d366).
 * The tests that own the leftover row are `todo`: remove the option when Mastra's fix lands.
 */
const MASTRA_RACE =
  'Mastra 1.78.0 can recreate the parked snapshot after abort (report 6edddc96-17b5-4e31-a6df-986c1598d366)'

/** What `said` resolves to within `ms`, or `undefined`: a stream that says nothing fails the test, not hangs it. */
async function within<T>(ms: number, said: Promise<T>): Promise<T | undefined> {
  return Promise.race([said, sleep(ms).then(() => undefined)])
}

async function parkedRows(hub: {
  test: { mastraPool: { query(sql: string): Promise<{ rowCount: number | null }> } }
}) {
  return (await hub.test.mastraPool.query(PARKED)).rowCount
}

test('uma pergunta sem resposta em 30 minutos expira: a volta termina e diz QUESTION_EXPIRED', async (t) => {
  const { hub, ana, url, stream, send } = await conversingWith(t, [[ask(WHO)]])
  hub.builder.knobs.questionMs = 150
  assert.equal((await send()).statusCode, 202)
  const events = await stream.turn()
  assert.deepEqual(
    cards(events).map((each) => each.state),
    ['open', 'expired'],
  )
  const parts = events.flatMap((event) => (event.type === 'part' ? [event.part] : []))
  assert.deepEqual(
    parts.filter((part) => part.type === 'failure'),
    [{ type: 'failure', code: 'QUESTION_EXPIRED' }],
  )
  assert.deepEqual(events.at(-1), { type: 'turnEnd', reason: 'aborted' })
  const read = (await answeredOf(hub, ana, url)).flatMap((message) => message.parts)
  assert.deepEqual(
    read.flatMap((part) => (part.type === 'question' ? [part.state] : [])),
    ['expired'],
  )
  const waiting = await hub.test.asOwner('select state from builder.run')
  assert.deepEqual(waiting, [{ state: 'unchanged' }])
})

test('Parar com uma pergunta aberta: a chamada fecha negada, a pergunta fecha', async (t) => {
  const { hub, ana, url, stream, send } = await conversingWith(t, [[ask(WHO)]])
  assert.equal((await send()).statusCode, 202)
  await untilCard(stream, 'question')
  assert.equal((await post(hub, ana, `${url}/stop`, {})).statusCode, 204)
  const events = await stream.turn()
  assert.deepEqual(
    cards(events).map((each) => each.state),
    ['closed'],
  )
  assert.deepEqual(events.at(-1), { type: 'turnEnd', reason: 'aborted' })
  assert.deepEqual(await hub.test.asOwner('select state from builder.run'), [
    { state: 'unchanged' },
  ])
  const read = (await answeredOf(hub, ana, url)).flatMap((message) => message.parts)
  assert.deepEqual(
    read.flatMap((part) => (part.type === 'question' ? [part.state] : [])),
    ['closed'],
  )
})

test('uma mensagem com pergunta aberta a fecha e segue na mesma volta, sem RUN_BUSY', async (t) => {
  const { hub, ana, url, stream, send, calls } = await conversingWith(t, [[ask(WHO)]])
  assert.equal((await send()).statusCode, 202)
  await untilCard(stream, 'question')
  const steered = await sent(hub, ana, url, 'Melhor: só eu cadastro.')
  assert.equal(steered.statusCode, 202, steered.body)
  const events = await stream.turn()
  assert.deepEqual(
    cards(events).map((each) => each.state),
    ['closed'],
  )
  assert.deepEqual(events.at(-1), { type: 'turnEnd', reason: 'complete' })
  assert.equal(events.filter((event) => event.type === 'turnEnd').length, 1)
  assert.ok(calls.at(-1)?.texts.some((text) => text.includes('Melhor: só eu cadastro.')))
})

test('o Hub reinicia com uma pergunta aberta: a chamada fecha negada, a pergunta se lê fechada', async (t) => {
  const { hub, ana, url, stream, send } = await conversingWith(t, [[ask(WHO)]])
  assert.equal((await send()).statusCode, 202)
  await untilCard(stream, 'question')
  assert.deepEqual(await hub.test.asOwner('select state from builder.run'), [{ state: 'waiting' }])
  await hub.test.asOwner(`update builder.run set lease_until = now() - interval '1 second'`)
  const beside = await hubBeside(t, hub)
  await beside.restart()
  const read = (await answeredOf(beside, ana, url)).flatMap((message) => message.parts)
  assert.deepEqual(
    read.flatMap((part) => (part.type === 'question' ? [part.state] : [])),
    ['closed'],
  )
  assert.ok(read.some((part) => part.type === 'restarted'))
  // The first copy, still alive in this test, lets its parked turn go.
  assert.equal((await post(hub, ana, `${url}/stop`, {})).statusCode, 204)
})

test('um plano fechado por Parar, relido, traz o texto que o Mastra guardou ao suspender', async (t) => {
  const { hub, ana, url, stream, send } = await conversingWith(t, [[WRITE_PLAN], [SUBMIT]])
  assert.equal((await send()).statusCode, 202)
  const { card } = await untilCard(stream, 'plan')
  assert.equal(card.type === 'plan' && card.plan.length > 0, true)
  assert.equal((await post(hub, ana, `${url}/stop`, {})).statusCode, 204)
  await stream.turn()
  const closed = (await answeredOf(hub, ana, url)).flatMap((message) => message.parts)
  assert.deepEqual(
    closed.filter((part) => part.type === 'plan'),
    [{ ...card, state: 'closed' }],
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

test('o Hub reinicia com uma pergunta aberta: nada fica no banco do Mastra', {
  todo: MASTRA_RACE,
}, async (t) => {
  const { hub, ana, url, stream, send } = await conversingWith(t, [[ask(WHO)]])
  assert.equal((await send()).statusCode, 202)
  await untilCard(stream, 'question')
  await hub.test.asOwner(`update builder.run set lease_until = now() - interval '1 second'`)
  const beside = await hubBeside(t, hub)
  await beside.restart()
  assert.equal(await parkedRows(hub), 0)
  assert.equal((await post(hub, ana, `${url}/stop`, {})).statusCode, 204)
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
    const parts = first?.type === 'turn' ? first.message.parts : []
    assert.deepEqual(
      parts.filter((part) => part.type === type),
      [card],
    )
    assert.equal(
      (await post(hub, ana, answerUrl(url, card.toolCallId), answerOf(type))).statusCode,
      202,
    )
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
  await within(500, (async () => late.push(await stream.next()))())
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
    assert.ok([202, 409].includes(answered.statusCode), answered.body)
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
    // The answer took the card first, and the message meets the turn it goes on in; or the
    // message closed the card first, and the answer meets a closed one.
    assert.ok(
      (answered.statusCode === 202 && steered.statusCode === 409) ||
        (answered.statusCode === 409 && steered.statusCode === 202),
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
  assert.deepEqual(
    events.flatMap((event) =>
      event.type === 'part' && event.part.type === 'failure' ? [event.part.code] : [],
    ),
    ['INTERNAL_UNEXPECTED'],
  )
  assert.deepEqual(await hub.test.asOwner('select state from builder.run'), [
    { state: 'unchanged' },
  ])
  assert.equal((await sent(hub, ana, url, 'De novo')).statusCode, 202)
})
