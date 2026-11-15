import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CATALOG, runOn, thrown, world } from './test-world.ts'

const REFUSALS = [
  {
    kind: 'QUERY_REFUSED',
    query: { kind: 'QUERY_REFUSED', sqlstate: '42703', message: 'column "x" does not exist' },
    reason:
      'PostgreSQL refused the query (SQLSTATE 42703); its message is in message. 42601 is a syntax error, 42703 a column that does not exist, 42P01 a table that does not exist, 25006 a write. Correct it and try again.',
  },
  {
    kind: 'QUERY_TOO_LARGE',
    query: { kind: 'QUERY_TOO_LARGE' },
    reason: 'The answer is too large. Aggregate or add LIMIT.',
  },
  { kind: 'DEADLINE', query: { kind: 'DEADLINE' }, reason: 'The query took too long. Narrow it.' },
  {
    kind: 'TABLE_UNAVAILABLE',
    query: { kind: 'TABLE_UNAVAILABLE' },
    reason:
      "The company's database did not answer. Do not read the system live in its place; tell the person to try again.",
  },
  {
    kind: 'NOT_IN_ROLE',
    query: { kind: 'NOT_IN_ROLE' },
    reason:
      'PostgreSQL denied this statement: the role of the person does not read one of its tables, or the statement is not a read. Say so; do not look for the data elsewhere.',
  },
] as const

for (const { kind, query, reason } of REFUSALS) {
  test(`cada recusa sai como erro da ferramenta com a sua frase: ${kind}`, async () => {
    const { tools } = world(CATALOG, { query: async () => query })
    const error = await runOn(tools, 'data_query', { sql: 'select 1' }).then(
      () => assert.fail('a recusa voltou como resultado'),
      (cause: Error) => cause,
    )
    assert.equal(error.name, 'DataRefused')
    const told = JSON.parse(error.message)
    assert.equal(told.kind, kind)
    assert.equal(told.reason, reason)
    assert.equal(told.status, null)
    assert.equal(told.body, null)
    if (query.kind === 'QUERY_REFUSED') {
      assert.equal(told.code, '42703')
      assert.equal(told.message, 'column "x" does not exist')
    } else {
      assert.equal(told.code, null)
      assert.equal(told.message, null)
    }
  })
}

test('cada recusa sai como erro da ferramenta com a sua frase: NOT_IN_CATALOG e CATALOG_UNAVAILABLE', async () => {
  const unnamed = world(CATALOG)
  assert.equal(
    (await thrown(runOn(unnamed.tools, 'data_describe', { table: 'x' }))).kind,
    'NOT_IN_CATALOG',
  )
  const down = world(CATALOG, { catalog: async () => ({ kind: 'CATALOG_UNAVAILABLE' }) })
  const told = await thrown(runOn(down.tools, 'data_describe', {}))
  assert.equal(told.kind, 'CATALOG_UNAVAILABLE')
  assert.equal(told.reason, 'The catalog did not answer. Tell the person to try again.')
})

test('o abortSignal vai a describe e a read', async () => {
  const { tools, reached } = world(CATALOG)
  const controller = new AbortController()
  await runOn(tools, 'data_describe', { table: 'vendas' }, { abortSignal: controller.signal })
  assert.ok(reached.signals.length >= 2)
  assert.ok(reached.signals.every((signal) => signal === controller.signal))
})

test('o abortSignal vai ao describe e ao read de data_query', async () => {
  const { tools, reached } = world(CATALOG)
  const controller = new AbortController()
  await runOn(tools, 'data_query', { sql: 'select 1' }, { abortSignal: controller.signal })
  assert.equal(reached.signals.length, 3)
  assert.ok(reached.signals.every((signal) => signal === controller.signal))
})

test('o SQL vazio ou acima de 4000 caracteres é recusado pelo esquema, e a fonte não é chamada', async () => {
  const { tools, reached } = world(CATALOG)
  for (const sql of ['   ', 'x'.repeat(4001)]) {
    const answer = await runOn(tools, 'data_query', { sql })
    assert.equal(answer.error, true)
    assert.match(String(answer.message), /sql/)
  }
  assert.equal((await runOn(tools, 'data_query', { sql: 'select 1' })).kind, 'ROWS')
  assert.deepEqual(reached.query, ['select 1'])
})

test('a tabela pedida tem no máximo 40 caracteres', async () => {
  const { tools, reached } = world(CATALOG)
  const answer = await runOn(tools, 'data_describe', { table: 'x'.repeat(41) })
  assert.equal(answer.error, true)
  assert.deepEqual(reached.rows, [])
})

async function sampleOf(count: number, complete: boolean) {
  const rows = Array.from({ length: count }, (_, index) => ({ numero: index }))
  const { tools } = world(CATALOG, { rows: async () => ({ kind: 'ROWS', rows, complete }) })
  const answer = await runOn(tools, 'data_describe', { table: 'vendas' })
  return answer.sample
}

test('more só vale quando a página veio cortada ou tem mais de cinco linhas', async () => {
  const samples = [await sampleOf(5, true), await sampleOf(6, true), await sampleOf(5, false)]
  assert.deepEqual(
    samples.map((each) => [each.rows.length, each.more]),
    [
      [5, false],
      [5, true],
      [5, true],
    ],
  )
})
