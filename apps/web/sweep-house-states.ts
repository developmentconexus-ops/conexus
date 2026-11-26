import type { Provider } from '@conexus/hub-api'
import {
  ASSISTANT_CONTROLLER,
  getStatus,
  listAssistantConversations,
  listModelAccounts,
  listModelProviders,
  ModelAccount,
  readAssistantConversation,
} from '@conexus/hub-api'
import type { Page } from 'playwright-core'
import type { z } from 'zod'
import type { Replies } from './layout-harness.ts'
import { failure, ok } from './layout-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import type { State } from './sweep-kit.ts'
import { waitFor } from './sweep-kit.ts'
import { central, MEMBER, OWNER, startsOn } from './sweep-replies.ts'
import { sessionReplies } from './sweep-session.ts'

const HOME = `/companies/${COMPANY.id}`
const SETTINGS = `${HOME}/settings`
const WELCOME = `${HOME}/welcome`

const SONNET = 'anthropic/claude-sonnet-4'
const PROVIDERS: z.input<typeof Provider>[] = [
  { id: 'anthropic', name: 'Anthropic', models: [{ id: SONNET, efforts: ['off'] }] },
]

function accountOf(id: number, owner: 'me' | 'company', label: string) {
  return ModelAccount.parse({
    id: `00000000-0000-4000-8000-00000000000${id}`,
    owner,
    kind: 'api_key',
    provider: 'anthropic',
    label,
    position: 0,
    state: 'ready',
    limitedUntil: null,
    kindOff: false,
    hint: 'x7Qa',
    linkedBy: 'Ana Lima',
    linkedAt: '2026-10-19T12:00:00.000Z',
    assignees: [],
    revision: 1,
  })
}

const MINE = accountOf(1, 'me', 'Claude pessoal')
const SHARED = accountOf(2, 'company', 'Claude da empresa')

/** The owner's joined page: accounts in both parts and the switch on. */
const OWNER_WITH_ACCOUNTS = {
  ...OWNER,
  [`GET /api/companies/${COMPANY.id}/model-accounts`]: ok(listModelAccounts, {
    company: [SHARED],
    mine: [MINE],
    order: [{ provider: 'anthropic', accounts: [MINE.id, SHARED.id] }],
    kinds: [],
    defaults: { company: null, mine: null, start: null, companyStart: null },
    choices: { mine: PROVIDERS, company: PROVIDERS },
    fallback: { enabled: true, chain: [SONNET], revision: 1 },
    usableProviders: ['anthropic'],
    mayManage: true,
  }),
  'GET /api/model-providers': ok(listModelProviders, { providers: PROVIDERS }),
}

const HOUR = 60 * 60 * 1000

/** An instant `hours` ago, so each conversation lands in its day group whenever the sweep runs. */
function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * HOUR).toISOString()
}

function conversationOf(n: number, title: string, hours: number) {
  const digit = String(n)
  return {
    id: `${digit.repeat(8)}-${digit.repeat(4)}-4${digit.repeat(3)}-8${digit.repeat(3)}-${digit.repeat(12)}`,
    title,
    createdAt: hoursAgo(hours),
    updatedAt: hoursAgo(hours),
    automation: null,
  }
}

/** What a row's link preloads when focus rests on it: the conversation and its session. */
function conversationReplies(one: ReturnType<typeof conversationOf>): Replies {
  return {
    [`GET /api/companies/${COMPANY.id}/assistant/conversations/${one.id}`]: ok(
      readAssistantConversation,
      { conversation: { ...one, projectId: null, connections: [] } },
    ),
    ...sessionReplies(one.id, { messages: [], controller: ASSISTANT_CONTROLLER }),
  }
}

/** The owner's conversations, one in each day group, the first with a title that must wrap on a phone. */
function conversationsPage(): Replies {
  const listed = [
    conversationOf(1, 'Comparação das vendas por filial e por vendedor no trimestre inteiro', 0.01),
    conversationOf(2, 'Pedidos do mês', 26),
    conversationOf(3, 'Metas da Matriz', 24 * 4),
    conversationOf(4, 'Estoque parado', 24 * 40),
  ]
  return {
    ...OWNER,
    ...Object.assign({}, ...listed.map(conversationReplies)),
    [`GET /api/companies/${COMPANY.id}/assistant/conversations`]: ok(listAssistantConversations, {
      conversations: listed.map((row) => ({ ...row, project: null })),
      next: { kind: 'END' },
    }),
  }
}

/** Opens what sits in the sidebar, which on a phone is the drawer, closed until asked. */
async function inSidebar(page: Page, name: string | RegExp) {
  if ((page.viewportSize()?.width ?? 0) < 768) {
    await page.getByRole('button', { name: 'Abrir navegação' }).click()
  }
  await page.getByRole('button', { name }).click()
}

