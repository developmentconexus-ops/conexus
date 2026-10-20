import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import type { Hub, Person } from '../../hub/identity/test-hub.ts'
import {
  BRUNO,
  call,
  codeOf,
  memberOn,
  personOn,
  plantCompany,
  post,
  problem,
} from '../../hub/identity/test-hub.ts'
import { TEST_ORIGIN } from '../../platform/test-database.ts'
import {
  conversing,
  holding,
  hubBeside,
  MODEL,
  PARTIAL,
  sent,
  started,
  streamOf,
} from './test-conversation.ts'

const DIEGO = { name: 'Diego Melo', email: 'diego@example.test' }

/** Every route of one conversation, as the person calls it. */
function routesOf(hub: Hub, person: Person, url: string) {
  const headers = { origin: TEST_ORIGIN, cookie: person.cookie }
  return [
    call(hub, person, 'GET', url),
    sent(hub, person, url, 'Olá'),
    hub.app.inject({ method: 'GET', url: `${url}/events`, headers }),
    post(hub, person, `${url}/stop`, {}),
    call(hub, person, 'PUT', `${url}/model`, { model: MODEL, effort: 'off' }),
  ]
}

test('a conversa de outra pessoa ou de outra empresa: o mesmo 404 em toda rota; Diego não recebe evento de Ana; nenhuma rota do Mastra', async (t) => {
  const { hub, ana, companyId, conversations, anthropic } = await conversing(t, (asked) => ({
    kind: 'text',
    text: asked.stream ? `Resposta a ${asked.texts.at(-1)}` : 'Título',
  }))
  const anas = `${conversations}/${await started(hub, ana, conversations)}`
  const diego = await memberOn(hub, companyId, DIEGO, 'member')
  const bruno = await personOn(hub, BRUNO)
  const companyB = await plantCompany(hub.test, bruno.id, 'Empresa B')
  const madeB = await post(hub, bruno, `/api/companies/${companyB}/projects`, { name: 'Vendas' })
  assert.equal(madeB.statusCode, 201)
  const inB = `/api/companies/${companyB}/projects/${Object(madeB.json()).project.id}/conversations`
  const anasId = anas.slice(conversations.length + 1)
  for (const [person, base] of [
    [diego, conversations],
    [bruno, inB],
    [bruno, conversations],
  ] as const) {
    const foreign = await Promise.all(routesOf(hub, person, `${base}/${anasId}`))
    const absent = await Promise.all(routesOf(hub, person, `${base}/${randomUUID()}`))
    for (const [index, response] of foreign.entries()) {
      assert.equal(response.statusCode, 404, response.body)
      assert.deepEqual(problem(response), problem(absent[index] ?? response))
    }
  }
  assert.equal(
    codeOf(await call(hub, diego, 'GET', `${conversations}/${anasId}`)),
    'CONVERSATION_NOT_FOUND',
  )
  assert.deepEqual(anthropic.sent, [], 'no route of theirs started a turn')

  const diegos = `${conversations}/${await started(hub, diego, conversations)}`
  const diegoStream = await streamOf(hub, diego, diegos)
  t.after(() => diegoStream.close())
  const anaStream = await streamOf(hub, ana, anas)
  t.after(() => anaStream.close())
  assert.equal((await sent(hub, ana, anas, 'Pergunta de Ana')).statusCode, 202)
  assert.deepEqual((await anaStream.turn()).at(-1), { type: 'turnEnd', reason: 'complete' })
  assert.equal((await sent(hub, diego, diegos, 'Pergunta de Diego')).statusCode, 202)
  const diegoEvents = await diegoStream.turn()
  assert.deepEqual(
    diegoEvents.filter((event) => event.type === 'text' || event.type === 'turnEnd'),
    [
      { type: 'text', delta: 'Resposta a Pergunta de Diego' },
      { type: 'turnEnd', reason: 'complete' },
    ],
  )
  assert.doesNotMatch(diegoStream.seen.raw, /Ana/)

  for (const path of ['/api/agents', '/api/agents/builder', '/api/memory/threads?resourceId=x']) {
    assert.equal((await call(hub, ana, 'GET', path)).statusCode, 404, path)
  }
  assert.deepEqual(anthropic.elsewhere, [], 'nothing left the process but the model calls')
})

