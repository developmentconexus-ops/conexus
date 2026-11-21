import type { CompanyData, DataSources, ReadAnswer } from './company-data.ts'
import { Catalog, companyData } from './company-data.ts'
import { LAWS_AT } from './company-data-conformance.ts'
import type { DataWorld } from './company-data-world.ts'
import { ConnectorId } from './company-roles.ts'
import { ConnectionId } from './connectors.ts'

const ERP = '00000000-0000-4000-8000-0000000000e1'
const BRANCH = '00000000-0000-4000-8000-0000000000e2'
const matriz = {
  kind: 'NAMED' as const,
  connection: {
    id: ConnectionId.parse(ERP),
    name: 'Matriz',
    connector: ConnectorId.parse('erp-falso'),
  },
  state: 'ACTIVE' as const,
}
const MAIL = '00000000-0000-4000-8000-0000000000e3'

export const CATALOG = Catalog.parse({
  kind: 'CATALOG',
  systems: [
    {
      connection: ERP,
      connector: 'erp-falso',
      name: 'ERP da matriz',
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
      reads: [
        { operation: 'listarPedidos', label: 'Pedidos', summary: 'Os pedidos de uma situação.' },
      ],
      actions: [],
    },
    {
      connection: MAIL,
      connector: 'correio-falso',
      name: 'Correio',
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
        sources: [matriz],
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
        sources: [matriz],
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
        sources: [matriz],
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

type Row = Readonly<Record<string, unknown>>

/** The contract over the fake sources with a record of its own: one row per read, of names and counts; with the record down, no read returns. */
function recordedOver(sources: DataSources, rows: Row[], down: { record: boolean }): CompanyData {
  const data = companyData({ sources, now: () => LAWS_AT })
  return {
    ...data,
    async read(request) {
      const answer = await data.read(request)
      if (down.record) return { kind: 'TABLE_UNAVAILABLE' }
      rows.push({ verb: request.kind, outcome: answer.kind, rows: countOf(answer) })
      return answer
    },
  }
}

function countOf(answer: ReadAnswer): number | null {
  return answer.kind === 'TABLE' || answer.kind === 'QUERY' ? answer.rows.length : null
}

/** What the fake database answers a query: the role's refusal, the column's, or one row. */
function queried(sql: string): Answer<'query'> {
  if (sql === HIDDEN.query) return { kind: 'NOT_IN_ROLE' }
  if (sql === QUERIES.refused)
    return {
      kind: 'QUERY_REFUSED',
      sqlstate: '42703',
      message: 'column "nao_existe" does not exist',
    }
  const used = [sql === QUERIES.outside ? 'fora' : 'pedidos_abertos']
  return { kind: 'ROWS', columns: ['?column?'], rows: [[1]], complete: false, used }
}

export function fakeWorld(catalog: Catalog = CATALOG): DataWorld {
  const reached: DataWorld['reached'] = { live: [], rows: [], funnel: [], query: [], signals: [] }
  const gave: DataWorld['gave'] = { rows: [], live: [], funnel: [], query: [] }
  const isDown = { catalog: false, rows: false, query: false, record: false }
  const recorded: Row[] = []
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
      const answer = isDown.query ? { kind: 'TABLE_UNAVAILABLE' as const } : queried(sql)
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
    data: recordedOver(sources, recorded, isDown),
    reads: async () => [...recorded],
    failRecord() {
      isDown.record = true
    },
    reached,
    gave,
    queries: QUERIES,
    inputs: {
      live: {},
      another: [{ situacao: 'aberto', outro: 'campo' }, {}, { situacao: '-' }],
    },
    hidden: HIDDEN,
    down(part) {
      isDown[part] = true
    },
  }
}
