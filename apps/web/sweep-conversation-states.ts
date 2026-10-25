import { listConversations, listModelAccounts, readConversation } from '@conexus/hub-api'
import type { Page } from 'playwright-core'
import { ok } from './layout-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import type { State } from './sweep-kit.ts'
import { waitFor } from './sweep-kit.ts'
import { OWNER, PROJECT_ID } from './sweep-replies.ts'
import type { Said } from './sweep-session.ts'
import { sessionReplies } from './sweep-session.ts'
import { PLANNING, PLANNING_REPLIES, WORKING, WORKING_REPLIES } from './sweep-working.ts'

const PROJECT = `/companies/${COMPANY.id}/projects/${PROJECT_ID}`
const CONVERSATIONS = `${PROJECT}/conversations`
const API = `/api/companies/${COMPANY.id}/projects/${PROJECT_ID}/conversations`
const ID = '11111111-1111-4111-8111-111111111111'
const UNTITLED = '22222222-2222-4222-8222-222222222222'
const TITLE = 'Comparação de dois apps de encomenda de padaria com um título bem comprido mesmo'
const LONG_WORD =
  'https://padaria.example.test/pedidos/com/um/endereco/muito/comprido/que/nao/quebra'

const ANSWER = [
  'Encontrei **dois** apps:',
  '',
  '- o primeiro cobra por pedido, com um nome comprido que precisa quebrar a linha no telefone',
  '- o segundo tem `plano mensal`',
  // Claude's cited spans, each its own block, as the Hub reads them back joined.
  '- **Meslo:** uma plataforma para confeitarias. A limitação é que é especializada em encomendas.',
  '',
  '```',
  `linha de código bem comprida que rola dentro do bloco e não pela página ${LONG_WORD}`,
  '```',
].join('\n')

export const MESSAGES: Said[] = [
  {
    id: 'm1',
    role: 'person',
    parts: [{ type: 'text', text: `Compare dois apps de encomenda de padaria ${LONG_WORD}` }],
    model: null,
    createdAt: '2026-10-19T12:00:00.000Z',
  },
  {
    id: 'm2',
    role: 'builder',
    parts: [
      {
        type: 'data-conexus-notice',
        data: { text: 'Time 3 foi recusada. Ligue de novo; continuei pela Time 1.' },
      },
      { type: 'reasoning', reasoning: 'Vou comparar os dois apps.', details: [] },
      ...['a', 'b', 'c'].map((toolCallId) => ({
        type: 'tool-invocation' as const,
        toolInvocation: {
          state: 'result' as const,
          toolCallId,
          toolName: 'web_fetch',
          args: { url: LONG_WORD },
          result: { title: null },
        },
      })),
      {
        type: 'tool-invocation',
        toolInvocation: {
          state: 'result',
          toolCallId: 'd',
          toolName: 'web_search',
          args: {
            query: 'apps de encomenda de padaria com pedido pelo celular e plano mensal',
          },
          result: ['dois apps de encomenda de padaria'],
        },
      },
      { type: 'text', text: ANSWER },
      { type: 'data-conexus-failure', data: { code: 'MODEL_CALL_FAILED' } },
    ],
    model: 'anthropic/claude-sonnet-4',
    createdAt: '2026-10-19T12:01:00.000Z',
  },
]

const CONVERSATION = readConversation.success.body.parse({
  conversation: {
    id: ID,
    title: TITLE,
    createdAt: '2026-10-19T12:00:00.000Z',
  },
})

const WITH_ACCOUNT = {
  ...OWNER,
  [`GET /api/companies/${COMPANY.id}/model-accounts`]: ok(listModelAccounts, {
    company: [],
    mine: [
      {
        id: '00000000-0000-4000-8000-000000000001',
        owner: 'me',
        kind: 'api_key',
        provider: 'anthropic',
        label: 'Time 1',
        position: 0,
        state: 'ready',
        kindOff: false,
        hint: 'x7Qa',
        linkedBy: 'Ana Lima',
        limitedUntil: null,
        linkedAt: '2026-10-19T12:00:00.000Z',
        assignees: [],
        revision: 0,
      },
    ],
    order: [{ provider: 'anthropic', accounts: ['00000000-0000-4000-8000-000000000001'] }],
    kinds: [],
    defaults: { company: null, mine: null, start: null, companyStart: null },
    choices: {
      mine: [
        {
          id: 'anthropic',
          name: 'Anthropic',
          models: [
            { id: 'anthropic/claude-sonnet-4', efforts: ['off', 'low', 'high'] },
            { id: 'anthropic/claude-opus-4', efforts: ['off'] },
          ],
        },
      ],
      company: [],
    },
    fallback: { enabled: false, chain: [], revision: 0 },
    usableProviders: ['anthropic'],
    mayManage: true,
  }),
}

const OPEN = {
  [`GET ${API}/${ID}`]: ok(readConversation, CONVERSATION),
  // The stream ends after its display state: the screen opens it again, and the reply stays the same.
  ...sessionReplies(ID, { messages: MESSAGES }),
}