test('toda thread tem sua linha no índice, com a empresa e a pessoa no dono do Mastra', async (t) => {
  const { hub, ana, companyId, conversations } = await conversing(t, () => ({
    kind: 'text',
    text: 'ok',
  }))
  const ids = [await started(hub, ana, conversations), await started(hub, ana, conversations)]
  const threads = await hub.test.mastraPool.query(
    'select id, "resourceId" from mastra.mastra_threads order by id',
  )
  const indexed = await hub.test.asOwner(
    'select id::text, company_id, person_id from builder.conversation order by id',
  )
  const owner = `company:${companyId}:person:${ana.id}`
  assert.deepEqual(
    threads.rows,
    [...ids].sort().map((id) => ({ id, resourceId: owner })),
  )
  assert.deepEqual(
    indexed,
    [...ids].sort().map((id) => ({ id, company_id: companyId, person_id: ana.id })),
  )
})

test('a mesma chave: uma conversa, um modelo e um turno, também depois de reiniciar; outro corpo: IDEMPOTENCY_CONFLICT', async (t) => {
  const { hub, ana, conversations, anthropic } = await conversing(t, (asked) => ({
    kind: 'text',
    text: asked.stream ? 'Resposta' : 'Título',
  }))
  const key = randomUUID()
  const first = await post(hub, ana, conversations, {}, key)
  const again = await post(hub, ana, conversations, {}, key)
  assert.equal(first.statusCode, 201)
  assert.equal(again.statusCode, 201)
  const id = String(Object(first.json()).conversation.id)
  assert.equal(Object(again.json()).conversation.id, id)
  // A late repeat runs nothing again: a default with no account now still answers the thread's model.
  const company = conversations.slice(0, conversations.indexOf('/projects/'))
  const unusable = { model: 'openai/gpt-4o-mini' }
  assert.equal((await call(hub, ana, 'PUT', `${company}/default-model`, unusable)).statusCode, 200)
  const late = await post(hub, ana, conversations, {}, key)
  assert.deepEqual([late.statusCode, Object(late.json()).conversation.model], [201, MODEL])
  const conflict = await post(hub, ana, conversations, { model: MODEL }, key)
  assert.equal(conflict.statusCode, 409)
  assert.equal(codeOf(conflict), 'IDEMPOTENCY_CONFLICT')

  const url = `${conversations}/${id}`
  const stream = await streamOf(hub, ana, url)
  t.after(() => stream.close())
  const message = randomUUID()
  assert.equal((await sent(hub, ana, url, 'Uma pergunta', message)).statusCode, 202)
  assert.deepEqual((await stream.turn()).at(-1), { type: 'turnEnd', reason: 'complete' })
  assert.equal((await sent(hub, ana, url, 'Uma pergunta', message)).statusCode, 202)
  const otherBody = await sent(hub, ana, url, 'Outra pergunta', message)
  assert.equal(otherBody.statusCode, 409)
  assert.equal(codeOf(otherBody), 'IDEMPOTENCY_CONFLICT')

  const restarted = await hubBeside(t, hub)
  const created = await post(restarted, ana, conversations, {}, key)
  assert.equal(created.statusCode, 201)
  assert.equal(Object(created.json()).conversation.id, id)
  assert.equal((await sent(restarted, ana, url, 'Uma pergunta', message)).statusCode, 202)
  assert.equal(codeOf(await sent(restarted, ana, url, 'Outra', message)), 'IDEMPOTENCY_CONFLICT')
  assert.equal(anthropic.sent.filter((each) => each.stream).length, 1, 'one turn in all')
  const read = Object((await call(restarted, ana, 'GET', url)).json()).conversation
  assert.deepEqual(
    read.messages.map((each: { role: string }) => each.role),
    ['person', 'builder'],
  )
  const rows = await hub.test.asOwner('select count(*)::int as count from builder.conversation')
  assert.deepEqual(rows, [{ count: 1 }])
})

test('um modelo sem conta que a pessoa possa usar: 422 MODEL_NO_ACCOUNT, ao criar e ao trocar', async (t) => {
  const { hub, ana, conversations, anthropic } = await conversing(t, () => ({
    kind: 'text',
    text: 'ok',
  }))
  const created = await post(hub, ana, conversations, { model: 'openai/gpt-4' })
  assert.equal(created.statusCode, 422)
  assert.equal(codeOf(created), 'MODEL_NO_ACCOUNT')
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const gpt = { model: 'openai/gpt-4', effort: 'off' }
  const switched = await call(hub, ana, 'PUT', `${url}/model`, gpt)
  assert.equal(switched.statusCode, 422)
  assert.equal(codeOf(switched), 'MODEL_NO_ACCOUNT')
  assert.equal(Object((await call(hub, ana, 'GET', url)).json()).conversation.model, MODEL)
  const rows = await hub.test.asOwner('select count(*)::int as count from builder.conversation')
  assert.deepEqual(rows, [{ count: 1 }])
  assert.deepEqual(anthropic.sent, [])
})

