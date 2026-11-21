import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { AgentId, Catalog, ConversationId, OperationId, QUERY_SQL_MAX } from '@conexus/hub-api'
import { unreachableDatabase } from '../../platform/test-database.ts'
import type { Place } from '../access/public.ts'
import { createAccess, principalFor } from '../access/public.ts'
import { readerAt } from '../access/test-principal.ts'
import type { CopiesOn } from '../copies/test-copies.ts'
import { asSync } from '../copies/test-copies.ts'
import type { RolesWorld } from '../copies/test-readers.ts'
import { rolesWorld } from '../copies/test-readers.ts'
import { ordersCopy, STORE_A, storesOn } from '../copies/test-sources.ts'
import { createCompanyData } from './public.ts'

async function world(t: TestContext) {
  return rolesWorld(t, 'PLANTED')
}

function bruno(w: RolesWorld, thread: ConversationId | null, place: Place = { kind: 'COMPANY' }) {
  const scope = readerAt({ companyId: w.on.companyId, personId: w.brunoId, place })
  return w.on.hub.data(scope, { thread })
}

async function recordsOf(on: Pick<CopiesOn, 'hub' | 'companyId'>) {
  return on.hub.test.asOwner('select * from data.data_read where company_id = $1 order by at, id', [
    on.companyId,
  ])
}

async function onlyRecord(on: Pick<CopiesOn, 'hub' | 'companyId'>) {
  const records = await recordsOf(on)
  assert.equal(records.length, 1, JSON.stringify(records))
  const [record] = records
  assert.ok(record)
  return record
}

function logOf(on: CopiesOn) {
  function line(fields: Record<string, unknown>, message: string) {
    on.hub.lines.push({ fields, message })
  }
  return { info: line, error: line }
}

function unrecordedData(w: RolesWorld, silent: Awaited<ReturnType<typeof unreachableDatabase>>) {
  const { on } = w
  const database = { ...on.hub.test.database, command: silent.command }
  const sources = { systems: on.hub.connectors.access.systems, tables: on.hub.copies.access.tables }
  return createCompanyData({
    ...{ database, identity: on.hub.identity, log: logOf(on) },
    access: createAccess({ database: on.hub.test.database, identity: on.hub.identity, sources }),
    ...{ copies: () => on.hub.copies.data, projects: on.hub.projects.ports },
    connectors: () => on.hub.connectors,
  })
}

test('a leitura de tabela deixa uma linha SAMPLE com a conversa', async (t) => {
  const w = await world(t)
  const thread = ConversationId.parse(randomUUID())
  const answer = await bruno(w, thread).read({ kind: 'TABLE', table: 'sankhya_vendas' })
  assert.equal(answer.kind, 'TABLE')
  assert.ok(answer.kind === 'TABLE')
  const record = await onlyRecord(w.on)
  assert.equal(record.person_id, w.brunoId)
  assert.equal(record.agent, 'ASSISTANT')
  assert.equal(record.verb, 'SAMPLE')
  assert.deepEqual(record.tables, ['sankhya_vendas'])
  assert.equal(record.outcome, 'TABLE')
  assert.equal(record.rows, answer.rows.length)
  assert.equal(record.thread_id, thread)
  assert.equal(record.project_id, null)
  assert.equal(record.query, null)
  await bruno(w, thread).read({ kind: 'TABLE', table: 'sankhya_vendas' })
  const both = await recordsOf(w.on)
  assert.equal(both.length, 2)
  assert.notEqual(both[0]?.id, both[1]?.id)
})

test('a consulta deixa uma linha QUERY com o texto e as tabelas', async (t) => {
  const w = await world(t)
  const sql = 'select count(*) from sync.sankhya_vendas'
  const answer = await bruno(w, null).read({ kind: 'QUERY', sql })
  assert.equal(answer.kind, 'QUERY', JSON.stringify(answer))
  assert.ok(answer.kind === 'QUERY')
  const record = await onlyRecord(w.on)
  assert.equal(record.verb, 'QUERY')
  assert.equal(record.query, sql)
  assert.deepEqual(record.tables, ['sankhya_vendas'])
  assert.equal(record.outcome, 'QUERY')
  assert.equal(record.rows, answer.rows.length)
  assert.equal(record.thread_id, null)
})