/** The Hub with the Projeto's two conversations and the person's account, for the sweep and the layout tests. */
export const WITH_CONVERSATIONS = {
  ...WITH_ACCOUNT,
  [`GET ${API}`]: ok(listConversations, {
    conversations: [
      { id: ID, title: TITLE, createdAt: '2026-10-19T12:00:00.000Z' },
      { id: UNTITLED, title: null, createdAt: '2026-10-19T13:00:00.000Z' },
    ],
    next: { kind: 'END' },
  }),
  ...OPEN,
  // The box lists the untitled one; opening it reads it.
  [`GET ${API}/${UNTITLED}`]: ok(readConversation, {
    conversation: { ...CONVERSATION.conversation, id: UNTITLED, title: null },
  }),
  ...sessionReplies(UNTITLED, { messages: MESSAGES }),
}

/** On a phone the conversation is the other region of "App | Conversa": open it, then look for its text. */
async function inChat(page: Page, text: string) {
  if ((page.viewportSize()?.width ?? 0) < 768) {
    await page.getByRole('button', { name: 'Conversa', exact: true }).click()
  }
  await waitFor(page, text)
}

export const CONVERSATION_STATES: State[] = [
  {
    name: 'Projeto, Prévia vazia e sem conversa',
    path: PROJECT,
    replies: OWNER,
    settle: (p) => inChat(p, 'Nenhuma conversa'),
  },
  {
    name: 'Projeto, Prévia vazia com a conversa mais recente',
    path: PROJECT,
    replies: WITH_CONVERSATIONS,
    settle: (p) => inChat(p, 'Encontrei'),
  },
  {
    name: 'Projeto, a caixa de conversas aberta',
    path: PROJECT,
    replies: WITH_CONVERSATIONS,
    settle: async (page) => {
      await inChat(page, 'Encontrei')
      // Under `md` the list opens from the title in the top line; from `md` up, from the box.
      if ((page.viewportSize()?.width ?? 0) < 768) {
        await page.locator('[data-slot=drawer-trigger]').click()
        await page.getByRole('dialog', { name: 'Conversas' }).waitFor()
        return
      }
      await page.getByRole('combobox', { name: 'Conversas' }).press('ArrowDown')
      await page.getByRole('option').first().waitFor()
    },
  },
  {
    name: 'Conversa, com a resposta do Builder',
    path: `${CONVERSATIONS}/${ID}`,
    replies: { ...WITH_ACCOUNT, ...OPEN },
    settle: (p) => inChat(p, 'Encontrei'),
  },
  {
    name: 'Conversa, com as ferramentas abertas',
    path: `${CONVERSATIONS}/${ID}`,
    replies: { ...WITH_ACCOUNT, ...OPEN },
    settle: async (page) => {
      await inChat(page, 'Encontrei')
      await page.getByRole('button', { name: /4 ferramentas/ }).click()
      await waitFor(page, 'Pesquisou na internet')
    },
  },
  {
    name: 'Conversa trabalhando, o painel de tarefas e a pergunta aberta',
    path: `${CONVERSATIONS}/${WORKING}`,
    replies: { ...WITH_ACCOUNT, ...WORKING_REPLIES },
    settle: (p) => inChat(p, 'Tarefas · 1 de 5'),
  },
  {
    name: 'Conversa trabalhando, a edição aberta',
    path: `${CONVERSATIONS}/${WORKING}`,
    replies: { ...WITH_ACCOUNT, ...WORKING_REPLIES },
    settle: async (page) => {
      await inChat(page, 'Editou um arquivo')
      await page.getByRole('button', { name: /Editou um arquivo/ }).click()
      await page.getByRole('group', { name: 'Mudança no arquivo' }).waitFor()
    },
  },
  {
    name: 'Conversa trabalhando, a falha aberta',
    path: `${CONVERSATIONS}/${WORKING}`,
    replies: { ...WITH_ACCOUNT, ...WORKING_REPLIES },
    settle: async (page) => {
      await inChat(page, 'Não conseguiu escrever')
      await page.getByRole('button', { name: /Não conseguiu escrever/ }).click()
      await waitFor(page, 'Permission denied: stat on ../fora.ts')
    },
  },
  {
    name: 'Conversa, o plano aberto',
    path: `${CONVERSATIONS}/${PLANNING}`,
    replies: { ...WITH_ACCOUNT, ...PLANNING_REPLIES },
    settle: (p) => inChat(p, 'App de encomendas'),
  },
  {
    name: 'Conversa, o seletor de modelo e raciocínio aberto',
    path: `${CONVERSATIONS}/${ID}`,
    replies: { ...WITH_ACCOUNT, ...OPEN },
    settle: async (page) => {
      await inChat(page, 'Encontrei')
      await page.getByRole('combobox', { name: 'Modelo e raciocínio' }).click()
      await waitFor(page, 'Raciocínio')
    },
  },
  {
    name: 'Conversa, sem conta de modelo',
    path: `${CONVERSATIONS}/${ID}`,
    replies: { ...OWNER, ...OPEN },
    settle: (p) => inChat(p, 'Nenhuma conta que você pode usar atende a este modelo.'),
  },
]
