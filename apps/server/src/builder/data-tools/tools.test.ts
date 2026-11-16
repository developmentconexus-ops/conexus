import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Catalog as CatalogShape, DESCRIBE_SAMPLE_ROWS } from '@conexus/hub-api'
import { dataTools } from './public.ts'
import { CATALOG, LOJA_A, MIXED, runOn, thrown, UNNAMED, WAITING, world } from './test-world.ts'

const LOJA_A_ACTIVE = { kind: 'NAMED', name: 'Loja A', state: 'ACTIVE' }
const LOJA_B_ACTIVE = { kind: 'NAMED', name: 'Loja B', state: 'ACTIVE' }

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
  const tools = dataTools({ dataOf: async () => undefined })
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
    systems: [{ kind: 'NAMED', name: 'Loja A', state: 'ACTIVE' }],
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

test('query devolve a origem com o nome gravado e o conector da cópia', async () => {
  const { tools } = world(CATALOG)
  const result = await runOn(tools, 'data_query', { sql: 'select count(*) from sync.juntas' })
  assert.equal(result.kind, 'ROWS')
  assert.deepEqual(result.columns, ['n'])
  assert.equal(result.complete, true)
  assert.deepEqual(
    result.origin.map((each: { table: string; systems: unknown[]; connector: string }) => [
      each.table,
      each.systems,
      each.connector,
    ]),
    [
      ['vendas', [LOJA_A_ACTIVE], 'erp-falso'],
      ['juntas', [LOJA_A_ACTIVE, LOJA_B_ACTIVE], 'erp-falso'],
    ],
  )
})

test('query sem tabela no plano diz que a origem não foi identificada', async () => {
  const { tools } = world(CATALOG)
  const result = await runOn(tools, 'data_query', { sql: 'select 1' })
  assert.deepEqual(result.origin, [])
  assert.equal(result.reason, 'The origin of these rows was not identified: say so.')
})

test('a conexão à espera de nova autorização: a tabela é lida e a origem diz o nome e o estado', async () => {
  const { tools, reached } = world(WAITING)
  const waiting = { kind: 'NAMED', name: 'Loja A', state: 'NEEDS_REAUTH' }
  const listed = await runOn(tools, 'data_describe', {})
  const described = await runOn(tools, 'data_describe', { table: 'esperando' })
  const queried = await runOn(tools, 'data_query', { sql: 'select 1 from sync.esperando' })
  assert.deepEqual(listed.tables[0].systems, [waiting])
  assert.equal(described.kind, 'TABLE')
  assert.deepEqual(described.origin.systems, [waiting])
  assert.equal(queried.kind, 'ROWS')
  assert.deepEqual(queried.origin[0].systems, [waiting])
  assert.deepEqual(reached.rows, ['esperando'])
})

test('a fonte não dada ao Projeto: a origem diz só NOT_GIVEN, sem nome', async () => {
  const { tools } = world(UNNAMED)
  const listed = await runOn(tools, 'data_describe', {})
  const described = await runOn(tools, 'data_describe', { table: 'livre' })
  const queried = await runOn(tools, 'data_query', { sql: 'select 1 from sync.livre' })
  for (const systems of [
    listed.tables[0].systems,
    described.origin.systems,
    queried.origin[0].systems,
  ])
    assert.deepEqual(systems, [{ kind: 'NOT_GIVEN' }])
  assert.equal(described.origin.connector, 'erp-falso')
})

test('uma cópia de duas conexões com uma não dada nomeia só a dada', async () => {
  const { tools } = world(MIXED)
  const described = await runOn(tools, 'data_describe', { table: 'mista' })
  assert.deepEqual(described.origin.systems, [LOJA_A_ACTIVE, { kind: 'NOT_GIVEN' }])
})

test('as duas descrições dizem o estado da conexão e o que é NOT_GIVEN', () => {
  const { tools } = world(CATALOG)
  for (const name of ['data_describe', 'data_query'] as const) {
    const { description } = Object(tools)[name]
    assert.match(
      description,
      /Each system says its state: a state other than ACTIVE means the rows are its last copy/,
    )
    assert.match(
      description,
      /A system NOT_GIVEN is a connection this place was not given: name only its connector\./,
    )
  }
})

test('uma cópia de duas conexões nomeia as duas na origem', async () => {
  const { tools } = world(CATALOG)
  const described = await runOn(tools, 'data_describe', { table: 'juntas' })
  const queried = await runOn(tools, 'data_query', { sql: 'select 1 from sync.juntas' })
  const catalog = await runOn(tools, 'data_describe', {})
  const both = [LOJA_A_ACTIVE, LOJA_B_ACTIVE]
  assert.deepEqual(described.origin.systems, both)
  assert.deepEqual(queried.origin.at(-1).systems, both)
  assert.deepEqual(
    catalog.tables.find((each: { name: string }) => each.name === 'juntas').systems,
    both,
  )
})