test('cada recusa deixa uma linha sem contagem', async (t) => {
  const w = await world(t)
  const data = bruno(w, null)
  const refused = [
    [{ kind: 'TABLE', table: 'nao_existe' }, 'NOT_IN_CATALOG'],
    [{ kind: 'QUERY', sql: 'select from from' }, 'QUERY_REFUSED'],
    [{ kind: 'QUERY', sql: 'select * from sync.sankhya_clientes' }, 'NOT_IN_ROLE'],
  ] as const
  for (const [request, kind] of refused) {
    const answer = await data.read(request)
    assert.equal(answer.kind, kind, JSON.stringify(answer))
  }
  const sources = {
    systems: w.on.hub.connectors.access.systems,
    tables: w.on.hub.copies.access.tables,
  }
  const silent = createCompanyData({
    ...{ database: w.on.hub.test.database, identity: w.on.hub.identity, log: logOf(w.on) },
    access: createAccess({
      database: await unreachableDatabase(t),
      identity: w.on.hub.identity,
      sources,
    }),
    ...{ copies: () => w.on.hub.copies.data, projects: w.on.hub.projects.ports },
    connectors: () => w.on.hub.connectors,
  })
  const scope = readerAt({
    companyId: w.on.companyId,
    personId: w.brunoId,
    place: { kind: 'COMPANY' },
  })
  const unavailable = await silent(scope, { thread: null }).read({
    kind: 'TABLE',
    table: 'sankhya_vendas',
  })
  assert.equal(unavailable.kind, 'CATALOG_UNAVAILABLE')
  const records = await recordsOf(w.on)
  assert.deepEqual(
    records.map(({ outcome }) => outcome),
    ['NOT_IN_CATALOG', 'QUERY_REFUSED', 'NOT_IN_ROLE', 'CATALOG_UNAVAILABLE'],
  )
  for (const record of records) assert.equal(record.rows, null)
})

test('a linha não guarda nenhum valor lido', async (t) => {
  const w = await world(t)
  await asSync(w.on.owner, (client) =>
    client.query(`update sync.sankhya_vendedores set "APELIDO" = 'MARCA-' || "CODVEND"::text`),
  )
  const data = bruno(w, null)
  const table = await data.read({ kind: 'TABLE', table: 'sankhya_vendedores' })
  assert.ok(JSON.stringify(table).includes('MARCA-'), 'the marked values are read')
  const query = await data.read({
    kind: 'QUERY',
    sql: 'select "APELIDO" from sync.sankhya_vendedores',
  })
  assert.ok(JSON.stringify(query).includes('MARCA-'), 'the marked values are read')
  const records = await recordsOf(w.on)
  assert.equal(records.length, 2)
  assert.ok(!JSON.stringify(records).includes('MARCA-'))
})

test('sem linha no Registro, nenhuma linha de dado', async (t) => {
  const w = await world(t)
  const scope = readerAt({
    companyId: w.on.companyId,
    personId: w.brunoId,
    place: { kind: 'COMPANY' },
  })
  const data = unrecordedData(w, await unreachableDatabase(t))(scope, { thread: null })
  const sql = 'select count(*) from sync.sankhya_vendas'
  assert.deepEqual(await data.read({ kind: 'TABLE', table: 'sankhya_vendas' }), {
    kind: 'TABLE_UNAVAILABLE',
  })
  assert.deepEqual(await data.read({ kind: 'QUERY', sql }), { kind: 'TABLE_UNAVAILABLE' })
  assert.equal((await recordsOf(w.on)).length, 0)
  const lines = w.on.hub.lines.filter(({ message }) => message === 'DATA_READ_UNRECORDED')
  assert.equal(lines.length, 2)
  assert.deepEqual(
    lines.map(({ fields }) => [fields.companyId, fields.verb]),
    [
      [w.on.companyId, 'SAMPLE'],
      [w.on.companyId, 'QUERY'],
    ],
  )
  assert.ok(!JSON.stringify(lines).includes(sql))
})

test('descrever não grava', async (t) => {
  const w = await world(t)
  const described = await bruno(w, null).describe()
  assert.equal(described.kind, 'CATALOG')
  assert.equal((await recordsOf(w.on)).length, 0)
})

