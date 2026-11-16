import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CatalogSystem, CatalogTable, fixedRole } from '@conexus/hub-api'
import pg from 'pg'
import type { CopiesOn } from './test-copies.ts'
import { copiesOn, holdPage, plantCopy } from './test-copies.ts'

function COMPANY_SCOPE(on: CopiesOn) {
  return { kind: 'COMPANY', companyId: on.companyId, personId: null } as const
}

function tablesOf(on: CopiesOn, only: 'ALL' | { projectId: typeof on.projectId }) {
  return on.hub.test.database.read(COMPANY_SCOPE(on), (tx) =>
    on.copies.access.tables(tx, {
      ...{ companyId: on.companyId, role: fixedRole('owner') },
      place: only === 'ALL' ? { kind: 'COMPANY' } : { kind: 'PROJECT', projectId: only.projectId },
      given: new Map([[on.connectionId, 'ACTIVE']]),
    }),
  )
}

test('as tabelas da empresa com descrição, rótulo e última rodada terminada', async (t) => {
  const on = await copiesOn(t)
  const sold = await on.enable('vendas')
  await on.enable('clientes')
  assert.equal((await on.run(sold)).kind, 'ENDED')
  const tables = (await tablesOf(on, 'ALL')).map((table) => CatalogTable.parse(table))
  assert.deepEqual(
    tables.map(({ name }) => name),
    ['sankhya_clientes', 'sankhya_vendas'],
  )
  assert.ok(tables.every(({ description, label }) => description.length > 0 && label.length > 0))
  const [clients, sales] = tables
  assert.equal(clients?.kept.lastRun, null)
  assert.equal(sales?.kept.lastRun?.outcome.kind, 'COMPLETE')
  const [source] = sales?.kept.sources ?? []
  assert.equal(source?.kind, 'NAMED')
  assert.ok(source?.kind === 'NAMED')
  assert.equal(source.connection.id, on.connectionId)
  assert.equal(source.connection.connector, 'sankhya')
  assert.ok(source.connection.name.length > 0)
  assert.equal(source.state, 'ACTIVE')
})

test('as tabelas de um Projeto são as liberadas', async (t) => {
  const on = await copiesOn(t)
  await on.enable('vendas')
  const clients = await on.enable('clientes')
  await on.copies.grant({
    ...{ companyId: on.companyId, personId: on.anaId },
    ...{ projectId: on.projectId, copyId: clients },
  })
  const tables = await tablesOf(on, { projectId: on.projectId })
  assert.deepEqual(
    tables.map(({ name }) => name),
    ['sankhya_clientes'],
  )
})

test('a descrição ausente vira o rótulo', async (t) => {
  const on = await copiesOn(t)
  const copyId = await on.enable('vendas')
  await plantCopy(on, copyId, "definition = definition - 'description'")
  const [table] = await tablesOf(on, 'ALL')
  assert.ok(table)
  assert.equal(table.description, table.label)
})

test('sem last_run_id a cópia não tem última rodada', async (t) => {
  const on = await copiesOn(t)
  const copyId = await on.enable('vendas')
  assert.equal((await on.run(copyId)).kind, 'ENDED')
  const [ended] = await tablesOf(on, 'ALL')
  await plantCopy(on, copyId, 'last_run_id = null')
  const [none] = await tablesOf(on, 'ALL')
  assert.ok(ended?.kept.lastRun)
  assert.equal(none?.kept.lastRun, null)
})

test('a última rodada é a que terminou, não a que está aberta', async (t) => {
  const on = await copiesOn(t)
  const copyId = await on.enable('vendas')
  assert.equal((await on.run(copyId)).kind, 'ENDED')
  const held = holdPage(on)
  const second = on.run(copyId)
  await held.arrived
  const [table] = await tablesOf(on, 'ALL')
  held.release()
  await second
  assert.equal(table?.kept.lastRun?.outcome.kind, 'COMPLETE')
  assert.ok(table?.kept.lastRun?.endedAt)
})

test('uma cópia sem fonte viva fica fora do catálogo', async (t) => {
  const on = await copiesOn(t)
  const copyId = await on.enable('vendas')
  const client = new pg.Client({ connectionString: on.hub.test.ownerUrl.reveal() })
  await client.connect()
  try {
    await client.query('delete from copies.copy_source where copy_id = $1', [copyId])
  } finally {
    await client.end()
  }
  assert.deepEqual(await tablesOf(on, 'ALL'), [])
})

test('os sistemas da empresa', async (t) => {
  const on = await copiesOn(t)
  const { systems } = await on.hub.test.database.read(COMPANY_SCOPE(on), (tx) =>
    on.hub.connectors.access.systems(tx, { companyId: on.companyId, place: { kind: 'COMPANY' } }),
  )
  const [matriz] = systems.map((system) => CatalogSystem.parse(system))
  assert.equal(systems.length, 1)
  assert.equal(matriz?.connection, on.connectionId)
  assert.equal(matriz?.connector, 'sankhya')
  assert.ok((matriz?.reads.length ?? 0) > 0)
  const reads = new Set(matriz?.reads.map(({ operation }) => operation))
  assert.ok(matriz?.actions.every(({ operation }) => !reads.has(operation)))
})

test('uma página de uma tabela pelo nome', async (t) => {
  const on = await copiesOn(t)
  const copyId = await on.enable('vendas')
  assert.equal((await on.run(copyId)).kind, 'ENDED')
  const signal = AbortSignal.timeout(30_000)
  const page = await on.copies.data.tableRows({
    ...{ companyId: on.companyId, personId: on.anaId, name: 'sankhya_vendas', limit: 200 },
    ...{ signal, reader: { kind: 'ALL' } },
  })
  assert.equal(page.kind, 'ROWS')
  assert.ok(page.kind === 'ROWS' && page.rows.length > 0 && page.rows.length <= 200)
  const missing = await on.copies.data.tableRows({
    ...{ companyId: on.companyId, personId: on.anaId, name: 'sankhya_nada', limit: 200 },
    ...{ signal, reader: { kind: 'ALL' } },
  })
  assert.deepEqual(missing, { kind: 'NO_COPY' })
})
