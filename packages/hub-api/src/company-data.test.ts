import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { after, test } from 'node:test'
import { QUERY_SQL_MAX, ReadRequest } from './company-data.ts'
import { DATA_LAWS, runDataConformance } from './company-data-conformance.ts'
import { fakeWorld } from './test-company-data-world.ts'

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
