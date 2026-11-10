import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { AppRows, AppTables, CELL_CHARACTERS } from '@conexus/hub-api'
import { unreachableDatabaseUrl } from '../../platform/test-database.ts'
import type { Person } from '../identity/test-hub.ts'
import { call, codeOf, memberOn, personOn, plantCompany, post } from '../identity/test-hub.ts'
import { ATENDENTE } from '../identity/test-roles.ts'
import { companyForVersions, folder, MIGRATION, send } from './test-versions.ts'

const DAVI = { name: 'Davi Costa', email: 'davi@example.test' }
const CARLA = { name: 'Carla Dias', email: 'carla@example.test' }
const DORA = { name: 'Dora Reis', email: 'dora@example.test' }
const EDU = { name: 'Edu Lima', email: 'edu@example.test' }
const CLIENTES = 'clientes'
const QUOTED = 'a"b c'

function columns(count: number, type: string) {
  return Array.from({ length: count }, (_, at) => `c${at + 1} ${type}`).join(', ')
}

/** The tables of the app of a Projeto that has stored clients: a key, a composite key, none, nothing. */
const SEED = {
  id: '002_dados',
  statements: [
    `CREATE TABLE ${CLIENTES} (id int PRIMARY KEY, nome text NOT NULL)`,
    `INSERT INTO ${CLIENTES} SELECT n, 'cliente ' || n FROM generate_series(10001, 1, -1) AS n`,
    'CREATE TABLE item_pedido (pedido int, item int, qtd int, PRIMARY KEY (item, pedido))',
    'INSERT INTO item_pedido SELECT p, i, p * i FROM generate_series(3, 1, -1) p, generate_series(40, 1, -1) i',
    'CREATE TABLE sem_chave (n int, texto text)',
    "INSERT INTO sem_chave SELECT n, 'linha ' || n FROM generate_series(1, 120) AS n",
    'CREATE TABLE vazia (id int PRIMARY KEY, nota text)',
    `CREATE TABLE "${QUOTED.replaceAll('"', '""')}" (id int PRIMARY KEY)`,
    `INSERT INTO "${QUOTED.replaceAll('"', '""')}" VALUES (1)`,
    'CREATE TABLE tipos (id int PRIMARY KEY, n numeric(12,3), quando timestamptz, ok boolean, doc jsonb, bin bytea)',
    `INSERT INTO tipos VALUES (1, 12.5, '2026-11-09 12:00:00+00', true, '{"a": 1, "b": [1, 2]}', '\\xdeadbeef'), (2, NULL, NULL, NULL, NULL, NULL)`,
  ],
}

const WIDE_TEXT = {
  id: '003_texto_longo',
  statements: [
    `CREATE TABLE texto_longo (id int PRIMARY KEY, ${columns(30, 'text')})`,
    `INSERT INTO texto_longo SELECT n, ${Array.from({ length: 30 }, () => "repeat('x', 24000)").join(', ')} FROM generate_series(1, 52) AS n`,
  ],
}

const WIDE_COLUMNS = {
  id: '003_colunas',
  statements: [
    `CREATE TABLE colunas (id int PRIMARY KEY, ${columns(200, 'text')})`,
    `INSERT INTO colunas SELECT n, ${Array.from({ length: 200 }, () => "repeat('é', 100)").join(', ')} FROM generate_series(1, 60) AS n`,
  ],
}