test('o Mastra recusa no meio de uma mensagem: 500, e a mesma chave depois faz o turno, uma vez só', async (t) => {
  const { hub, ana, conversations, anthropic } = await conversing(t, (asked) => ({
    kind: 'text',
    text: asked.stream ? 'Resposta' : 'Título',
  }))
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const key = randomUUID()
  const mastra = hub.test.mastraPool
  await mastra.query('alter table mastra.mastra_threads rename to mastra_threads_out')
  const refused = await sent(hub, ana, url, 'Uma pergunta', key)
  await mastra.query('alter table mastra.mastra_threads_out rename to mastra_threads')
  assert.equal(refused.statusCode, 500, refused.body)
  const stream = await streamOf(hub, ana, url)
  t.after(() => stream.close())
  assert.equal((await sent(hub, ana, url, 'Uma pergunta', key)).statusCode, 202)
  assert.deepEqual((await stream.turn()).at(-1), { type: 'turnEnd', reason: 'complete' })
  assert.equal((await sent(hub, ana, url, 'Uma pergunta', key)).statusCode, 202)
  assert.equal(anthropic.sent.filter((each) => each.stream).length, 1, 'one turn in all')
})

test('a conversa cuja thread o Mastra não tem: 404 CONVERSATION_NOT_FOUND, e a linha sai do índice', async (t) => {
  const { hub, ana, conversations } = await conversing(t, () => ({ kind: 'text', text: 'ok' }))
  const id = await started(hub, ana, conversations)
  await hub.test.mastraPool.query('delete from mastra.mastra_threads where id = $1', [id])
  const read = await call(hub, ana, 'GET', `${conversations}/${id}`)
  assert.equal(read.statusCode, 404)
  assert.equal(codeOf(read), 'CONVERSATION_NOT_FOUND')
  const rows = await hub.test.asOwner(
    'select count(*)::int as count from builder.conversation where id = $1',
    [id],
  )
  assert.deepEqual(rows, [{ count: 0 }])
})

test('o raciocínio chega ao modelo: "Alto" leva thinking, "Desligado" não, nível recusado é 422, a troca durante o turno vale para o próximo e o nível fica ao reiniciar', async (t) => {
  const held = holding(t)
  const { hub, ana, conversations, anthropic } = await conversing(t, (asked) => {
    if (!asked.stream) return { kind: 'text', text: 'Título' }
    return asked.texts.at(-1) === 'Segura' ? held.reply : { kind: 'text', text: 'Resposta' }
  })
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  async function effortOn(on: Hub) {
    return Object((await call(on, ana, 'GET', url)).json()).conversation.effort
  }
  function thinkings() {
    return anthropic.sent.filter((each) => each.stream).map((each) => each.thinking)
  }
  function model(effort: string) {
    return call(hub, ana, 'PUT', `${url}/model`, { model: MODEL, effort })
  }
  const HIGH = { type: 'enabled', budget_tokens: 16384 }
  assert.equal(await effortOn(hub), 'off')
  const stream = await streamOf(hub, ana, url)
  t.after(() => stream.close())

  const high = await model('high')
  assert.deepEqual([high.statusCode, high.json()], [200, { model: MODEL, effort: 'high' }])
  assert.equal((await sent(hub, ana, url, 'Pergunta')).statusCode, 202)
  await stream.turn()
  assert.deepEqual(thinkings(), [HIGH])

  const refused = await model('max')
  assert.deepEqual([refused.statusCode, codeOf(refused)], [422, 'EFFORT_UNSUPPORTED'])
  assert.equal(await effortOn(hub), 'high')

  assert.equal((await sent(hub, ana, url, 'Segura')).statusCode, 202)
  let said = await stream.said()
  while (said.type === 'title') said = await stream.said()
  assert.deepEqual(said, { type: 'text', delta: PARTIAL })
  assert.equal((await model('off')).statusCode, 200)
  held.release()
  await stream.turn()
  assert.equal((await sent(hub, ana, url, 'Depois')).statusCode, 202)
  await stream.turn()
  assert.deepEqual(thinkings(), [HIGH, HIGH, null], 'the switch held for the next turn only')

  assert.equal((await model('high')).statusCode, 200)
  const restarted = await hubBeside(t, hub)
  assert.equal(await effortOn(restarted), 'high')
  const again = await streamOf(restarted, ana, url)
  t.after(() => again.close())
  assert.equal((await sent(restarted, ana, url, 'Reiniciado')).statusCode, 202)
  await again.turn()
  assert.deepEqual(thinkings().at(-1), HIGH)
})
