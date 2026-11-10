import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { AppTables, CELL_CHARACTERS } from '@conexus/hub-api'
import { unreachableDatabaseUrl } from '../../platform/test-database.ts'
import { codeOf, memberOn, personOn, plantCompany, post } from '../identity/test-hub.ts'
import { ATENDENTE } from '../identity/test-roles.ts'
import { CLIENTES, DORA, dataOn, QUOTED, WIDE_COLUMNS, WIDE_TEXT } from './test-data.ts'

const DAVI = { name: 'Davi Costa', email: 'davi@example.test' }
const EDU = { name: 'Edu Lima', email: 'edu@example.test' }

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
    ['a"b c', 'clientes', 'item_pedido', 'pg_class', 'recado', 'sem_chave', 'tipos', 'vazia'],
  )
  const counts = Object.fromEntries(listed.tables.map(({ name, rows }) => [name, rows]))
  assert.deepEqual(counts.clientes, { kind: 'OVER' })
  assert.deepEqual(counts.item_pedido, { kind: 'EXACT', rows: 120 })
  assert.deepEqual(counts.sem_chave, { kind: 'EXACT', rows: 120 })
  assert.deepEqual(counts.vazia, { kind: 'EXACT', rows: 0 })
  assert.deepEqual(counts.pg_class, { kind: 'EXACT', rows: 2 })
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
  assert.equal(listed.tables.length, 8)
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
  const catalogNamed = await on.page('pg_class')
  assert.deepEqual(catalogNamed.rows, [
    [
      { text: '1', cut: false },
      { text: 'a', cut: false },
    ],
    [
      { text: '2', cut: false },
      { text: 'b', cut: false },
    ],
  ])
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

test('dados: uma contagem de forma errada é nossa', async (t) => {
  const on = await dataOn(t)
  const read = on.hub.postgres.companyPostgres.readApp.bind(on.hub.postgres.companyPostgres)
  t.mock.method(
    on.hub.postgres.companyPostgres,
    'readApp',
    (...args: Parameters<typeof read>): ReturnType<typeof read> =>
      args[1].text.includes('count(*)')
        ? Promise.resolve({ kind: 'ROWS', columns: [], rows: [['clientes', 'x']] })
        : read(...args),
  )
  const response = await on.tables(on.ana)
  assert.deepEqual([response.statusCode, codeOf(response)], [500, 'INTERNAL_UNEXPECTED'])
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
