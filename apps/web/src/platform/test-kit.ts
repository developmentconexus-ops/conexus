import type { ConnectorEntry } from '@conexus/hub-api'

/** The Sankhya's subjects as the catalog serves them: the door's read is the free query. */
export const SANKHYA_SUBJECTS: ConnectorEntry['subjects'] = [
  {
    id: 'porta',
    label: 'Porta de leitura',
    operations: [
      {
        id: 'consultar',
        label: 'Consulta',
        summary: 'Roda uma consulta SQL de leitura no Sankhya.',
        effect: 'READ',
        door: true,
      },
    ],
  },
  {
    id: 'vendas',
    label: 'Vendas',
    operations: [
      {
        id: 'pedidos',
        label: 'Pedidos',
        summary: 'Os pedidos de venda.',
        effect: 'READ',
        door: false,
      },
      {
        id: 'lancarPedido',
        label: 'Lançar pedido',
        summary: 'Lança um pedido de venda.',
        effect: 'WRITE',
        door: false,
      },
      {
        id: 'cancelarPedido',
        label: 'Cancelar pedido',
        summary: 'Cancela um pedido.',
        effect: 'DESTROY',
        door: false,
      },
    ],
  },
  {
    id: 'financeiro',
    label: 'Financeiro',
    operations: [
      {
        id: 'contasAReceber',
        label: 'Contas a receber',
        summary: 'Os títulos a receber.',
        effect: 'READ',
        door: false,
      },
    ],
  },
]

/** The Sankhya's catalog entry with those subjects, for a screen that chooses among them. */
export const KIT_SANKHYA: ConnectorEntry = {
  id: 'sankhya',
  name: 'Sankhya',
  version: '1.0.0',
  category: 'ERP',
  summary: 'O sistema de gestão da empresa.',
  logo: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28"><rect width="28" height="28" rx="6" fill="#66CB66"/></svg>',
  auth: 'client_credentials',
  subjects: SANKHYA_SUBJECTS,
  fields: [],
}
