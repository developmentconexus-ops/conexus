import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Catalog as CatalogShape, DESCRIBE_SAMPLE_ROWS } from '@conexus/hub-api'
import { dataTools } from './public.ts'
import { CATALOG, FORA, runOn, thrown, WITH_ONE_ORPHAN, WITH_ORPHAN, world } from './test-world.ts'

test('sem requestContext, NOT_GRANTED e nenhuma fonte chamada', async () => {
  const { tools, reached } = world(CATALOG, {}, (requestContext) => requestContext.has('scope'))
  for (const [name, input] of [
    ['data_describe', {}],
    ['data_query', { sql: 'select 1' }],
  ] as const) {
    const told = await thrown(Object(tools)[name].execute(input, {}))
    assert.equal(told.kind, 'NOT_GRANTED')
  }
  assert.deepEqual(reached, { catalog: 0, rows: [], query: [], signals: [] })
})

test('dataOf undefined, NOT_GRANTED', async () => {
  const tools = dataTools({ dataOf: async () => undefined, log: { error: () => undefined } })
  for (const [name, input] of [
    ['data_describe', {}],
    ['data_query', { sql: 'select 1' }],
  ] as const) {
    const told = await thrown(runOn(tools, name, input))
    assert.equal(told.kind, 'NOT_GRANTED')
    assert.equal(told.reason, "This conversation has no access to the company's data.")
  }
})

test('describe sem tabela não traz colunas e traz o conector, a hora do fim e o estado da última rodada', async () => {
  const { tools } = world(CATALOG)
  const result = await runOn(tools, 'data_describe', {})
  assert.equal(result.kind, 'CATALOG')
  assert.deepEqual(result.systems[0], {
    name: 'Loja A',
    connector: 'erp-falso',
    reads: [{ operation: 'listar', label: 'Listar', summary: 'Lista os itens.' }],
  })
  const [vendas, clientes] = result.tables
  assert.deepEqual(vendas, {
    name: 'vendas',
    label: 'VENDAS',
    description: 'A tabela vendas.',
    systems: ['Loja A'],
    connector: 'erp-falso',
    lastRunEndedAt: '2026-11-14T11:05:00.000Z',
    lastRun: 'ERROR',
  })
  assert.equal(clientes.lastRunEndedAt, null)
  assert.equal(clientes.lastRun, 'NONE')
  assert.equal(JSON.stringify(result).includes('copiedAt'), false)
  assert.equal(JSON.stringify(result).includes('columns'), false)
})

test('o catálogo vazio dá CATALOG com as duas listas vazias', async () => {
  const { tools } = world(CatalogShape.parse({ kind: 'CATALOG', systems: [], tables: [] }))
  assert.deepEqual(await runOn(tools, 'data_describe', {}), {
    kind: 'CATALOG',
    systems: [],
    tables: [],
  })
})

test('describe com tabela corta 200 linhas em 5 e diz more', async () => {
  const { tools } = world(CATALOG)
  const result = await runOn(tools, 'data_describe', { table: 'vendas' })
  assert.equal(result.kind, 'TABLE')
  assert.equal(result.sample.rows.length, DESCRIBE_SAMPLE_ROWS)
  assert.equal(result.sample.more, true)
  assert.deepEqual(result.columns, [
    { name: 'numero', type: 'bigint', description: null, inactiveSince: null },
  ])
  assert.equal(result.origin.table, 'vendas')
})

test('describe de tabela fora do catálogo dá NOT_IN_CATALOG com a frase e não lê linha', async () => {
  const { tools, reached } = world(CATALOG)
  const told = await thrown(runOn(tools, 'data_describe', { table: 'nao_existe' }))
  assert.equal(told.kind, 'NOT_IN_CATALOG')
  assert.equal(
    told.reason,
    'No such table in the catalog. Call data_describe with no table to list them.',
  )
  assert.deepEqual(reached.rows, [])
  assert.deepEqual(reached.query, [])
})

test('query devolve a origem com o nome e o conector do sistema do catálogo', async () => {
  const { tools } = world(CATALOG)
  const result = await runOn(tools, 'data_query', { sql: 'select count(*) from sync.juntas' })
  assert.equal(result.kind, 'ROWS')
  assert.deepEqual(result.columns, ['n'])
  assert.equal(result.complete, true)
  assert.deepEqual(
    result.origin.map((each: { table: string; systems: string[]; connector: string }) => [
      each.table,
      each.systems,
      each.connector,
    ]),
    [
      ['vendas', ['Loja A'], 'erp-falso'],
      ['juntas', ['Loja A', 'Loja B'], 'erp-falso'],
    ],
  )
})

test('query sem tabela no plano diz que a origem não foi identificada', async () => {
  const { tools } = world(CATALOG)
  const result = await runOn(tools, 'data_query', { sql: 'select 1' })
  assert.deepEqual(result.origin, [])
  assert.equal(result.reason, 'The origin of these rows was not identified: say so.')
})

test('um sistema fora do catálogo dá CATALOG_UNAVAILABLE e registra DATA_ORIGIN_UNREAD', async () => {
  const { tools, lines } = world(WITH_ORPHAN, {
    async query() {
      return { kind: 'ROWS', columns: ['n'], rows: [[1]], complete: true, used: ['orfa'] }
    },
  })
  const described = await thrown(runOn(tools, 'data_describe', { table: 'orfa' }))
  const queried = await thrown(runOn(tools, 'data_query', { sql: 'select 1 from sync.orfa' }))
  assert.equal(described.kind, 'CATALOG_UNAVAILABLE')
  assert.equal(queried.kind, 'CATALOG_UNAVAILABLE')
  assert.deepEqual(
    lines.map((line) => [line.message, line.fields]),
    [
      ['DATA_ORIGIN_UNREAD', { table: 'orfa', connection: FORA }],
      ['DATA_ORIGIN_UNREAD', { table: 'orfa', connection: FORA }],
    ],
  )
  assert.equal(JSON.stringify([described, queried]).includes(FORA), false)
})

test('a tabela de uma conexão fora do catálogo fica fora da lista e não derruba as outras', async () => {
  const { tools, lines } = world(WITH_ONE_ORPHAN)
  const result = await runOn(tools, 'data_describe', {})
  assert.deepEqual(
    result.tables.map((each: { name: string }) => each.name),
    ['clientes'],
  )
  assert.deepEqual(
    lines.map((line) => [line.message, line.fields]),
    [['DATA_ORIGIN_UNREAD', { table: 'orfa', connection: FORA }]],
  )
  assert.equal(JSON.stringify(result).includes(FORA), false)
})

test('uma cópia de duas conexões nomeia as duas na origem', async () => {
  const { tools } = world(CATALOG)
  const described = await runOn(tools, 'data_describe', { table: 'juntas' })
  const queried = await runOn(tools, 'data_query', { sql: 'select 1 from sync.juntas' })
  const catalog = await runOn(tools, 'data_describe', {})
  assert.deepEqual(described.origin.systems, ['Loja A', 'Loja B'])
  assert.deepEqual(queried.origin.at(-1).systems, ['Loja A', 'Loja B'])
  assert.deepEqual(
    catalog.tables.find((each: { name: string }) => each.name === 'juntas').systems,
    ['Loja A', 'Loja B'],
  )
})
