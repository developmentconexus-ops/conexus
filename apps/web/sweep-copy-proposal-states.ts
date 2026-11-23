import type { ProposalIn } from './sweep-copies-states.ts'
import { CONNECTION, copiesPage, LISTED, PAGE } from './sweep-copies-states.ts'
import type { State } from './sweep-kit.ts'
import { waitFor } from './sweep-kit.ts'
import { PROJECT_ID } from './sweep-replies.ts'

const PROPOSAL_ID = '66666666-6666-4666-8666-666666666666'
const TABLE = 'devolucoes_de_pedidos_de_venda_da_filial_com_um_nome_de_tabela_muito_comprido'
const LONG_CONNECTION = 'Matriz com um nome bem comprido da filial'
const WINDOW = { kind: 'WINDOW', days: 30 } as const

/** A proposal whose texts are all long: the label, name, connection, Projeto, person and query must break, not push the page. */
const PROPOSAL: ProposalIn = {
  id: PROPOSAL_ID,
  name: TABLE,
  label: 'Devoluções de pedidos de venda da filial com um rótulo bem comprido que precisa quebrar',
  sources: [{ connection: { id: CONNECTION, name: LONG_CONNECTION, connector: 'sankhya' } }],
  project: { id: PROJECT_ID, name: 'Vendedores com um nome de Projeto bem comprido também' },
  shown: {
    source: {
      kind: 'QUERY',
      query: `SELECT NUNOTA, CODPARC, VLRNOTA, DTNEG FROM TGFCAB WHERE TIPMOV = 'D' AND CODEMP IN (1, 2, 3) ORDER BY NUNOTA`,
    },
    key: ['NUNOTA'],
    changedSince: { column: 'DTALTER' },
    window: { column: 'DTNEG', days: 30 },
    description: null,
    columns: [],
  },
  mode: WINDOW,
  proved: { rows: 50, more: true, calls: null },
  proposedBy: {
    id: '77777777-7777-4777-8777-777777777777',
    name: 'Ana Maria da Silva Pereira de Albuquerque',
  },
  state: 'OPEN',
}

export const COPY_PROPOSAL_STATES: State[] = [
  {
    name: 'Dados, a proposta do Builder com textos longos ao lado das cópias',
    path: PAGE,
    replies: copiesPage(LISTED, [PROPOSAL]),
    settle: (p) => waitFor(p, 'Dispensar'),
  },
  {
    name: 'Ligar a proposta, o diálogo com a consulta e a chave',
    path: PAGE,
    replies: copiesPage(LISTED, [PROPOSAL]),
    settle: async (p) => {
      await waitFor(p, 'Dispensar')
      await p.getByRole('button', { name: 'Ligar', exact: true }).first().click()
      await p.getByRole('dialog', { name: `Ligar a cópia ${TABLE}` }).waitFor()
    },
  },
]
