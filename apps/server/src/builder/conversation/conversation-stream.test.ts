import assert from 'node:assert/strict'
import { once } from 'node:events'
import http from 'node:http'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import type { ConversationEvent } from '@conexus/hub-api'
import { CONVERSATION_HEARTBEAT_MS, streamConversation } from '@conexus/hub-api'
import type { Hub } from '../../hub/identity/test-hub.ts'
import { call, post } from '../../hub/identity/test-hub.ts'
import { TEST_ORIGIN } from '../../platform/test-database.ts'
import {
  conversing,
  holding,
  hubBeside,
  PARTIAL,
  rolesAndParts,
  sent,
  stalling,
  started,
  streamOf,
  title,
} from './test-conversation.ts'

/** The conversation's messages once they are `count`, read again for at most five seconds. */
async function readOnce(read: () => Promise<{ json(): unknown }>, count: number) {
  for (let attempt = 0; ; attempt += 1) {
    const messages = rolesAndParts(await read())
    if (messages.length >= count || attempt === 50) return messages
    await new Promise((done) => setTimeout(done, 100))
  }
}

/**
 * One of Mastra's tables locked, as a database that stalls: every query on it waits until `release`,
 * at the test's end at the latest. `waited` resolves once some query of the Builder waits on it.
 */
async function stalled(t: TestContext, hub: Hub, table: string) {
  const client = await hub.test.mastraPool.connect()
  await client.query('begin')
  await client.query(`lock table mastra.${table} in access exclusive mode`)
  let released: Promise<void> | undefined
  function release() {
    released ??= client.query('rollback').then(() => client.release())
    return released
  }
  t.after(release)
  async function waited() {
    for (;;) {
      const found = await hub.test.mastraPool.query(
        "select count(*)::int as count from pg_stat_activity where wait_event_type = 'Lock'",
      )
      if (found.rows[0]?.count > 0) return
      await new Promise((done) => setTimeout(done, 20))
    }
  }
  return { release, waited }
}

async function settles(promise: Promise<unknown>): Promise<boolean> {
  let settled = false
  promise.then(
    () => (settled = true),
    () => (settled = true),
  )
  for (let round = 0; round < 20; round += 1) await new Promise((done) => setImmediate(done))
  return settled
}

test('o stream diz que está vivo de 25 em 25 segundos, e o primeiro sinal vem antes de qualquer evento', async (t) => {
  const { hub, ana, conversations } = await conversing(t, () => ({ kind: 'text', text: 'ok' }))
  assert.equal(CONVERSATION_HEARTBEAT_MS, 25_000)
  assert.equal(streamConversation.success.heartbeatMs, CONVERSATION_HEARTBEAT_MS)
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  t.mock.timers.enable({ apis: ['setInterval'] })
  const stream = await streamOf(hub, ana, url)
  t.after(() => stream.close())
  await stream.until(() => stream.seen.comments === 1)
  assert.equal(stream.seen.raw, ': \n\n')
  t.mock.timers.tick(CONVERSATION_HEARTBEAT_MS - 1)
  assert.equal(await settles(stream.until(() => stream.seen.comments > 1)), false)
  t.mock.timers.tick(1)
  await stream.until(() => stream.seen.comments === 2)
  t.mock.timers.reset()
})

test('reconectar no meio de um turno: primeiro a resposta até ali, depois o resto', async (t) => {
  const held = holding(t)
  const { hub, ana, conversations } = await conversing(t, (asked) => title(asked) ?? held.reply)
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const first = await streamOf(hub, ana, url)
  t.after(() => first.close())
  assert.equal((await sent(hub, ana, url, 'Uma pergunta')).statusCode, 202)
  assert.deepEqual(await first.said(), { type: 'text', delta: PARTIAL })
  first.close()
  const again = await streamOf(hub, ana, url)
  t.after(() => again.close())
  const snapshot = await again.next()
  assert.ok(snapshot.type === 'turn')
  assert.equal(snapshot.message.role, 'builder')
  assert.deepEqual(snapshot.message.parts, [{ type: 'text', text: PARTIAL }])
  assert.ok(Date.parse(snapshot.startedAt) <= Date.now())
  assert.deepEqual(rolesAndParts(await call(hub, ana, 'GET', url)), [
    ['person', [{ type: 'text', text: 'Uma pergunta' }]],
  ])
  held.release()
  const rest = await again.turn()
  assert.deepEqual(rest.at(-1), { type: 'turnEnd', reason: 'complete' })
  assert.equal(
    rest.some((event) => event.type === 'text'),
    false,
  )
})