// The screens step 12.2 brings: Início, Configurações, the owner's first entry and the account.
export const HOUSE_STATES: State[] = [
  {
    name: 'Início do dono, com o cartão de preparo',
    path: HOME,
    replies: OWNER,
    settle: (p) => waitFor(p, 'Termine de preparar a empresa'),
  },
  {
    name: 'Início do membro',
    path: HOME,
    replies: MEMBER,
    settle: (p) => waitFor(p, 'Ainda sem app'),
  },
  {
    name: 'menu da conta aberto',
    path: HOME,
    replies: MEMBER,
    settle: async (page) => {
      await inSidebar(page, 'Conta de Ana Lima')
      await waitFor(page, 'Sair do Conexus')
    },
  },
  {
    name: 'Conversas, a lista por dia',
    path: `${HOME}/conversations`,
    replies: conversationsPage(),
    settle: async (page) => {
      await page.getByRole('region', { name: 'Antes' }).waitFor()
      await waitFor(page, 'Pedidos do mês')
    },
  },
  {
    name: 'Conversas, nenhuma conversa',
    path: `${HOME}/conversations`,
    replies: OWNER,
    settle: (p) => waitFor(p, 'Nenhuma conversa ainda.'),
  },
  {
    name: 'Configurações, minha conta',
    path: `${SETTINGS}/account`,
    replies: OWNER,
    settle: (p) => waitFor(p, 'Minha conta'),
  },
  {
    name: 'Configurações, busca sem resultado',
    path: `${SETTINGS}/account`,
    replies: OWNER,
    settle: async (page) => {
      if ((page.viewportSize()?.width ?? 0) < 768) {
        await page.getByRole('button', { name: 'Abrir navegação' }).click()
      }
      await page.getByRole('searchbox').fill('nada disso')
      await waitFor(page, 'Nenhuma seção encontrada.')
    },
  },
  {
    name: 'Conhecimento, a memória da empresa',
    path: `${HOME}/knowledge`,
    replies: OWNER,
    settle: (p) => waitFor(p, 'Nenhuma página guardada ainda.'),
  },
  {
    name: 'Conhecimento, a memória da empresa sem permissão',
    path: `${HOME}/knowledge`,
    replies: MEMBER,
    settle: (p) => waitFor(p, 'Só o dono ou um administrador muda a memória da empresa.'),
  },
  {
    name: 'Configurações, geral',
    path: `${SETTINGS}/general`,
    replies: OWNER,
    settle: (p) => waitFor(p, 'Exemplo de endereço'),
  },
  {
    name: 'Configurações, memória observacional',
    path: `${SETTINGS}/observational-memory`,
    replies: OWNER,
    settle: (p) => waitFor(p, 'Modelo do observador'),
  },
  {
    name: 'Configurações, contas de modelo do membro',
    path: `${SETTINGS}/model-accounts`,
    replies: MEMBER,
    settle: (p) => waitFor(p, 'Só o dono ou um administrador muda as contas de modelo'),
  },
  {
    name: 'Configurações, contas de modelo do dono, com contas nas duas partes',
    path: `${SETTINGS}/model-accounts`,
    replies: OWNER_WITH_ACCOUNTS,
    settle: (p) => waitFor(p, 'Sua ordem para Anthropic: Claude pessoal, Claude da empresa'),
  },
  {
    name: 'passo 2, conta de modelo',
    path: `${WELCOME}/model-account`,
    replies: OWNER,
    settle: (p) => waitFor(p, 'Passo 2 de 4'),
  },
  {
    name: 'passo 3, convite recusado',
    path: `${WELCOME}/team`,
    replies: {
      ...OWNER,
      [`POST /api/companies/${COMPANY.id}/invitations`]: failure('MEMBER_EXISTS'),
    },
    settle: async (page) => {
      await page.getByLabel('E-mail').fill('davi@example.test')
      await page.getByRole('button', { name: 'Enviar convite', exact: true }).click()
      await waitFor(page, 'Essa pessoa já está na empresa.')
    },
  },
  {
    name: 'passo 4',
    path: `${WELCOME}/build`,
    replies: { ...OWNER, ...startsOn(COMPANY.id) },
    settle: (p) => waitFor(p, 'Ir para o início sem pedir nada'),
  },
  {
    name: 'Central, estado do Hub',
    path: '/operations/status',
    replies: {
      ...central('NONE'),
      'GET /api/status': ok(getStatus, {
        version: 'v0.3.0',
        lastStart: { state: 'NONE' },
        previousStart: { state: 'NONE' },
      }),
    },
    settle: (p) => waitFor(p, 'v0.3.0'),
  },
]