test('a leitura de operação deixa exatamente uma linha', async (t) => {
  const on = await storesOn(t, { stores: [STORE_A] })
  const copyId = await on.planted('pedidos', ordersCopy(false), [STORE_A.ref])
  await on.ended(copyId)
  const connection = on.stores.get(STORE_A.ref)
  assert.ok(connection)
  const data = on.hub.data(
    readerAt({ companyId: on.companyId, personId: on.anaId, place: { kind: 'COMPANY' } }),
    {
      thread: null,
    },
  )
  const operation = OperationId.parse('pedidos')
  const served = await data.read({ kind: 'OPERATION', connection, operation, input: {} })
  assert.equal(served.kind, 'TABLE', JSON.stringify(served))
  const sample = await onlyRecord(on)
  assert.equal(sample.verb, 'SAMPLE')
  assert.deepEqual(sample.tables, ['pedidos'])
  assert.equal(sample.connection_id, null)
  const other = OperationId.parse('naoExiste')
  const refused = await data.read({ kind: 'OPERATION', connection, operation: other, input: {} })
  assert.equal(refused.kind, 'NOT_IN_CATALOG')
  const [system] = Catalog.parse(await data.describe()).systems
  const reached = system?.reads.find((read) => read.operation !== 'pedidos')
  assert.ok(reached, 'the catalog offers a live read the copy does not serve')
  const toTheSystem = await data.read({
    ...{ kind: 'OPERATION', connection, input: {} },
    operation: OperationId.parse(reached.operation),
  })
  assert.equal(toTheSystem.kind, 'NOT_GRANTED')
  const records = await recordsOf(on)
  assert.equal(records.length, 3, 'every read asked leaves its row, the one with no turn too')
  const [, notInCatalog, ungranted] = records
  for (const [live, operation, outcome] of [
    [notInCatalog, other, 'NOT_IN_CATALOG'],
    [ungranted, reached.operation, 'NOT_GRANTED'],
  ] as const) {
    assert.equal(live?.verb, 'LIVE')
    assert.equal(live?.connection_id, connection)
    assert.deepEqual([live?.operation, live?.outcome, live?.rows], [operation, outcome, null])
    assert.deepEqual(live?.tables, [])
  }
})

test('o agente e o Projeto da linha vêm do principal', async (t) => {
  const w = await world(t)
  const { companyId, projectId } = w.on
  const personId = w.brunoId
  const agentId = AgentId.parse(randomUUID())
  const declared = [{ connectionId: w.on.connectionId, operation: OperationId.parse('pedidos') }]
  const place: Place = { kind: 'PROJECT', projectId }
  const asked = [
    [
      principalFor({
        consumer: 'assistant',
        companyId,
        personId,
        place: { kind: 'COMPANY' },
        choice: { kind: 'ANY' },
      }),
      {},
      'ASSISTANT',
      null,
    ],
    [
      principalFor({ consumer: 'builder', companyId, personId, projectId }),
      {},
      'BUILDER',
      projectId,
    ],
    [
      principalFor({ consumer: 'construtor', companyId, personId, projectId }),
      {},
      'CONSTRUTOR',
      projectId,
    ],
    [
      principalFor({
        consumer: 'agent',
        companyId,
        personId,
        place,
        declared,
        choice: { kind: 'ANY' },
      }),
      { agentId },
      'AGENT',
      projectId,
    ],
  ] as const
  for (const [principal, context] of asked) {
    await w.on.hub
      .data(principal, { thread: null, ...context })
      .read({ kind: 'TABLE', table: 'nao_existe' })
  }
  const records = await recordsOf(w.on)
  assert.deepEqual(
    records.map((record) => [record.agent, record.project_id, record.agent_id]),
    asked.map(([, context, agent, project]) => [
      agent,
      project,
      'agentId' in context ? agentId : null,
    ]),
  )
  await assert.rejects(
    w.on.hub.test.asOwner(
      `insert into data.data_read (id, company_id, at, person_id, agent, verb, tables, outcome, ms)
        values ($1, $2, now(), $3, 'OUTRO', 'SAMPLE', '{}', 'TABLE', 0)`,
      [randomUUID(), companyId, personId],
    ),
    /data_read_agent/,
  )
})

test('a consulta no limite cabe na linha', async (t) => {
  const w = await world(t)
  const head = 'select count(*) from sync.sankhya_vendas /*'
  const sql = `${head}${'x'.repeat(QUERY_SQL_MAX - head.length - 2)}*/`
  assert.equal(sql.length, QUERY_SQL_MAX)
  const answer = await bruno(w, null).read({ kind: 'QUERY', sql })
  assert.equal(answer.kind, 'QUERY', JSON.stringify(answer))
  const record = await onlyRecord(w.on)
  assert.equal(record.query, sql)
})
