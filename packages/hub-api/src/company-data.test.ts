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
          class: 'write',
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
        { operation: 'enviarMensagem', label: 'Enviar', summary: 'Uma mensagem.', class: 'write' },
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

function fakeWorld(): DataWorld {
  const reached: DataWorld['reached'] = { live: [], rows: [], funnel: [] }
  const isDown = { catalog: false, rows: false }
  const sources: DataSources = {
    async catalog() {
      return isDown.catalog ? { kind: 'CATALOG_UNAVAILABLE' } : CATALOG
    },
    async rows({ table }) {
      if (isDown.rows) return { kind: 'TABLE_UNAVAILABLE' }
      reached.rows.push(table.name)
      return { kind: 'ROWS', rows: [{ numero: 1, total: '10.00' }], complete: true }
    },
    async live({ connection, operation, input }) {
      reached.live.push({ connection, operation, input })
      return { kind: 'OK', value: [] }
    },
    async funnel({ connection, operation, input, call }) {
      reached.funnel.push({ connection, operation, input, call })
      return { kind: 'OK', value: { numero: 2 }, returned: { status: 201, body: { numero: 2 } } }
    },
  }
  return {
    sources,
    reached,
    down(part) {
      isDown[part] = true
    },
  }
}

runDataConformance('o contrato sobre um ERP e um correio falsos', fakeWorld)