/** Empresa A with its Projeto Pedidos, whose app holds the seed's tables, and every role that may or may not look. */
async function dataOn(t: TestContext, ...more: (typeof SEED)[]) {
  const on = await companyForVersions(t)
  const { hub, companyId } = on
  const sent = await send(on, on.ana, folder({ migrations: [MIGRATION, SEED, ...more] }))
  assert.equal(sent.preview?.state, 'ready')
  const admin = await memberOn(hub, companyId, CARLA, 'admin')
  const developer = await memberOn(hub, companyId, DORA, 'developer')
  const base = `/api/companies/${companyId}`
  const project = `${base}/projects/${on.projectId}`
  function tables(person: Person, at = project) {
    return call(hub, person, 'GET', `${at}/tables`)
  }
  function rows(person: Person, table: string, page?: string, at = project) {
    const query = page === undefined ? '' : `?page=${page}`
    return call(hub, person, 'GET', `${at}/tables/${encodeURIComponent(table)}/rows${query}`)
  }
  async function page(table: string, token?: string) {
    const response = await rows(on.ana, table, token)
    assert.equal(response.statusCode, 200, response.body)
    return AppRows.parse(response.json())
  }
  return { ...on, admin, developer, base, project, tables, rows, page }
}

function token(offset: number) {
  return Buffer.from(String(offset)).toString('base64url')
}

function withoutTrace(response: { json(): unknown }) {
  const { traceId: _, ...rest } = Object(response.json())
  return rest
}

test('dados: quem vê e quem recebe não encontrado', async (t) => {
  const on = await dataOn(t)
  const { hub, base } = on
  await post(hub, on.ana, `${base}/roles`, ATENDENTE)
  const davi = await memberOn(hub, on.companyId, DAVI, 'member')
  const atendente = await memberOn(
    hub,
    on.companyId,
    { ...DORA, email: 'atendente@example.test' },
    'atendente',
  )
  const edu = await personOn(hub, EDU)
  await plantCompany(hub.test, edu.id, 'Empresa B', 'empresa-b')
  for (const person of [on.ana, on.admin, on.developer]) {
    assert.equal((await on.tables(person)).statusCode, 200)
    assert.equal((await on.rows(person, 'sem_chave')).statusCode, 200)
  }
  const missing = `${base}/projects/${randomUUID().replaceAll('-', '')}`
  const unknown = withoutTrace(await on.tables(on.ana, missing))
  assert.equal(unknown.code, 'NOT_FOUND')
  for (const person of [davi, atendente, edu, on.bruno]) {
    const refused = [await on.tables(person), await on.rows(person, 'sem_chave')]
    for (const response of refused) {
      assert.deepEqual([response.statusCode, codeOf(response)], [404, 'NOT_FOUND'])
      assert.deepEqual(withoutTrace(response), unknown)
    }
  }
  const noProject = await on.rows(on.ana, 'sem_chave', undefined, missing)
  assert.deepEqual(withoutTrace(noProject), unknown)
})

test('dados: a lista e a contagem', async (t) => {
  const on = await dataOn(t)
  const response = await on.tables(on.ana)
  assert.equal(response.statusCode, 200, response.body)
  const listed = AppTables.parse(response.json())
  assert.equal(listed.kind, 'TABLES')
  assert.ok(listed.kind === 'TABLES')
  assert.deepEqual(
    listed.tables.map(({ name }) => name),
    ['a"b c', 'clientes', 'item_pedido', 'recado', 'sem_chave', 'tipos', 'vazia'],
  )
  const counts = Object.fromEntries(listed.tables.map(({ name, rows }) => [name, rows]))
  assert.deepEqual(counts.clientes, { kind: 'OVER' })
  assert.deepEqual(counts.item_pedido, { kind: 'EXACT', rows: 120 })
  assert.deepEqual(counts.sem_chave, { kind: 'EXACT', rows: 120 })
  assert.deepEqual(counts.vazia, { kind: 'EXACT', rows: 0 })
  assert.deepEqual(counts['a"b c'], { kind: 'EXACT', rows: 1 })
  assert.equal(JSON.stringify(listed).includes('conexus_migration'), false)
})

