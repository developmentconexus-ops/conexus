import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { call, codeOf, post } from '../../hub/identity/test-hub.ts'
import { hubBeside, MODEL } from '../conversation/test-conversation.ts'
import { sessionStateOf } from '../conversation/test-questions.ts'
import { assisting } from './test-assistant.ts'

/** The lines a Hub logs, as the tests read them. */
function capture() {
  const lines: { message: string; fields: Record<string, unknown> }[] = []
  function push(fields: Record<string, unknown>, message: string) {
    lines.push({ message, fields })
  }
  return { lines, log: { info: push, error: push } }
}

function conversationOf(response: { json(): unknown }) {
  return Object(response.json()).conversation
}

test('criar cortado depois de guardar a escolha: a mesma chave termina a mesma conversa, com a primeira escolha, e a criação fica no log uma vez (F13)', async (t) => {
  const on = await assisting(t)
  const key = randomUUID()
  const first = await post(on.hub, on.ana, on.assistant, { connections: [on.matriz] }, key)
  assert.equal(first.statusCode, 201, first.body)
  const { id } = conversationOf(first)
  // The cut: the Hub kept the choice and died before Mastra made the thread; the next Hub repeats.
  await on.hub.test.mastraPool.query('delete from mastra.mastra_threads where id = $1', [id])
  const next = capture()
  const restarted = await hubBeside(t, on.hub, next.log)
  const again = await post(restarted, on.ana, on.assistant, { connections: [] }, key)
  assert.equal(again.statusCode, 201, again.body)
  const finished = conversationOf(again)
  assert.equal(finished.id, id)
  assert.equal(finished.model, MODEL)
  assert.deepEqual(
    finished.connections.map((each: { name: string; chosen: boolean }) => [each.name, each.chosen]),
    [
      ['Matriz', true],
      ['Filial', false],
    ],
    'the first attempt’s choice, not the repeat’s',
  )
  const logged = on.lines.filter((line) => line.message === 'ASSISTANT_CONVERSATION_CREATED')
  assert.equal(logged.length, 1)
  assert.equal(
    next.lines.some((line) => line.message === 'ASSISTANT_CONVERSATION_CREATED'),
    false,
    'the repeat made nothing new',
  )
  const { traceId, ...fields } = logged[0]?.fields ?? {}
  assert.deepEqual(fields, {
    companyId: on.companyId,
    personId: on.ana.id,
    conversationId: id,
    inProject: false,
  })
  assert.match(String(traceId), /^[0-9a-f-]{36}$/, 'the request’s trace id')
})

test('criar cortado antes do modelo: a repetição põe o modelo e o raciocínio pedidos, uma vez; depois, outra repetição não os troca (F13)', async (t) => {
  const on = await assisting(t)
  const key = randomUUID()
  const body = { model: MODEL, effort: 'high', connections: [] }
  const first = await post(on.hub, on.ana, on.assistant, body, key)
  assert.equal(first.statusCode, 201, first.body)
  const { id } = conversationOf(first)
  const url = `${on.assistant}/${id}`
  assert.deepEqual(await sessionStateOf(on.hub, on.ana, url), {
    model: MODEL,
    effort: 'high',
    tasks: [],
  })
  // The cut: Mastra made the thread and the Hub died before the model was set on it.
  await on.hub.test.mastraPool.query(
    `update mastra.mastra_threads set metadata = metadata - 'currentModelId' where id = $1`,
    [id],
  )
  const restarted = await hubBeside(t, on.hub)
  const again = await post(restarted, on.ana, on.assistant, body, key)
  assert.equal(again.statusCode, 201, again.body)
  assert.equal(conversationOf(again).model, MODEL)
  const [row] = await on.hub.test.mastraPool
    .query('select metadata from mastra.mastra_threads where id = $1', [id])
    .then((result) => result.rows)
  assert.equal(row?.metadata.currentModelId, MODEL, 'the repeat set the model the cut left out')
  const other = await post(restarted, on.ana, on.assistant, { effort: 'off', connections: [] }, key)
  assert.equal(other.statusCode, 201, other.body)
  assert.equal((await sessionStateOf(restarted, on.ana, url)).effort, 'high', 'set once')
})

test('criar com um raciocínio que o modelo não tem: EFFORT_UNSUPPORTED, e nada é guardado (F13)', async (t) => {
  const on = await assisting(t)
  const refused = await post(on.hub, on.ana, on.assistant, {
    model: MODEL,
    effort: 'xhigh',
    connections: [on.matriz],
  })
  assert.deepEqual([refused.statusCode, codeOf(refused)], [422, 'EFFORT_UNSUPPORTED'])
  const kept = await on.hub.test.asOwner(
    'select count(*)::int as n from builder.assistant_conversation',
  )
  assert.deepEqual(kept, [{ n: 0 }])
})

test('o lugar da conversa vem da linha do Hub: a marca do Mastra estragada não muda a leitura nem a esconde (F15)', async (t) => {
  const on = await assisting(t)
  const made = await post(on.hub, on.ana, on.assistant, {
    projectId: on.projectId,
    connections: [on.matriz],
  })
  assert.equal(made.statusCode, 201, made.body)
  const { id } = conversationOf(made)
  await on.hub.test.mastraPool.query(
    `update mastra.mastra_threads set metadata = metadata || '{"conexusProjectId": "nao-e-um-id"}' where id = $1`,
    [id],
  )
  const read = await call(on.hub, on.ana, 'GET', `${on.assistant}/${id}`)
  assert.equal(read.statusCode, 200, read.body)
  assert.equal(conversationOf(read).projectId, on.projectId)
})
