import assert from 'node:assert/strict'
import { test } from 'node:test'
import { post } from '../../hub/identity/test-hub.ts'
import { answeredOf, hubBeside, sent } from './test-conversation.ts'
import { ask, cards, conversingWith, untilCard, WHO } from './test-questions.ts'

const PARKED = `select 1 from mastra.mastra_workflow_snapshot where snapshot->>'status' = 'suspended'`

/** Mastra drops the parked call's snapshot a moment after the turn ends. */
async function parkedGone(hub: {
  test: { mastraPool: { query(sql: string): Promise<{ rowCount: number | null }> } }
}) {
  for (
    let attempt = 0;
    attempt < 50 && (await hub.test.mastraPool.query(PARKED)).rowCount !== 0;
    attempt += 1
  ) {
    await new Promise((done) => setTimeout(done, 100))
  }
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

test('Parar com uma pergunta aberta: a chamada fecha negada, a pergunta fecha e nada fica no banco do Mastra', async (t) => {
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
  assert.equal(await parkedGone(hub), 0)
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

test('o Hub reinicia com uma pergunta aberta: a chamada fecha negada, a pergunta se lê fechada e nada fica no banco do Mastra', async (t) => {
  const { hub, ana, url, stream, send } = await conversingWith(t, [[ask(WHO)]])
  assert.equal((await send()).statusCode, 202)
  await untilCard(stream, 'question')
  assert.deepEqual(await hub.test.asOwner('select state from builder.run'), [{ state: 'waiting' }])
  await hub.test.asOwner(`update builder.run set lease_until = now() - interval '1 second'`)
  const beside = await hubBeside(t, hub)
  await beside.restart()
  assert.equal(await parkedGone(hub), 0)
  const read = (await answeredOf(beside, ana, url)).flatMap((message) => message.parts)
  assert.deepEqual(
    read.flatMap((part) => (part.type === 'question' ? [part.state] : [])),
    ['closed'],
  )
  assert.ok(read.some((part) => part.type === 'restarted'))
  // The first copy, still alive in this test, lets its parked turn go.
  assert.equal((await post(hub, ana, `${url}/stop`, {})).statusCode, 204)
})
