import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { DataSources } from './company-data.ts'
import { Catalog, companyData, Described, QUERY_SQL_MAX, ReadRequest } from './company-data.ts'
import { keepsLiveOnlyOutOfTables, runDataConformance } from './company-data-conformance.ts'
import type { DataWorld } from './company-data-world.ts'
import { ConnectionId } from './connectors.ts'

const ERP = '00000000-0000-4000-8000-0000000000e1'
const BRANCH = '00000000-0000-4000-8000-0000000000e2'
const MAIL = '00000000-0000-4000-8000-0000000000e3'

const CATALOG = Catalog.parse({
  kind: 'CATALOG',
  systems: [
    {
      connection: ERP,
      connector: 'erp-falso',
      name: 'ERP da matriz',
      liveOnly: false,
      reads: [
        { operation: 'listarPedidos', label: 'Pedidos', summary: 'Os pedidos de uma situação.' },
        { operation: 'listarClientes', label: 'Clientes', summary: 'Os clientes ativos.' },
      ],
      actions: [
        {
          operation: 'criarPedido',
          label: 'Criar pedido',
          summary: 'Um pedido novo.',
          effect: 'WRITE',
        },
      ],
    },
    {
      connection: BRANCH,
      connector: 'erp-falso',
      name: 'ERP da filial',
      liveOnly: false,
      reads: [
        { operation: 'listarPedidos', label: 'Pedidos', summary: 'Os pedidos de uma situação.' },
      ],
      actions: [],
    },
    {
      connection: MAIL,
      connector: 'correio-falso',
      name: 'Correio',
      liveOnly: true,
      reads: [{ operation: 'buscarMensagens', label: 'Mensagens', summary: 'Busca por texto.' }],
      actions: [
        { operation: 'enviarMensagem', label: 'Enviar', summary: 'Uma mensagem.', effect: 'WRITE' },
      ],
    },
  ],
  tables: [
    {
      name: 'pedidos_abertos',
      label: 'Pedidos em aberto',
      description: 'Os pedidos em aberto do ERP.',
      columns: [
        {
          name: 'numero',
          type: 'bigint',
          description: 'O número do pedido no ERP.',
          inactiveSince: null,
        },
        { name: 'total', type: 'numeric', description: null, inactiveSince: null },
      ],
      kept: {
        kind: 'COPY',
        connections: [ERP],
        source: {
          kind: 'OPERATION',
          operation: 'listarPedidos',
          label: 'Pedidos',
          input: { situacao: 'aberto' },
        },
        lastRun: {
          id: '00000000-0000-4000-8000-0000000000a1',
          startedAt: '2026-11-14T11:00:00.000Z',
          endedAt: '2026-11-14T11:05:00.000Z',
          outcome: { kind: 'PARTIAL', reason: 'CAP' },
          read: 500,
          written: 500,
          whole: false,
        },
      },
    },
    {
      name: 'clientes',
      label: 'Clientes',
      description: 'Os clientes ativos do ERP.',
      columns: [
        { name: 'nome', type: 'text', description: 'O nome do cliente.', inactiveSince: null },
      ],
      kept: {
        kind: 'COPY',
        connections: [ERP],
        source: { kind: 'OPERATION', operation: 'listarClientes', label: 'Clientes', input: {} },
        lastRun: null,
      },
    },
    {
      name: 'estoque',
      label: 'Estoque',
      description: 'O estoque do ERP.',
      columns: [
        { name: 'produto', type: 'text', description: 'O código do produto.', inactiveSince: null },
      ],
      kept: {
        kind: 'COPY',
        connections: [ERP],
        source: { kind: 'QUERY', query: 'select produto from estoque' },
        lastRun: null,
      },
    },
  ],
})

type Answer<K extends 'rows' | 'live' | 'funnel' | 'query'> = Awaited<ReturnType<DataSources[K]>>

const HIDDEN: DataWorld['hidden'] = {
  table: 'erp_titulos',
  query: 'select 1 from erp_titulos',
}

const QUERIES: DataWorld['queries'] = {
  reads: 'select 1 from pedidos_abertos',
  outside: 'select 1 from fora',
  refused: 'select nao_existe',
}

