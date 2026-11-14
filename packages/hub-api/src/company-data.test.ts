import type { DataSources } from './company-data.ts'
import { Catalog } from './company-data.ts'
import type { DataWorld } from './company-data-conformance.ts'
import { runDataConformance } from './company-data-conformance.ts'

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
      description: 'Os pedidos em aberto do ERP.',
      columns: [
        { name: 'numero', type: 'bigint', description: 'O número do pedido no ERP.' },
        { name: 'total', type: 'numeric', description: null },
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
        },
      },
    },
    {
      name: 'clientes',
      description: 'Os clientes ativos do ERP.',
      columns: [{ name: 'nome', type: 'text', description: 'O nome do cliente.' }],
      kept: {
        kind: 'COPY',
        connections: [ERP],
        source: { kind: 'OPERATION', operation: 'listarClientes', label: 'Clientes', input: {} },
        lastRun: null,
      },
    },
    {
      name: 'estoque',
      description: null,
      columns: [{ name: 'produto', type: 'text', description: 'O código do produto.' }],
      kept: {
        kind: 'COPY',
        connections: [ERP],
        source: { kind: 'QUERY', query: 'select produto from estoque' },
        lastRun: null,
      },
    },
  ],
})

type Answer<K extends 'rows' | 'live' | 'funnel'> = Awaited<ReturnType<DataSources[K]>>

function fakeWorld(): DataWorld {
  const reached: DataWorld['reached'] = { live: [], rows: [], funnel: [], signals: [] }
  const gave: DataWorld['gave'] = { rows: [], live: [], funnel: [] }
  const isDown = { catalog: false, rows: false }
  const sources: DataSources = {
    async catalog({ signal }) {
      reached.signals.push(signal)
      return isDown.catalog ? { kind: 'CATALOG_UNAVAILABLE' } : CATALOG
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
    down(part) {
      isDown[part] = true
    },
  }
}

runDataConformance('o contrato sobre um ERP e um correio falsos', fakeWorld)
