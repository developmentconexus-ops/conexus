import type { CopyProposed } from '@conexus/hub-api'
import { readConversation } from '@conexus/hub-api'
import type { Page } from 'playwright-core'
import type { z } from 'zod'
import { ok } from './layout-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import { WITH_CONVERSATIONS } from './sweep-conversation-states.ts'
import type { ProposalIn } from './sweep-copies-states.ts'
import { CONNECTION, copiesPage, LISTED, PAGE } from './sweep-copies-states.ts'
import type { State } from './sweep-kit.ts'
import { waitFor } from './sweep-kit.ts'
import { PROJECT_ID } from './sweep-replies.ts'
import type { Said } from './sweep-session.ts'
import { sessionReplies } from './sweep-session.ts'

const PROPOSAL_ID = '66666666-6666-4666-8666-666666666666'
const CONVERSATION_ID = '88888888-8888-4888-8888-888888888888'
const CHAT = `/companies/${COMPANY.id}/projects/${PROJECT_ID}/conversations/${CONVERSATION_ID}`
const CHAT_API = `/api/companies/${COMPANY.id}/projects/${PROJECT_ID}/conversations/${CONVERSATION_ID}`
const TABLE = 'devolucoes_de_pedidos_de_venda_da_filial_com_um_nome_de_tabela_muito_comprido'
const LONG_CONNECTION = 'Matriz com um nome bem comprido da filial'
const WINDOW = { kind: 'WINDOW', days: 30 } as const

/** A proposal whose texts are all long: the label, name, connection, Projeto, person and query must break, not push the page. */
const PROPOSAL: ProposalIn = {
  id: PROPOSAL_ID,
  name: TABLE,
  label: 'Devoluções de pedidos de venda da filial com um rótulo bem comprido que precisa quebrar',
  connection: { id: CONNECTION, name: LONG_CONNECTION, connector: 'sankhya' },
  project: { id: PROJECT_ID, name: 'Vendedores com um nome de Projeto bem comprido também' },
  shown: {
    query: `SELECT NUNOTA, CODPARC, VLRNOTA, DTNEG FROM TGFCAB WHERE TIPMOV = 'D' AND CODEMP IN (1, 2, 3) ORDER BY NUNOTA`,
    key: ['NUNOTA'],
    changedSince: { column: 'DTALTER' },
    window: { column: 'DTNEG', days: 30 },
  },
  mode: WINDOW,
  proved: { rows: 50, more: true },
  proposedBy: {
    id: '77777777-7777-4777-8777-777777777777',
    name: 'Ana Maria da Silva Pereira de Albuquerque',
  },
  state: 'OPEN',
}

/** What `copy_propose` answered in the conversation, with a key of long column names. */
const PROPOSED = {
  kind: 'PROPOSED',
  proposalId: PROPOSAL_ID,
  name: TABLE,
  connection: { name: LONG_CONNECTION, connector: 'sankhya' },
  key: ['NUMERO_UNICO_DA_NOTA_FISCAL', 'CODIGO_DA_EMPRESA_DE_ORIGEM_DA_VENDA'],
  mode: WINDOW,
  rows: 50,
  more: true,
} satisfies z.input<typeof CopyProposed>

const MESSAGES: Said[] = [
  {
    id: 'c1',
    role: 'builder',
    parts: [
      {
        type: 'tool-invocation',
        toolInvocation: {
          state: 'result',
          toolCallId: 'cp1',
          toolName: 'copy_propose',
          args: {},
          result: PROPOSED,
        },
      },
    ],
    model: 'anthropic/claude-sonnet-4',
    createdAt: '2026-11-10T12:01:00.000Z',
  },
]

const CHAT_REPLIES = {
  ...WITH_CONVERSATIONS,
  [`GET ${CHAT_API}`]: ok(readConversation, {
    conversation: { id: CONVERSATION_ID, title: 'Cópias', createdAt: '2026-11-10T12:00:00.000Z' },
  }),
  ...sessionReplies(CONVERSATION_ID, { messages: MESSAGES }),
  // The card rereads its proposal through the list of copies.
  ...copiesPage([], [PROPOSAL]),
}

/** On a phone the conversation is the other region of "App | Conversa". */
async function inChat(page: Page) {
  if ((page.viewportSize()?.width ?? 0) < 768) {
    await page.getByRole('button', { name: 'Conversa', exact: true }).click()
  }
  await waitFor(page, 'Chave')
}

/** The screens of the Builder's copy proposal: its row in Cópias, the dialog of Ligar and its card in the conversation. */
export const COPY_PROPOSAL_STATES: State[] = [
  {
    name: 'Cópias, a proposta do Builder com textos longos ao lado das cópias',
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
  {
    name: 'Conversa, o cartão da proposta de cópia com o botão Ligar',
    path: CHAT,
    replies: CHAT_REPLIES,
    settle: async (p) => {
      await inChat(p)
      await p.getByRole('button', { name: 'Ligar', exact: true }).waitFor()
    },
  },
]