function fakeWorld(catalog: Catalog = CATALOG): DataWorld {
  const reached: DataWorld['reached'] = { live: [], rows: [], funnel: [], query: [], signals: [] }
  const gave: DataWorld['gave'] = { rows: [], live: [], funnel: [], query: [] }
  const isDown = { catalog: false, rows: false, query: false }
  const sources: DataSources = {
    async catalog({ signal }) {
      reached.signals.push(signal)
      return isDown.catalog ? { kind: 'CATALOG_UNAVAILABLE' } : catalog
    },
    async rows({ table, signal }) {
      reached.signals.push(signal)
      if (!isDown.rows) reached.rows.push(table.name)
      const page: Answer<'rows'> = isDown.rows
        ? { kind: 'TABLE_UNAVAILABLE' }
        : { kind: 'ROWS', rows: [{ numero: 1, total: '10.00' }], complete: false }
      gave.rows.push(page)
      return page
    },
    async live({ connection, operation, input, signal }) {
      reached.signals.push(signal)
      reached.live.push({ connection, operation, input })
      const answer: Answer<'live'> = { kind: 'OK', value: [{ assunto: 'Pedido 7' }] }
      gave.live.push(answer)
      return answer
    },
    async query({ sql, signal }) {
      reached.signals.push(signal)
      if (!isDown.query) reached.query.push(sql)
      const answer: Answer<'query'> = isDown.query
        ? { kind: 'TABLE_UNAVAILABLE' }
        : sql === HIDDEN.query
          ? { kind: 'NOT_IN_ROLE' }
          : sql === QUERIES.refused
            ? {
                kind: 'QUERY_REFUSED',
                sqlstate: '42703',
                message: 'column "nao_existe" does not exist',
              }
            : {
                kind: 'ROWS',
                columns: ['?column?'],
                rows: [[1]],
                complete: false,
                used: [sql === QUERIES.outside ? 'fora' : 'pedidos_abertos'],
              }
      gave.query.push(answer)
      return answer
    },
    async funnel({ connection, operation, input, call, signal }) {
      reached.signals.push(signal)
      reached.funnel.push({ connection, operation, input, call })
      const answer: Answer<'funnel'> = { kind: 'WRITE_UNCERTAIN', mark: 'pedido-2', returned: null }
      gave.funnel.push(answer)
      return answer
    },
  }
  return {
    sources,
    reached,
    gave,
    queries: QUERIES,
    hidden: HIDDEN,
    down(part) {
      isDown[part] = true
    },
  }
}

runDataConformance('o contrato sobre um ERP e um correio falsos', fakeWorld)

test('a lei do sistema só ao vivo falha quando uma tabela o tem como origem', async () => {
  const [first, ...rest] = CATALOG.tables
  assert.ok(first && first.kept.kind === 'COPY')
  const kept = { ...first, kept: { ...first.kept, connections: [ConnectionId.parse(MAIL)] } }
  const world = fakeWorld({ ...CATALOG, tables: [kept, ...rest] })
  await assert.rejects(
    keepsLiveOnlyOutOfTables(world, companyData({ sources: world.sources, now: () => new Date() })),
    /kept from Correio/,
  )
})

test('a lei do sistema só ao vivo falha quando o mundo não tem sistema só ao vivo', async () => {
  const systems = CATALOG.systems.map((system) => ({ ...system, liveOnly: false }))
  const world = fakeWorld({ ...CATALOG, systems })
  await assert.rejects(
    keepsLiveOnlyOutOfTables(world, companyData({ sources: world.sources, now: () => new Date() })),
    /a live-only system in the world/,
  )
})

test('a lei do sistema só ao vivo falha quando describe não devolve o catálogo da fonte', async () => {
  const world = fakeWorld()
  const [first, ...rest] = CATALOG.systems
  assert.ok(first)
  const changed = { ...CATALOG, systems: [{ ...first, name: 'outro nome' }, ...rest] }
  let asked = 0
  const catalog: DataSources['catalog'] = async () => (++asked === 1 ? CATALOG : changed)
  const sources: DataSources = { ...world.sources, catalog }
  await assert.rejects(
    keepsLiveOnlyOutOfTables(
      { ...world, sources },
      companyData({ sources, now: () => new Date() }),
    ),
    assert.AssertionError,
  )
})

test('o contrato recusa o sistema do catálogo que não diz se é só ao vivo', () => {
  const [first, ...rest] = CATALOG.systems
  assert.ok(first)
  const { liveOnly: _, ...unsaid } = first
  assert.equal(Catalog.safeParse({ ...CATALOG, systems: [unsaid, ...rest] }).success, false)
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
