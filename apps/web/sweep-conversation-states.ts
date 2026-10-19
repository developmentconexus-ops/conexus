import { listConversations, listModelAccounts, readConversation } from '@conexus/hub-api'
import { ok } from './layout-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import type { State } from './sweep-kit.ts'
import { waitFor } from './sweep-kit.ts'
import { OWNER, PROJECT_ID } from './sweep-replies.ts'

const CONVERSATIONS = `/companies/${COMPANY.id}/projects/${PROJECT_ID}/conversations`
const API = `/api/companies/${COMPANY.id}/projects/${PROJECT_ID}/conversations`
const ID = '11111111-1111-4111-8111-111111111111'
const TITLE = 'Comparação de dois apps de encomenda de padaria com um título bem comprido mesmo'
const LONG_WORD =
  'https://padaria.example.test/pedidos/com/um/endereco/muito/comprido/que/nao/quebra'

const ANSWER = [
  'Encontrei **dois** apps:',
  '',
  '- o primeiro cobra por pedido, com um nome comprido que precisa quebrar a linha no telefone',
  '- o segundo tem `plano mensal`',
  '',
  '```',
  `linha de código bem comprida que rola dentro do bloco e não pela página ${LONG_WORD}`,
  '```',
].join('\n')

const CONVERSATION = readConversation.success.body.parse({
  conversation: {
    id: ID,
    title: TITLE,
    createdAt: '2026-10-19T12:00:00.000Z',
    model: 'anthropic/claude-sonnet-4',
    messages: [
      {
        id: 'm1',
        role: 'person',
        parts: [{ type: 'text', text: `Compare dois apps de encomenda de padaria ${LONG_WORD}` }],
        createdAt: '2026-10-19T12:00:00.000Z',
      },
      {
        id: 'm2',
        role: 'builder',
        parts: [
          { type: 'notice', text: 'Time 3 foi recusada. Ligue de novo; continuei pela Time 1.' },
          { type: 'page', url: LONG_WORD, title: null },
          { type: 'text', text: ANSWER },
        ],
        createdAt: '2026-10-19T12:01:00.000Z',
      },
    ],
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
        linkedAt: '2026-10-19T12:00:00.000Z',
        assignees: [],
        revision: 0,
      },
    ],
    order: [{ provider: 'anthropic', accounts: ['00000000-0000-4000-8000-000000000001'] }],
    kinds: [],
    defaultModel: null,
    fallback: { enabled: false, chain: [], revision: 0 },
    mayManage: true,
  }),
}

const OPEN = {
  [`GET ${API}/${ID}`]: ok(readConversation, CONVERSATION),
  // An empty line: the screen opens it again after a pause, and the reply stays the same.
  [`GET ${API}/${ID}/events`]: { status: 200 },
}

export const CONVERSATION_STATES: State[] = [
  {
    name: 'Conversas, vazio',
    path: CONVERSATIONS,
    replies: {
      ...OWNER,
      [`GET ${API}`]: ok(listConversations, { conversations: [], next: { kind: 'END' } }),
    },
    settle: (p) => waitFor(p, 'Nenhuma conversa'),
  },
  {
    name: 'Conversas, com título e sem título',
    path: CONVERSATIONS,
    replies: {
      ...OWNER,
      [`GET ${API}`]: ok(listConversations, {
        conversations: [
          { id: ID, title: TITLE, createdAt: '2026-10-19T12:00:00.000Z' },
          {
            id: '22222222-2222-4222-8222-222222222222',
            title: null,
            createdAt: '2026-10-19T13:00:00.000Z',
          },
        ],
        next: { kind: 'END' },
      }),
    },
    settle: (p) => waitFor(p, 'Comparação de dois apps'),
  },
  {
    name: 'Conversa, com a resposta do Builder',
    path: `${CONVERSATIONS}/${ID}`,
    replies: { ...WITH_ACCOUNT, ...OPEN },
    settle: (p) => waitFor(p, 'Encontrei'),
  },
  {
    name: 'Conversa, sem conta de modelo',
    path: `${CONVERSATIONS}/${ID}`,
    replies: { ...OWNER, ...OPEN },
    settle: (p) => waitFor(p, 'Nenhuma conta que você pode usar atende a este modelo.'),
  },
]