test('dados: a contagem que falha é indisponível', async (t) => {
  const on = await dataOn(t)
  const read = on.hub.postgres.companyPostgres.readApp.bind(on.hub.postgres.companyPostgres)
  t.mock.method(
    on.hub.postgres.companyPostgres,
    'readApp',
    (...args: Parameters<typeof read>): ReturnType<typeof read> =>
      args[1].text.includes('count(*)')
        ? Promise.resolve({ kind: 'FAILED', code: 'APP_DATA_UNAVAILABLE' })
        : read(...args),
  )
  const response = await on.tables(on.ana)
  assert.equal(response.statusCode, 200, response.body)
  const listed = AppTables.parse(response.json())
  assert.ok(listed.kind === 'TABLES')
  assert.equal(listed.tables.length, 7)
  for (const { rows } of listed.tables) assert.deepEqual(rows, { kind: 'UNKNOWN' })
})

test('dados: Projeto sem app', async (t) => {
  const on = await dataOn(t)
  const made = await post(on.hub, on.ana, `${on.base}/projects`, { name: 'Vazio' })
  const empty = `${on.base}/projects/${String(Object(made.json()).project.id)}`
  const listed = await on.tables(on.ana, empty)
  assert.equal(listed.statusCode, 200, listed.body)
  assert.deepEqual(listed.json(), { kind: 'NO_APP' })
  const rows = await on.rows(on.ana, CLIENTES, undefined, empty)
  assert.deepEqual([rows.statusCode, codeOf(rows)], [404, 'NOT_FOUND'])
})

test('dados: páginas pela chave', async (t) => {
  const on = await dataOn(t)
  const first = await on.page(CLIENTES)
  assert.deepEqual(first.columns, [{ name: 'id' }, { name: 'nome' }])
  assert.equal(first.rows.length, 50)
  assert.deepEqual(first.rows[0], [
    { text: '1', cut: false },
    { text: 'cliente 1', cut: false },
  ])
  assert.deepEqual(first.rows[49]?.[0], { text: '50', cut: false })
  assert.equal(first.next.kind, 'MORE')
  assert.ok(first.next.kind === 'MORE')
  assert.equal(first.next.page, token(50))
  const second = await on.page(CLIENTES, first.next.page)
  assert.deepEqual(
    [second.rows[0]?.[0], second.rows[49]?.[0]],
    [
      { text: '51', cut: false },
      { text: '100', cut: false },
    ],
  )
  const last = await on.page(CLIENTES, token(10000))
  assert.deepEqual(last.rows, [
    [
      { text: '10001', cut: false },
      { text: 'cliente 10001', cut: false },
    ],
  ])
  assert.deepEqual(last.next, { kind: 'END' })
  // A composite key orders by the key's own order, not the columns': item, then pedido.
  const keyed = await on.page('item_pedido')
  assert.deepEqual(keyed.columns, [{ name: 'pedido' }, { name: 'item' }, { name: 'qtd' }])
  assert.deepEqual(
    keyed.rows.slice(0, 4).map((row) => [row[1]?.text, row[0]?.text]),
    [
      ['1', '1'],
      ['1', '2'],
      ['1', '3'],
      ['2', '1'],
    ],
  )
})

test('dados: tabela sem chave', async (t) => {
  const on = await dataOn(t)
  const seen: string[] = []
  let at: string | undefined
  let pages = 0
  for (;;) {
    const read = await on.page('sem_chave', at)
    pages += 1
    seen.push(...read.rows.map((row) => String(row[0]?.text)))
    if (read.next.kind === 'END') break
    at = read.next.page
  }
  assert.equal(pages, 3)
  assert.deepEqual(
    seen,
    Array.from({ length: 120 }, (_, n) => String(n + 1)),
  )
})

