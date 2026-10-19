import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Hub } from '../../hub/identity/test-hub.ts'
import { BRUNO, call, codeOf, memberOn, personOn, post } from '../../hub/identity/test-hub.ts'
import { conversing, sent, started, streamOf } from './test-conversation.ts'

/** A conversation with one turn, so Mastra holds its thread, its messages and its title. */
async function conversed(hub: Hub, person: Parameters<typeof started>[1], conversations: string) {
  const id = await started(hub, person, conversations)
  const url = `${conversations}/${id}`
  const stream = await streamOf(hub, person, url)
  assert.equal((await sent(hub, person, url, 'Oi')).statusCode, 202)
  await stream.turn()
  stream.close()
  return id
}

/** What Mastra and the index still hold of a conversation. */
async function held(hub: Hub, id: string) {
  const mastra = await hub.test.mastraPool.query(
    `select
      (select count(*)::int from mastra.mastra_threads where id = $1) as threads,
      (select count(*)::int from mastra.mastra_messages where thread_id = $1) as messages`,
    [id],
  )
  const index = await hub.test.asOwner(
    'select count(*)::int as rows from builder.conversation where id = $1',
    [id],
  )
  return { ...mastra.rows[0], ...index[0] }
}

const GONE = { threads: 0, messages: 0, rows: 0 }
// The Central's operator, who deletes clients.
const OLGA = { name: 'Olga Souza', email: 'olga@example.test', role: 'admin' }

/** Mastra's threads out of reach, as when its database refuses: only its own login can do this. */
async function mastraOut(hub: Hub) {
  await hub.test.mastraPool.query('alter table mastra.mastra_threads rename to mastra_threads_out')
  async function back() {
    await hub.test.mastraPool.query(
      'alter table mastra.mastra_threads_out rename to mastra_threads',
    )
  }
  return back
}

test('apagar o Projeto: as threads e a memória saem antes das linhas; o Mastra fora deixa o Projeto pendente', async (t) => {
  const { hub, ana, companyId, projectId, conversations } = await conversing(t, () => ({
    kind: 'text',
    text: 'Olá',
  }))
  const projects = `/api/companies/${companyId}/projects`
  const other = await post(hub, ana, projects, { name: 'Estoque' })
  const otherId = String(Object(other.json()).project.id)
  const kept = await conversed(hub, ana, conversations)
  const gone = await conversed(hub, ana, `${projects}/${otherId}/conversations`)
  const back = await mastraOut(hub)
  const pending = await call(hub, ana, 'DELETE', `${projects}/${projectId}`, { name: 'Encomendas' })
  assert.deepEqual([pending.statusCode, codeOf(pending)], [503, 'PROJECT_DELETION_PENDING'])
  await back()
  assert.deepEqual(await held(hub, kept), { threads: 1, messages: 2, rows: 1 })
  assert.equal((await call(hub, ana, 'GET', `${projects}/${projectId}`)).statusCode, 404)
  const deleted = await call(hub, ana, 'DELETE', `${projects}/${otherId}`, { name: 'Estoque' })
  assert.equal(deleted.statusCode, 204)
  assert.deepEqual(await held(hub, gone), GONE)
})

test('tirar a pessoa: as conversas dela saem antes; o Mastra fora: PERSON_REMOVAL_PENDING e ela fica', async (t) => {
  const { hub, ana, companyId, conversations } = await conversing(t, () => ({
    kind: 'text',
    text: 'Olá',
  }))
  const bruno = await memberOn(hub, companyId, BRUNO, 'member')
  const mine = await conversed(hub, ana, conversations)
  const his = await conversed(hub, bruno, conversations)
  const member = `/api/companies/${companyId}/members/${bruno.id}`
  const back = await mastraOut(hub)
  const pending = await call(hub, ana, 'DELETE', member)
  assert.deepEqual([pending.statusCode, codeOf(pending)], [503, 'PERSON_REMOVAL_PENDING'])
  await back()
  assert.equal((await held(hub, his)).rows, 1)
  assert.equal((await call(hub, ana, 'DELETE', member)).statusCode, 204)
  assert.deepEqual(await held(hub, his), GONE)
  assert.equal((await held(hub, mine)).threads, 1)
})

test('apagar o cliente: as conversas da empresa saem antes; o Mastra fora: CLIENT_DELETION_PENDING e a mesma rota termina', async (t) => {
  const {
    hub,
    companyId,
    conversations,
    ana: owner,
  } = await conversing(t, () => ({
    kind: 'text',
    text: 'Olá',
  }))
  const operator = await personOn(hub, OLGA)
  await hub.test.asOwner(
    `insert into operations.client (company_id, cnpj, legal_name, attempt_key, registered_at)
     values ($1, '00000000000001', 'Empresa Teste Ltda', $1, now())`,
    [companyId],
  )
  const id = await conversed(hub, owner, conversations)
  const client = `/api/clients/${companyId}`
  const body = { name: 'Empresa Teste', revision: 0 }
  const back = await mastraOut(hub)
  const pending = await call(hub, operator, 'DELETE', client, body)
  assert.deepEqual([pending.statusCode, codeOf(pending)], [503, 'CLIENT_DELETION_PENDING'])
  await back()
  assert.equal((await held(hub, id)).threads, 1)
  assert.equal((await call(hub, operator, 'DELETE', client, body)).statusCode, 204)
  assert.deepEqual(await held(hub, id), GONE)
})
