import assert from 'node:assert/strict'
import { once } from 'node:events'
import http from 'node:http'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import type { Hub } from '../../hub/identity/test-hub.ts'
import { call, post } from '../../hub/identity/test-hub.ts'
import type { Reply } from '../../platform/test-anthropic.ts'
import { TEST_ORIGIN } from '../../platform/test-database.ts'
import {
  conversing,
  endOf,
  holding,
  hubBeside,
  PARTIAL,
  rolesAndParts,
  sent,
  sessionUrl,
  started,
  stopped,
  streamOf,
  title,
} from './test-conversation.ts'
import { textsOf } from './test-parts.ts'

/** A provider answer that sends nothing until released, at the test's end at the latest. */
function stalling(t: TestContext) {
  const stall = Promise.withResolvers<void>()
  t.after(() => stall.resolve())
  const reply: Reply = { kind: 'hold', until: stall.promise }
  return { reply, release: () => stall.resolve() }
}

/** The conversation's messages once they are `count`, read again for at most five seconds. */
async function readOnce(read: () => Promise<unknown[]>, count: number) {
  for (let attempt = 0; ; attempt += 1) {
    const messages = await read()
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

test('o stream abre com a semente do estado da sessão; reconectar no meio de um turno relê a transcrição e segue o resto (31)', async (t) => {
  const held = holding(t)
  const { hub, ana, conversations } = await conversing(t, (asked) => title(asked) ?? held.reply)
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const first = await streamOf(hub, ana, url)
  t.after(() => first.close())
  assert.equal((await first.seed()).isRunning, false)
  assert.equal((await sent(hub, ana, url, 'Uma pergunta')).statusCode, 200)
  assert.equal(await first.text(), PARTIAL)
  first.close()
  const again = await streamOf(hub, ana, url)
  t.after(() => again.close())
  const seed = await again.seed()
  assert.equal(seed.isRunning, true)
  assert.deepEqual(
    seed.currentMessage?.content.parts.flatMap((part) => (part.type === 'text' ? [part.text] : [])),
    [PARTIAL],
  )
  held.release()
  const rest = await again.turn()
  assert.equal(endOf(rest), 'complete')
  assert.deepEqual(await rolesAndParts(hub, ana, url), [
    ['person', [{ type: 'text', text: 'Uma pergunta' }]],
    ['builder', [{ type: 'text', text: PARTIAL }]],
  ])
})

test('reconectar com o turno em curso e ainda mudo: a semente diz que ele trabalha', async (t) => {
  const stalled = stalling(t)
  const { hub, ana, conversations, anthropic } = await conversing(
    t,
    (asked) => title(asked) ?? stalled.reply,
  )
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  assert.equal((await sent(hub, ana, url, 'Uma pergunta')).statusCode, 200)
  while (!anthropic.sent.some((each) => each.stream))
    await new Promise((done) => setTimeout(done, 20))
  const again = await streamOf(hub, ana, url)
  t.after(() => again.close())
  assert.equal((await again.seed()).isRunning, true)
  stalled.release()
  assert.equal(endOf(await again.turn()), 'complete')
})

test('Parar: o turno termina `aborted` e o texto até ali fica na conversa', async (t) => {
  const held = holding(t)
  const { hub, ana, conversations } = await conversing(t, (asked) => title(asked) ?? held.reply)
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const stream = await streamOf(hub, ana, url)
  t.after(() => stream.close())
  assert.equal((await sent(hub, ana, url, 'Uma pergunta')).statusCode, 200)
  assert.equal(await stream.text(), PARTIAL)
  assert.equal((await stopped(hub, ana, url)).statusCode, 200)
  assert.equal(endOf(await stream.turn()), 'aborted')
  // Mastra saves the stopped answer just after its `agent_end`, so a read may come before it.
  assert.deepEqual(await readOnce(() => rolesAndParts(hub, ana, url), 2), [
    ['person', [{ type: 'text', text: 'Uma pergunta' }]],
    ['builder', [{ type: 'text', text: PARTIAL }]],
  ])
})

/**
 * Mastra 1.79 saves a stopped answer in its memory's output processor, after the run's `agent_end`,
 * and offers no public wait for that save (`memory.settled()` joins only background work), so the
 * close can end before it and the pool's end then loses the text. Factory and Mastra Code do the
 * same at shutdown. Remove the option when Mastra gives the wait.
 */
const MASTRA_SHUTDOWN_GAP =
  'Mastra 1.79 saves a stopped answer after agent_end, with no public wait for the save'

test('desligar para o turno em curso como Parar, guarda o texto e só então fecha o stream', {
  timeout: 60_000,
  todo: MASTRA_SHUTDOWN_GAP,
}, async (t) => {
  const held = holding(t)
  const { hub, ana, conversations } = await conversing(t, (asked) => title(asked) ?? held.reply)
  const closing = await hubBeside(t, hub)
  const url = `${conversations}/${await started(closing, ana, conversations)}`
  const stream = await streamOf(closing, ana, url)
  t.after(() => stream.close())
  assert.equal((await sent(closing, ana, url, 'Uma pergunta')).statusCode, 200)
  assert.equal(await stream.text(), PARTIAL)
  const closed = closing.close()
  assert.equal(endOf(await stream.turn()), 'aborted')
  await closed
  await stream.until(() => stream.seen.ended)
  assert.deepEqual(await rolesAndParts(hub, ana, url), [
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
  assert.equal((await sent(closing, ana, url, 'Uma pergunta')).statusCode, 200)
  assert.equal(await stream.text(), PARTIAL)
  const project = `/api/companies/${companyId}/projects/${projectId}`
  assert.equal(
    (await call(closing, ana, 'DELETE', project, { name: 'Encomendas' })).statusCode,
    204,
  )
  const closed = closing.close()
  const late = new Promise<string>((done) => setTimeout(() => done('hung'), 10_000).unref())
  assert.equal(await Promise.race([closed.then(() => 'closed'), late]), 'closed')
})

test('outro processo lê o turno em curso: nada do primeiro passo antes do fim, e a pergunta uma vez só depois', async (t) => {
  const held = holding(t)
  const { hub, ana, conversations } = await conversing(t, (asked) => title(asked) ?? held.reply)
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const stream = await streamOf(hub, ana, url)
  t.after(() => stream.close())
  assert.equal((await sent(hub, ana, url, 'Uma pergunta que não pode sumir')).statusCode, 200)
  assert.equal(await stream.text(), PARTIAL)
  const other = await hubBeside(t, hub)
  // Mastra saves a run's messages from its second step on (30).
  assert.deepEqual(await rolesAndParts(other, ana, url), [])
  held.release()
  assert.equal(endOf(await stream.turn()), 'complete')
  assert.deepEqual(await rolesAndParts(other, ana, url), [
    ['person', [{ type: 'text', text: 'Uma pergunta que não pode sumir' }]],
    ['builder', [{ type: 'text', text: PARTIAL }]],
  ])
})

test('uma pessoa com duas conversas ao mesmo tempo: sessões separadas, eventos sem mistura', async (t) => {
  const held = holding(t)
  const { hub, ana, companyId, conversations } = await conversing(
    t,
    (asked) =>
      title(asked) ??
      (asked.texts.includes('Pergunta X') ? held.reply : { kind: 'text', text: 'Resposta Y' }),
  )
  // Two Projetos: one Projeto runs one turn at a time (decision D5).
  const other = await post(hub, ana, `/api/companies/${companyId}/projects`, { name: 'Pedidos' })
  const otherId = String(Object(other.json()).project.id)
  const x = `${conversations}/${await started(hub, ana, conversations)}`
  const inOther = `/api/companies/${companyId}/projects/${otherId}/conversations`
  const y = `${inOther}/${await started(hub, ana, inOther)}`
  const onX = await streamOf(hub, ana, x)
  t.after(() => onX.close())
  const onY = await streamOf(hub, ana, y)
  t.after(() => onY.close())
  assert.equal((await sent(hub, ana, x, 'Pergunta X')).statusCode, 200)
  assert.equal(await onX.text(), PARTIAL)
  assert.equal((await sent(hub, ana, y, 'Pergunta Y')).statusCode, 200)
  const ofY = await onY.turn()
  assert.deepEqual(textsOf(ofY), ['Resposta Y'])
  assert.equal(endOf(ofY), 'complete')
  held.release()
  const ofX = await onX.turn()
  assert.deepEqual(textsOf(ofX), [])
  assert.equal(endOf(ofX), 'complete')
  assert.doesNotMatch(onX.seen.raw, /Resposta Y/)
  assert.doesNotMatch(onY.seen.raw, new RegExp(PARTIAL))
})

test('o stream fecha enquanto a pergunta é guardada: a sessão fica, e o turno chega ao stream seguinte', async (t) => {
  const { hub, ana, conversations } = await conversing(
    t,
    (asked) => title(asked) ?? { kind: 'text', text: 'Resposta' },
  )
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const address = await hub.app.listen({ port: 0, host: '127.0.0.1' })
  const headers = { origin: TEST_ORIGIN, cookie: ana.cookie }
  const arrived = once(hub.app.server, 'request')
  const first = http.get(`${address}${sessionUrl(url)}/stream`, { headers })
  t.after(() => first.destroy())
  await once(first, 'response')
  const [, response] = await arrived
  assert.ok(response instanceof http.ServerResponse)
  const threads = await stalled(t, hub, 'mastra_threads')
  const sending = sent(hub, ana, url, 'Uma pergunta')
  await threads.waited()
  first.destroy()
  // The server sees the close, which ends the stream's signal, while the question waits on the lock.
  await once(response, 'close')
  const opening = streamOf(hub, ana, url)
  await threads.release()
  const second = await opening
  t.after(() => second.close())
  assert.equal((await sending).statusCode, 200)
  const events = await second.turn()
  assert.deepEqual(textsOf(events), ['Resposta'])
  assert.equal(endOf(events), 'complete')
})

test('desligar com um stream ainda na verificação da sessão: o Hub fecha mesmo assim', async (t) => {
  const { hub, ana, conversations } = await conversing(
    t,
    (asked) => title(asked) ?? { kind: 'text', text: 'Resposta' },
  )
  const closing = await hubBeside(t, hub)
  const url = `${conversations}/${await started(closing, ana, conversations)}`
  const address = await closing.app.listen({ port: 0, host: '127.0.0.1' })
  const threads = await stalled(t, hub, 'mastra_threads')
  const headers = { origin: TEST_ORIGIN, cookie: ana.cookie }
  const stream = http.get(`${address}${sessionUrl(url)}/stream`, { headers })
  stream.on('error', () => stream.destroy())
  t.after(() => stream.destroy())
  await threads.waited()
  const closed = closing.close()
  // The Hub's own streams are closed once its server stops listening; the guard then lets this one in.
  while (closing.app.server.listening) await new Promise((done) => setTimeout(done, 20))
  await threads.release()
  const late = new Promise<string>((done) => setTimeout(() => done('hung'), 30_000).unref())
  assert.equal(await Promise.race([closed.then(() => 'closed'), late]), 'closed')
})

test('desligar com um pedido comum ainda em curso: ele termina antes de o Hub fechar', async (t) => {
  const { hub, ana, conversations } = await conversing(
    t,
    (asked) => title(asked) ?? { kind: 'text', text: 'Resposta' },
  )
  const closing = await hubBeside(t, hub)
  const conversationId = await started(closing, ana, conversations)
  const url = `${conversations}/${conversationId}`
  const address = await closing.app.listen({ port: 0, host: '127.0.0.1' })
  const threads = await stalled(t, hub, 'mastra_threads')
  const headers = { origin: TEST_ORIGIN, cookie: ana.cookie }
  const read = http.get(`${address}${sessionUrl(url)}/threads/${conversationId}/messages`, {
    headers,
  })
  t.after(() => read.destroy())
  const answered = once(read, 'response')
  await threads.waited()
  const closed = closing.close()
  while (closing.app.server.listening) await new Promise((done) => setTimeout(done, 20))
  await new Promise((done) => setTimeout(done, 1_000))
  await threads.release()
  const [response] = await answered
  assert.ok(response instanceof http.IncomingMessage)
  assert.equal(response.statusCode, 200)
  response.resume()
  await once(response, 'end')
  // Well inside the 5 s window: the idle sweep closes the read's kept-alive connection at once.
  const late = new Promise<string>((done) => setTimeout(() => done('late'), 2_000).unref())
  assert.equal(await Promise.race([closed.then(() => 'closed'), late]), 'closed')
})