test('dados: cada célula vira texto, cortada', async (t) => {
  const on = await dataOn(t, WIDE_TEXT)
  const types = await on.page('tipos')
  assert.deepEqual(types.rows[0], [
    { text: '1', cut: false },
    { text: '12.500', cut: false },
    { text: '2026-11-09 12:00:00+00', cut: false },
    { text: 'true', cut: false },
    { text: '{"a": 1, "b": [1, 2]}', cut: false },
    { text: '\\xdeadbeef', cut: false },
  ])
  assert.deepEqual(types.rows[1], [{ text: '2', cut: false }, null, null, null, null, null])
  const long = await on.page('texto_longo')
  assert.equal(long.rows.length, 50)
  for (const cell of long.rows[0]?.slice(1) ?? []) {
    assert.deepEqual(cell, { text: 'x'.repeat(CELL_CHARACTERS), cut: true })
  }
  assert.equal(long.next.kind, 'MORE')
})

test('dados: o nome vem do catálogo', async (t) => {
  const on = await dataOn(t)
  for (const name of [
    'nao_existe',
    'conexus_migration',
    'x"; select 1; --',
    "x'; drop table clientes; --",
    '\u0000',
  ]) {
    const refused = await on.rows(on.ana, name)
    assert.deepEqual([refused.statusCode, codeOf(refused)], [404, 'NOT_FOUND'], name)
  }
  const quoted = await on.page(QUOTED)
  assert.deepEqual(quoted.rows, [[{ text: '1', cut: false }]])
  // `serve` answers a path parameter its contract refuses as it does a Projeto that is not there.
  const long = await on.rows(on.ana, 'x'.repeat(64))
  assert.deepEqual([long.statusCode, codeOf(long)], [404, 'NOT_FOUND'])
  for (const page of [
    'lixo!',
    Buffer.from('abc').toString('base64url'),
    Buffer.from('0').toString('base64url'),
  ]) {
    const malformed = await on.rows(on.ana, CLIENTES, page)
    assert.deepEqual([malformed.statusCode, codeOf(malformed)], [400, 'REQUEST_MALFORMED'], page)
  }
  assert.equal((await on.tables(on.ana)).statusCode, 200)
})

test('dados: o banco do app não responde', async (t) => {
  const on = await dataOn(t)
  on.hub.postgres.companyPostgres.readAddress = async () => unreachableDatabaseUrl()
  const phrase = 'O banco do app não respondeu.'
  const answers = [await on.tables(on.ana), await on.rows(on.ana, CLIENTES)]
  for (const response of answers) {
    assert.equal(response.statusCode, 503, response.body)
    assert.equal(codeOf(response), 'APP_DATABASE_UNAVAILABLE')
    assert.equal(Object(response.json()).title, phrase)
  }
  const timedOut = on.hub.postgres.companyPostgres
  t.mock.method(
    timedOut,
    'readApp',
    async () => ({ kind: 'FAILED', code: 'APP_DATA_TIMEOUT' }) as const,
  )
  const late = await on.rows(on.ana, CLIENTES)
  assert.deepEqual([late.statusCode, codeOf(late)], [503, 'APP_DATABASE_UNAVAILABLE'])
})

test('dados: tabela larga demais', async (t) => {
  const on = await dataOn(t, WIDE_COLUMNS)
  const response = await on.rows(on.ana, 'colunas')
  assert.deepEqual([response.statusCode, codeOf(response)], [422, 'APP_TABLE_TOO_WIDE'])
})

test('dados: o registro não leva dado', async (t) => {
  const on = await dataOn(t)
  on.hub.lines.length = 0
  assert.equal((await on.tables(on.ana)).statusCode, 200)
  assert.equal((await on.rows(on.ana, CLIENTES)).statusCode, 200)
  const reads = on.hub.lines.filter(({ message }) => message === 'APP_DATA_READ')
  assert.equal(reads.length, 4)
  for (const { fields } of reads) {
    assert.deepEqual(Object.keys(fields).sort(), ['answer', 'companyId', 'projectId'])
    assert.equal(fields.answer, 'ROWS')
  }
  const written = JSON.stringify(on.hub.lines)
  for (const secret of [CLIENTES, 'cliente 1', 'select ', 'sem_chave', 'item_pedido']) {
    assert.equal(written.includes(secret), false, secret)
  }
})
