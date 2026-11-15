import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Catalog, DataSources } from '@conexus/hub-api'
import { Catalog as CatalogShape, companyData, DESCRIBE_SAMPLE_ROWS } from '@conexus/hub-api'
import { RequestContext } from '@mastra/core/request-context'
import { dataTools } from './public.ts'

const LOJA_A = '00000000-0000-4000-8000-0000000000a1'
const LOJA_B = '00000000-0000-4000-8000-0000000000a2'
const FORA = '00000000-0000-4000-8000-0000000000ff'

const RUN = {
  id: '00000000-0000-4000-8000-0000000000b1',
  startedAt: '2026-11-14T11:00:00.000Z',
  endedAt: '2026-11-14T11:05:00.000Z',
  read: 10,
  written: 10,
}

const SOURCE = { kind: 'QUERY', query: 'select 1' } as const

function table(name: string, connections: string[], lastRun: unknown) {
  return {
    name,
    label: name.toUpperCase(),
    description: `A tabela ${name}.`,
    columns: [{ name: 'numero', type: 'bigint', description: null, inactiveSince: null }],
    kept: { kind: 'COPY', connections, source: SOURCE, lastRun },
  }
}

function catalogOf(tables: ReturnType<typeof table>[]): Catalog {
  return CatalogShape.parse({
    kind: 'CATALOG',
    systems: [LOJA_A, LOJA_B].map((connection, index) => ({
      connection,
      connector: 'erp-falso',
      name: index === 0 ? 'Loja A' : 'Loja B',
      liveOnly: false,
      reads: [{ operation: 'listar', label: 'Listar', summary: 'Lista os itens.' }],
      actions: [],
    })),
    tables,
  })
}

const CATALOG = catalogOf([
  table('vendas', [LOJA_A], {
    ...RUN,
    outcome: { kind: 'ERROR', code: 'COPY_DATABASE_UNAVAILABLE' },
  }),
  table('clientes', [LOJA_A], null),
  table('juntas', [LOJA_A, LOJA_B], { ...RUN, outcome: { kind: 'COMPLETE' } }),
])

const WITH_ORPHAN = catalogOf([table('orfa', [FORA], null)])

type Reached = { catalog: number; rows: string[]; query: string[]; signals: unknown[] }

function world(
  catalog: Catalog,
  over: Partial<DataSources> = {},
  scoped: (requestContext: RequestContext) => boolean = () => true,
) {
  const reached: Reached = { catalog: 0, rows: [], query: [], signals: [] }
  const sources: DataSources = {
    async catalog({ signal }) {
      reached.catalog += 1
      reached.signals.push(signal)
      return catalog
    },
    async rows({ table: kept, signal }) {
      reached.rows.push(kept.name)
      reached.signals.push(signal)
      return {
        kind: 'ROWS',
        rows: Array.from({ length: 200 }, (_, index) => ({ numero: index })),
        complete: false,
      }
    },
    async live() {
      throw new Error('no live read')
    },
    async query({ sql, signal }) {
      reached.query.push(sql)
      reached.signals.push(signal)
      const used = /juntas/.test(sql) ? ['vendas', 'juntas'] : /vendas/.test(sql) ? ['vendas'] : []
      return { kind: 'ROWS', columns: ['n'], rows: [[3]], complete: true, used }
    },
    async funnel() {
      throw new Error('no write')
    },
    ...over,
  }
  const lines: { fields: Record<string, unknown>; message: string }[] = []
  const tools = dataTools({
    dataOf: async (requestContext) =>
      scoped(requestContext)
        ? companyData({ sources, now: () => new Date('2026-11-14T12:00:00.000Z') })
        : undefined,
    log: { error: (fields, message) => lines.push({ fields, message }) },
  })
  return { tools, reached, lines }
}

function runOn(set: object, name: string, input: object, context: object = {}) {
  return Object(set)[name].execute(input, { requestContext: new RequestContext(), ...context })
}

function thrown(promise: Promise<unknown>) {
  return promise.then(
    () => assert.fail('a recusa voltou como resultado'),
    (error: Error) => JSON.parse(error.message),
  )
}

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
    assert.equal((await thrown(runOn(tools, name, input))).kind, 'NOT_GRANTED')
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

const REFUSALS = [
  {
    kind: 'QUERY_REFUSED',
    query: { kind: 'QUERY_REFUSED', sqlstate: '42703', message: 'column "x" does not exist' },
    reason: /SQLSTATE 42703/,
  },
  { kind: 'QUERY_TOO_LARGE', query: { kind: 'QUERY_TOO_LARGE' }, reason: /too large/ },
  { kind: 'DEADLINE', query: { kind: 'DEADLINE' }, reason: /took too long/ },
  {
    kind: 'TABLE_UNAVAILABLE',
    query: { kind: 'TABLE_UNAVAILABLE' },
    reason: /did not answer.*live/,
  },
  { kind: 'NOT_IN_ROLE', query: { kind: 'NOT_IN_ROLE' }, reason: /denied this statement/ },
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
    assert.match(told.reason, reason)
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
  assert.match(told.reason, /catalog did not answer/)
})

test('o abortSignal vai a describe e a read', async () => {
  const { tools, reached } = world(CATALOG)
  const controller = new AbortController()
  await runOn(tools, 'data_describe', { table: 'vendas' }, { abortSignal: controller.signal })
  assert.ok(reached.signals.length >= 2)
  assert.ok(reached.signals.every((signal) => signal === controller.signal))
})

test('o SQL vazio ou acima de 4000 caracteres é recusado pelo esquema', async () => {
  const { tools, reached } = world(CATALOG)
  const schema = Object(tools).data_query.inputSchema
  assert.equal(schema.safeParse({ sql: '   ' }).success, false)
  assert.equal(schema.safeParse({ sql: 'x'.repeat(4001) }).success, false)
  assert.equal(schema.safeParse({ sql: 'select 1' }).success, true)
  assert.deepEqual(reached.query, [])
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
