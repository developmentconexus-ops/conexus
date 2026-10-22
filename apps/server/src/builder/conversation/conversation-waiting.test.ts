import assert from 'node:assert/strict'
import { test } from 'node:test'
import { post } from '../../hub/identity/test-hub.ts'
import { answeredOf, hubBeside, sent } from './test-conversation.ts'
import { ask, cards, conversingWith, SUBMIT, untilCard, WHO, WRITE_PLAN } from './test-questions.ts'

const PARKED = `select 1 from mastra.mastra_workflow_snapshot where snapshot->>'status' = 'suspended'`

/**
 * Mastra 1.78.0 can write the parked run's snapshot after the release that deletes it, so a row
 * may outlive the turn (reported to Mastra, feedback id 6edddc96-17b5-4e31-a6df-986c1598d366).
 * The tests that own the leftover row are `todo`: remove the option when Mastra's fix lands.
 */
const MASTRA_RACE =
  'Mastra 1.78.0 can recreate the parked snapshot after abort (report 6edddc96-17b5-4e31-a6df-986c1598d366)'

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
