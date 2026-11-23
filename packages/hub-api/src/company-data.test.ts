import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { after, test } from 'node:test'
import { Catalog, Described, QUERY_SQL_MAX, ReadRequest } from './company-data.ts'
import { DATA_LAWS, runDataConformance } from './company-data-conformance.ts'
import { CATALOG, fakeWorld } from './test-company-data-world.ts'

runDataConformance('o contrato sobre um ERP e um correio falsos', () => fakeWorld())

const made: TestContext[] = []
runDataConformance('a conformidade espera o mundo assíncrono e passa o TestContext', async (t) => {
  made.push(t)
  await new Promise((resolve) => setImmediate(resolve))
  return fakeWorld()
})
after(() => {
  assert.deepEqual(
    made.map(({ name }) => name),
    DATA_LAWS,
    'one TestContext per law',
  )
})

test('o contrato recusa a tabela do catálogo sem descrição', () => {
  const [first, ...rest] = CATALOG.tables
  assert.ok(first)
  const undescribed = { ...CATALOG, tables: [{ ...first, description: '' }, ...rest] }
  assert.equal(Catalog.safeParse(undescribed).success, false)
  assert.equal(Described.safeParse(undescribed).success, false)
})

test('o contrato recusa a tabela do catálogo sem rótulo', () => {
  const [first, ...rest] = CATALOG.tables
  assert.ok(first)
  const { label: _, ...unlabeled } = first
  assert.equal(Catalog.safeParse({ ...CATALOG, tables: [unlabeled, ...rest] }).success, false)
})

test('o contrato recusa a coluna inativa desde uma data que não é data', () => {
  const [first, ...rest] = CATALOG.tables
  assert.ok(first)
  const [column, ...columns] = first.columns
  assert.ok(column)
  const dated = { ...first, columns: [{ ...column, inactiveSince: 'ontem' }, ...columns] }
  assert.equal(Catalog.safeParse({ ...CATALOG, tables: [dated, ...rest] }).success, false)
})

test('o pedido de consulta tira os espaços das pontas e recusa o texto vazio ou maior que o teto', () => {
  assert.equal(ReadRequest.parse({ kind: 'QUERY', sql: '  select 1  ' }).kind, 'QUERY')
  assert.deepEqual(ReadRequest.parse({ kind: 'QUERY', sql: '  select 1  ' }), {
    kind: 'QUERY',
    sql: 'select 1',
  })
  assert.equal(ReadRequest.safeParse({ kind: 'QUERY', sql: ' ' }).success, false)
  assert.equal(
    ReadRequest.safeParse({ kind: 'QUERY', sql: 'x'.repeat(QUERY_SQL_MAX) }).success,
    true,
  )
  assert.equal(
    ReadRequest.safeParse({ kind: 'QUERY', sql: 'x'.repeat(QUERY_SQL_MAX + 1) }).success,
    false,
  )
})