test('reconectar com o turno em curso e ainda mudo: o stream diz que ele trabalha', async (t) => {
  const stalled = stalling(t)
  const { hub, ana, conversations, anthropic } = await conversing(
    t,
    (asked) => title(asked) ?? stalled.reply,
  )
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  assert.equal((await sent(hub, ana, url, 'Uma pergunta')).statusCode, 202)
  while (!anthropic.sent.some((each) => each.stream))
    await new Promise((done) => setTimeout(done, 20))
  const again = await streamOf(hub, ana, url)
  t.after(() => again.close())
  const snapshot = await again.next()
  assert.ok(snapshot.type === 'turn')
  assert.deepEqual(snapshot.message.parts, [])
  stalled.release()
  assert.deepEqual((await again.turn()).at(-1), { type: 'turnEnd', reason: 'complete' })
})

test('Parar: o turno termina `aborted` e o texto até ali fica na conversa', async (t) => {
  const held = holding(t)
  const { hub, ana, conversations } = await conversing(t, (asked) => title(asked) ?? held.reply)
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const stream = await streamOf(hub, ana, url)
  t.after(() => stream.close())
  assert.equal((await sent(hub, ana, url, 'Uma pergunta')).statusCode, 202)
  assert.deepEqual(await stream.said(), { type: 'text', delta: PARTIAL })
  const stopped = await post(hub, ana, `${url}/stop`, {})
  assert.equal(stopped.statusCode, 204)
  assert.deepEqual((await stream.turn()).at(-1), { type: 'turnEnd', reason: 'aborted' })
  // Mastra saves the stopped answer just after its `agent_end`, so a read may come before it.
  assert.deepEqual(await readOnce(() => call(hub, ana, 'GET', url), 2), [
    ['person', [{ type: 'text', text: 'Uma pergunta' }]],
    ['builder', [{ type: 'text', text: PARTIAL }]],
  ])
})

test('desligar espera o turno em curso, guarda o texto e só então fecha o stream', async (t) => {
  const held = holding(t)
  const { hub, ana, conversations } = await conversing(t, (asked) => title(asked) ?? held.reply)
  const closing = await hubBeside(t, hub)
  const url = `${conversations}/${await started(closing, ana, conversations)}`
  const stream = await streamOf(closing, ana, url)
  t.after(() => stream.close())
  assert.equal((await sent(closing, ana, url, 'Uma pergunta')).statusCode, 202)
  assert.deepEqual(await stream.said(), { type: 'text', delta: PARTIAL })
  const closed = closing.close()
  assert.equal(await settles(closed), false, 'the close waits for the turn')
  assert.equal(stream.seen.ended, false)
  held.release()
  await closed
  assert.deepEqual((await stream.turn()).at(-1), { type: 'turnEnd', reason: 'complete' })
  assert.equal(await stream.ended(), true)
  assert.deepEqual(rolesAndParts(await call(hub, ana, 'GET', url)), [
    ['person', [{ type: 'text', text: 'Uma pergunta' }]],
    ['builder', [{ type: 'text', text: PARTIAL }]],
  ])
})

test('apagar o Projeto no meio de um turno: a sessão fecha, e desligar não espera um turno que já acabou', async (t) => {
  const held = holding(t)
  const { hub, ana, companyId, projectId, conversations } = await conversing(
    t,
    (asked) => title(asked) ?? held.reply,
  )
  const closing = await hubBeside(t, hub)
  const url = `${conversations}/${await started(closing, ana, conversations)}`
  const stream = await streamOf(closing, ana, url)
  t.after(() => stream.close())
  assert.equal((await sent(closing, ana, url, 'Uma pergunta')).statusCode, 202)
  assert.deepEqual(await stream.said(), { type: 'text', delta: PARTIAL })
  const project = `/api/companies/${companyId}/projects/${projectId}`
  assert.equal(
    (await call(closing, ana, 'DELETE', project, { name: 'Encomendas' })).statusCode,
    204,
  )
  const closed = closing.close()
  const late = new Promise<string>((done) => setTimeout(() => done('hung'), 10_000).unref())
  assert.equal(await Promise.race([closed.then(() => 'closed'), late]), 'closed')
})

test('o processo para no meio de um turno: a pergunta não se perde, e aparece uma vez só depois', async (t) => {
  const held = holding(t)
  const { hub, ana, conversations } = await conversing(t, (asked) => title(asked) ?? held.reply)
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const stream = await streamOf(hub, ana, url)
  t.after(() => stream.close())
  assert.equal((await sent(hub, ana, url, 'Uma pergunta que não pode sumir')).statusCode, 202)
  assert.deepEqual(await stream.said(), { type: 'text', delta: PARTIAL })
  const other = await hubBeside(t, hub)
  const asked = [['person', [{ type: 'text', text: 'Uma pergunta que não pode sumir' }]]]
  assert.deepEqual(rolesAndParts(await call(other, ana, 'GET', url)), asked)
  held.release()
  assert.deepEqual((await stream.turn()).at(-1), { type: 'turnEnd', reason: 'complete' })
  assert.deepEqual(rolesAndParts(await call(other, ana, 'GET', url)), [
    ...asked,
    ['builder', [{ type: 'text', text: PARTIAL }]],
  ])
})

