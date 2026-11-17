import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { AgentId, ConversationId, PersonId } from '@conexus/hub-api'
import { call } from '../identity/test-hub.ts'
import { builderDataOn } from './test-builder-data.ts'
import { SEED } from './test-data.ts'

const SQL = 'select n from sem_chave order by n limit 3'

async function recordsOf(on: Awaited<ReturnType<typeof builderDataOn>>) {
  return on.hub.test.asOwner('select * from data.data_read where company_id = $1 order by at, id', [
    on.companyId,
  ])
}

test('a leitura do esquema do app pelo agente deixa linha', async (t) => {
  const on = await builderDataOn(t, SEED)
  const ids = on.ids(on.ana)
  const signal = AbortSignal.timeout(20_000)
  const thread = ConversationId.parse(randomUUID())
  const agentId = AgentId.parse(randomUUID())
  const builder = await on.data.read(ids, { text: SQL }, signal, thread)
  assert.ok(builder.kind === 'ROWS', JSON.stringify(builder))
  const agent = await on.hub.apps.readAppData({
    ...{ scope: { companyId: ids.companyId, personId: ids.personId } },
    ...{ projectId: ids.projectId, statement: { text: SQL }, signal, thread, agentId },
  })
  assert.ok(agent.kind === 'ROWS', JSON.stringify(agent))
  const records = await recordsOf(on)
  assert.deepEqual(
    records.map((record) => [record.agent, record.agent_id, record.thread_id]),
    [
      ['BUILDER', null, thread],
      ['AGENT', agentId, thread],
    ],
  )
  for (const record of records) {
    assert.equal(record.verb, 'QUERY')
    assert.equal(record.query, SQL)
    assert.deepEqual(record.tables, [])
    assert.equal(record.outcome, 'ROWS')
    assert.equal(record.rows, 3)
    assert.equal(record.project_id, ids.projectId)
    assert.equal(record.person_id, PersonId.parse(on.ana.id))
  }
})

test('a página Dados não entra no Registro', async (t) => {
  const on = await builderDataOn(t, SEED)
  const project = `/api/companies/${on.companyId}/projects/${on.projectId}`
  for (const route of [`${project}/tables`, `${project}/tables/sem_chave/rows`]) {
    assert.equal((await call(on.hub, on.ana, 'GET', route)).statusCode, 200, route)
  }
  assert.equal((await recordsOf(on)).length, 0)
})
