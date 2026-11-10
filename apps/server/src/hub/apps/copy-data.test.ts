import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { AppRows, AppTables, PAGE_SIZE } from '@conexus/hub-api'
import { copiesOn } from '../copies/test-copies.ts'
import { call, codeOf } from '../identity/test-hub.ts'
import { folder, MIGRATION, readyForVersions, send } from './test-versions.ts'

const VENDAS_ROWS = 183
const OWN_VENDAS = {
  id: '002_vendas',
  statements: ['CREATE TABLE vendas (id int PRIMARY KEY)', 'INSERT INTO vendas VALUES (1), (2)'],
}

/** Two copies of the Matriz ligadas and run: `vendas` released to Pedidos through the Hub's own door, `clientes` not. */
async function releasedOn(t: TestContext) {
  const on = await copiesOn(t)
  const vendas = await on.enable('vendas')
  const clientes = await on.enable('clientes')
  assert.equal((await on.run(vendas)).kind, 'ENDED')
  assert.equal((await on.run(clientes)).kind, 'ENDED')
  const release = { companyId: on.companyId, personId: on.anaId, projectId: on.projectId }
  const project = `/api/companies/${on.companyId}/projects/${on.projectId}`
  return {
    ...on,
    project,
    grant: () => on.copies.grant({ ...release, copyId: vendas }),
    revoke: () => on.copies.revoke({ ...release, copyId: vendas }),
    tables: async (at = on.ana) => {
      const response = await call(on.hub, at, 'GET', `${project}/tables`)
      assert.equal(response.statusCode, 200, response.body)
      return AppTables.parse(response.json())
    },
    rows: (door: 'tables' | 'copy-tables', table: string, page?: string, at = on.ana) =>
      call(
        on.hub,
        at,
        'GET',
        `${project}/${door}/${table}/rows${page === undefined ? '' : `?page=${page}`}`,
      ),
    app: async () => {
      await readyForVersions(t, on.hub, on.ana, on.companyId)
      const subject = { t, hub: on.hub, projects: on.projects, projectId: on.projectId }
      const sent = await send(subject, on.ana, folder({ migrations: [MIGRATION, OWN_VENDAS] }))
      assert.equal(sent.preview?.state, 'ready')
    },
  }
}

test('Dados: as cópias liberadas', async (t) => {
  const on = await releasedOn(t)
  assert.deepEqual(await on.tables(), { kind: 'NO_APP', copies: [] }, 'sem liberação e sem app')

  await on.grant()
  assert.deepEqual(
    await on.tables(),
    {
      kind: 'TABLES',
      tables: [{ schema: 'COPY', name: 'vendas', rows: { kind: 'EXACT', rows: VENDAS_ROWS } }],
    },
    'a liberada aparece, a outra não; o Projeto ganhou o esquema ao liberar',
  )

  await on.app()
  const both = await on.tables()
  assert.ok(both.kind === 'TABLES')
  assert.deepEqual(
    both.tables.map(({ schema, name, rows }) => [schema, name, rows]),
    [
      ['APP', 'recado', { kind: 'EXACT', rows: 0 }],
      ['APP', 'vendas', { kind: 'EXACT', rows: 2 }],
      ['COPY', 'vendas', { kind: 'EXACT', rows: VENDAS_ROWS }],
    ],
    'uma tabela do app e uma cópia com o mesmo nome contam cada uma as suas linhas',
  )

  await on.revoke()
  const taken = await on.tables()
  assert.ok(taken.kind === 'TABLES')
  assert.deepEqual(
    taken.tables.map(({ schema, name }) => [schema, name]),
    [
      ['APP', 'recado'],
      ['APP', 'vendas'],
    ],
    'tirada, a cópia sai da lista',
  )
})

test('Dados: Projeto sem app com liberação interrompida', async (t) => {
  const on = await releasedOn(t)
  on.hub.neon.script('ownerConnection', 'NO_ANSWER')
  await assert.rejects(
    on.grant,
    (error: unknown) => Object(error).code === 'COPY_DATABASE_UNAVAILABLE',
  )
  assert.deepEqual(
    await on.tables(),
    {
      kind: 'NO_APP',
      copies: [{ schema: 'COPY', name: 'vendas', rows: { kind: 'UNKNOWN' } }],
    },
    'a linha da liberação ficou, o app não: as cópias vêm sem contagem',
  )
  const rows = await on.rows('copy-tables', 'vendas')
  assert.deepEqual([rows.statusCode, codeOf(rows)], [404, 'NOT_FOUND'])
})

test('Dados: as linhas de uma cópia', async (t) => {
  const on = await releasedOn(t)
  await on.grant()
  await on.app()

  const first = await on.rows('copy-tables', 'vendas')
  assert.equal(first.statusCode, 200, first.body)
  const page = AppRows.parse(first.json())
  assert.equal(page.rows.length, PAGE_SIZE)
  assert.ok(page.columns.length > 0)
  assert.equal(page.next.kind, 'MORE', 'há outra página')

  let seen = page.rows.length
  let next = page.next
  while (next.kind === 'MORE') {
    const more = await on.rows('copy-tables', 'vendas', next.page)
    assert.equal(more.statusCode, 200, more.body)
    const read = AppRows.parse(more.json())
    seen += read.rows.length
    next = read.next
  }
  assert.equal(seen, VENDAS_ROWS, 'as páginas somam as linhas da cópia')

  const own = AppRows.parse((await on.rows('tables', 'vendas')).json())
  assert.equal(own.rows.length, 2, 'a tabela do app de mesmo nome segue pela sua rota')

  for (const [door, table] of [
    ['copy-tables', 'clientes'],
    ['copy-tables', 'recado'],
    ['copy-tables', 'nao_existe'],
    ['tables', 'clientes'],
  ] as const) {
    const refused = await on.rows(door, table)
    assert.deepEqual([refused.statusCode, codeOf(refused)], [404, 'NOT_FOUND'], `${door}/${table}`)
  }
  const member = await on.rows('copy-tables', 'vendas', undefined, on.carla)
  assert.deepEqual([member.statusCode, codeOf(member)], [404, 'NOT_FOUND'], 'quem só usa não vê')

  await on.revoke()
  const gone = await on.rows('copy-tables', 'vendas')
  assert.deepEqual([gone.statusCode, codeOf(gone)], [404, 'NOT_FOUND'], 'tirada, as linhas saem')
})
