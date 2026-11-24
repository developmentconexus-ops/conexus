import type { DataReadEntry } from '@conexus/hub-api'
import { ASSISTANT_CONTROLLER, listDataReads, readAssistantConversation } from '@conexus/hub-api'
import type { Page } from 'playwright-core'
import type { z } from 'zod'
import type { Replies } from './layout-harness.ts'
import { failure, ok } from './layout-harness.ts'
import type { State } from './sweep-kit.ts'
import { waitFor } from './sweep-kit.ts'
import { companies, PROJECT_ID } from './sweep-replies.ts'
import { sessionReplies } from './sweep-session.ts'

const COMPANY_ID = '0'.repeat(32)
const API = `/api/companies/${COMPANY_ID}`
const PATH = `/companies/${COMPANY_ID}/settings/data-reads`
const OPEN = '12121212-1212-4212-8212-121212121212'
const THREAD = '13131313-1313-4313-8313-131313131313'

/** What **Abrir a conversa** preloads on focus: the person's own conversation with the Assistant in Início. */
const CONVERSATION: Replies = {
  [`GET ${API}/assistant/conversations/${THREAD}`]: ok(readAssistantConversation, {
    conversation: {
      ...{ id: THREAD, title: 'Vendas da semana', projectId: null, automation: null },
      ...{ createdAt: '2026-10-19T12:00:00.000Z', updatedAt: '2026-10-19T12:00:00.000Z' },
      connections: [],
    },
  }),
  ...sessionReplies(THREAD, { messages: [], controller: ASSISTANT_CONTROLLER }),
}
const LONG_QUERY = `select date_trunc('day', data_negociacao) as dia, sum(valor_total) as total from sync.sankhya_vendas_com_um_nome_comprido where data_negociacao >= now() - interval '30 days' group by 1 order by 1`

/** Reads of every kind: a long query, a refusal, a live read, an app's query in a Projeto. */
function reads(): z.input<typeof DataReadEntry>[] {
  const at = new Date().toISOString()
  const base = {
    at,
    person: { id: 'person-ana', name: 'Ana Lima' },
    agent: 'ASSISTANT',
    project: null,
    agentId: null,
    threadId: null,
    connection: null,
    operation: null,
    query: null,
    ms: 12,
  } as const
  return [
    {
      ...base,
      id: OPEN,
      verb: 'QUERY',
      tables: ['sankhya_vendas_com_um_nome_comprido', 'sankhya_itens_venda'],
      query: LONG_QUERY,
      outcome: 'QUERY',
      rows: 30,
      threadId: THREAD,
    },
    {
      ...base,
      id: '14141414-1414-4414-8414-141414141414',
      person: { id: 'person-long', name: 'Nome Completo Muito Comprido' },
      verb: 'SAMPLE',
      tables: ['sankhya_clientes'],
      outcome: 'NOT_IN_CATALOG',
      rows: null,
      project: { id: PROJECT_ID, name: 'Vendedores com um nome que não cabe' },
    },
    {
      ...base,
      id: '15151515-1515-4515-8515-151515151515',
      agent: 'CONSTRUTOR',
      verb: 'LIVE',
      tables: [],
      connection: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      operation: 'lerPedidos',
      outcome: 'OK',
      rows: null,
    },
    {
      ...base,
      id: '16161616-1616-4616-8616-161616161616',
      agent: 'APP',
      verb: 'QUERY',
      tables: [],
      query: 'select count(*) from pedidos',
      outcome: 'ROWS',
      rows: 1,
      project: { id: PROJECT_ID, name: 'Vendedores' },
    },
  ]
}

function replies(list: Replies[string]): Replies {
  return {
    ...companies([{ name: 'Empresa Teste', role: 'owner' }], false),
    [`GET ${API}/data-reads`]: list,
  }
}

const LISTED = ok(listDataReads, { reads: reads(), next: { kind: 'MORE', page: 'abc' } })
const EMPTY = ok(listDataReads, { reads: [], next: { kind: 'END' } })

function reached(name: string) {
  return async (page: Page) => {
    await page.getByRole('button', { name }).first().waitFor()
  }
}

/** The screens of the Registro de dados (U9), so the 320 px and 16 px field checks cover them. */
export const DATA_READS_STATES: State[] = [
  {
    name: 'Registro de dados, a lista',
    path: PATH,
    replies: replies(LISTED),
    settle: async (page) => waitFor(page, 'Nome Completo Muito Comprido'),
  },
  {
    name: 'Registro de dados, a linha aberta',
    path: `${PATH}?read=${OPEN}`,
    replies: { ...replies(LISTED), ...CONVERSATION },
    settle: reached('Copiar a consulta'),
  },
  {
    name: 'Registro de dados, vazio',
    path: PATH,
    replies: replies(EMPTY),
    settle: async (page) => waitFor(page, 'Nenhuma leitura ainda.'),
  },
  {
    name: 'Registro de dados, filtrado sem nada',
    path: `${PATH}?agent=APP`,
    replies: { ...replies(EMPTY), [`GET ${API}/data-reads?agent=APP`]: EMPTY },
    settle: async (page) => waitFor(page, 'Nenhuma leitura com esses filtros.'),
  },
  {
    name: 'Registro de dados, o Hub calado',
    path: PATH,
    replies: replies(failure('DATABASE_UNAVAILABLE')),
    settle: async (page) => waitFor(page, 'Não deu para ler o registro agora.'),
  },
  {
    name: 'Registro de dados, Exportar',
    path: PATH,
    replies: replies(LISTED),
    settle: async (page) => {
      await page.getByRole('button', { name: 'Exportar' }).first().click()
      await page.getByRole('dialog', { name: 'Exportar' }).waitFor()
    },
  },
]
