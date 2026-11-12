import type { CopySummary } from '@conexus/hub-api'
import { ConnectionId, ConnectorEntry, ConnectorId } from '@conexus/hub-api'

// The stores of Mercado Livre and the catalog the Cópias tests read (O Sync de qualquer conector, U4).
const LOJA_A = ConnectionId.parse('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')
const LOJA_B = ConnectionId.parse('cccccccc-cccc-4ccc-8ccc-cccccccccccc')
/** Two stores of Mercado Livre, by the names the company gave them. */
export const STORES = [
  { connection: { id: LOJA_A, name: 'Loja A', connector: ConnectorId.parse('mercado-livre') } },
  { connection: { id: LOJA_B, name: 'Loja B', connector: ConnectorId.parse('mercado-livre') } },
]
/** What a copy of the stores' orders shows: the read `pedidos`, paid only, only what changed. */
export const ORDERS_SHOWN: CopySummary['shown'] = {
  source: { kind: 'OPERATION', operation: 'pedidos', label: 'Pedidos', input: { status: 'paid' } },
  key: ['id'],
  changedSince: { column: 'atualizado' },
  window: null,
  description: 'Os pedidos de cada loja',
  columns: [
    { name: 'id', type: 'bigint', description: 'O número do pedido' },
    { name: 'atualizado', type: 'timestamp', description: null },
  ],
}

const LOGO =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28"><rect width="28" height="28"/></svg>'
/** The catalog the connections list carries, which names each connector on the screens. */
export const CATALOG = [
  { id: 'sankhya', name: 'Sankhya', category: 'ERP', auth: 'client_credentials' },
  { id: 'mercado-livre', name: 'Mercado Livre', category: 'Marketplace', auth: 'oauth2_code' },
].map((one) =>
  ConnectorEntry.parse({
    ...one,
    version: '1.0.0',
    summary: 'Resumo.',
    logo: LOGO,
    subjects: [],
    fields: [],
  }),
)