test('uma pessoa com duas conversas ao mesmo tempo: sessões separadas, eventos sem mistura', async (t) => {
  const held = holding(t)
  const { hub, ana, conversations } = await conversing(
    t,
    (asked) =>
      title(asked) ??
      (asked.texts.includes('Pergunta X') ? held.reply : { kind: 'text', text: 'Resposta Y' }),
  )
  const x = `${conversations}/${await started(hub, ana, conversations)}`
  const y = `${conversations}/${await started(hub, ana, conversations)}`
  const onX = await streamOf(hub, ana, x)
  t.after(() => onX.close())
  const onY = await streamOf(hub, ana, y)
  t.after(() => onY.close())
  assert.equal((await sent(hub, ana, x, 'Pergunta X')).statusCode, 202)
  assert.deepEqual(await onX.said(), { type: 'text', delta: PARTIAL })
  assert.equal((await sent(hub, ana, y, 'Pergunta Y')).statusCode, 202)
  const ofY = await onY.turn()
  assert.deepEqual(textsOf(ofY), ['Resposta Y'])
  assert.deepEqual(ofY.at(-1), { type: 'turnEnd', reason: 'complete' })
  held.release()
  const ofX = await onX.turn()
  assert.deepEqual(textsOf(ofX), [])
  assert.deepEqual(ofX.at(-1), { type: 'turnEnd', reason: 'complete' })
  assert.doesNotMatch(onX.seen.raw, /Resposta Y/)
  assert.doesNotMatch(onY.seen.raw, new RegExp(PARTIAL))
})

function textsOf(events: ConversationEvent[]): string[] {
  return events.flatMap((event) => (event.type === 'text' ? [event.delta] : []))
}

test('o stream fecha enquanto a pergunta é guardada: a sessão fica, e o turno chega ao stream seguinte', async (t) => {
  const { hub, ana, conversations } = await conversing(
    t,
    (asked) => title(asked) ?? { kind: 'text', text: 'Resposta' },
  )
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const address = await hub.app.listen({ port: 0, host: '127.0.0.1' })
  const headers = { origin: TEST_ORIGIN, cookie: ana.cookie }
  const first = http.get(`${address}${url}/events`, { headers })
  t.after(() => first.destroy())
  await once(first, 'response')
  const threads = await stalled(t, hub, 'mastra_threads')
  const sending = sent(hub, ana, url, 'Uma pergunta')
  await threads.waited()
  first.destroy()
  await new Promise((done) => setTimeout(done, 200))
  const opening = streamOf(hub, ana, url)
  await new Promise((done) => setTimeout(done, 200))
  await threads.release()
  const second = await opening
  t.after(() => second.close())
  assert.equal((await sending).statusCode, 202)
  const events = await second.turn()
  assert.deepEqual(textsOf(events), ['Resposta'])
  assert.deepEqual(events.at(-1), { type: 'turnEnd', reason: 'complete' })
})

test('o Mastra recusa a mensagem antes do turno: INTERNAL_UNEXPECTED, e um só fim de turno', async (t) => {
  const { hub, ana, conversations } = await conversing(
    t,
    (asked) => title(asked) ?? { kind: 'text', text: 'Resposta' },
  )
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const stream = await streamOf(hub, ana, url)
  t.after(() => stream.close())
  await hub.test.mastraPool.query('alter table mastra.mastra_threads rename to mastra_threads_out')
  assert.equal((await sent(hub, ana, url, 'Uma pergunta')).statusCode, 202)
  assert.deepEqual((await stream.turn()).slice(1), [
    { type: 'part', part: { type: 'failure', code: 'INTERNAL_UNEXPECTED' } },
    { type: 'turnEnd', reason: 'error' },
  ])
  await hub.test.mastraPool.query('alter table mastra.mastra_threads_out rename to mastra_threads')
  assert.equal((await sent(hub, ana, url, 'Outra pergunta')).statusCode, 202)
  assert.deepEqual((await stream.turn()).at(-1), { type: 'turnEnd', reason: 'complete' })
  assert.equal(stream.seen.raw.match(/turnEnd/g)?.length, 2)
})
