import { readConversation } from '@conexus/hub-api'
import type { Page } from 'playwright-core'
import { ok } from './layout-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import { WITH_CONVERSATIONS } from './sweep-conversation-states.ts'
import type { State } from './sweep-kit.ts'
import { waitFor } from './sweep-kit.ts'
import { PROJECT_ID } from './sweep-replies.ts'

const ID = '33333333-3333-4333-8333-333333333333'
const PATH = `/companies/${COMPANY.id}/projects/${PROJECT_ID}/conversations/${ID}`
const API = `/api/companies/${COMPANY.id}/projects/${PROJECT_ID}/conversations/${ID}`
const PLAN = [
  '## Para a pessoa',
  '',
  'Um app de encomendas com cliente, telefone, produto e data de entrega.',
  ...Array.from({ length: 12 }, (_, at) => `- Passo ${at + 1}: uma tela que cabe no telefone`),
  '',
  '## Para o Builder',
  '',
  'A tabela `encomenda` e as operações de listar e criar.',
].join('\n')
const COMMAND = 'npm test -- --reporter=dot src/encomendas/um-caminho-bem-comprido.test.ts'

const CARDS = readConversation.success.body.parse({
  conversation: {
    id: ID,
    title: 'Encomendas',
    createdAt: '2026-10-22T12:00:00.000Z',
    model: 'anthropic/claude-sonnet-4',
    effort: 'off',
    messages: [
      {
        id: 'm1',
        role: 'builder',
        parts: [
          { type: 'reasoning', id: 'r1', state: 'completed', seconds: 9 },
          {
            type: 'tool',
            id: 'c1',
            kind: 'run_command',
            state: 'completed',
            subject: { command: COMMAND },
            detail: {
              kind: 'command',
              command: COMMAND,
              output: ['18 passaram', `1 falhou: ${'x'.repeat(120)}`],
              exitCode: 1,
              cut: true,
            },
          },
          {
            type: 'tasks',
            items: [
              { id: '1', content: 'Montar a tabela', activeForm: 'Montando', status: 'completed' },
              {
                id: '2',
                content: 'Fazer a tela',
                activeForm: 'Fazendo a tela',
                status: 'in_progress',
              },
              { id: '3', content: 'Conferir', activeForm: 'Conferindo', status: 'pending' },
            ],
          },
          {
            type: 'question',
            toolCallId: 'q1',
            state: 'open',
            questions: [
              {
                kind: 'choice',
                question: 'Quem cadastra as encomendas?',
                options: [{ label: 'Todos (recomendado)' }, { label: 'Só eu' }],
                multiSelect: false,
              },
              {
                kind: 'library',
                question: 'Preciso da biblioteca react-big-calendar (≈ 300 KB). Permitir?',
                name: 'react-big-calendar',
                version: '1.19.4',
              },
            ],
          },
          { type: 'plan', toolCallId: 'p1', title: 'App de encomendas', plan: PLAN, state: 'open' },
        ],
        model: 'anthropic/claude-sonnet-4',
        createdAt: '2026-10-22T12:01:00.000Z',
      },
    ],
  },
})

const REPLIES = {
  ...WITH_CONVERSATIONS,
  [`GET ${API}`]: ok(readConversation, CARDS),
  [`GET ${API}/events`]: { status: 200 },
}

/** On a phone the conversation is the other region of "App | Conversa". */
async function inChat(page: Page) {
  if ((page.viewportSize()?.width ?? 0) < 768) {
    await page.getByRole('button', { name: 'Conversa', exact: true }).click()
  }
  await waitFor(page, 'Quem cadastra as encomendas?')
}

/** The cards of step 14 on the thread: the questions, the plan, the tasks and a row that opens. */
export const CARD_STATES: State[] = [
  {
    name: 'Conversa, com os cartões de perguntas, plano e tarefas',
    path: PATH,
    replies: REPLIES,
    settle: async (page) => {
      await inChat(page)
      await page.getByRole('button', { name: 'Ler plano completo' }).waitFor()
    },
  },
  {
    name: 'Conversa, o plano inteiro aberto',
    path: PATH,
    replies: REPLIES,
    settle: async (page) => {
      await inChat(page)
      await page.getByRole('button', { name: 'Ler plano completo' }).click()
      await page.getByRole('dialog', { name: 'Plano: App de encomendas' }).waitFor()
    },
  },
  {
    name: 'Conversa, a linha do comando aberta',
    path: PATH,
    replies: REPLIES,
    settle: async (page) => {
      await inChat(page)
      await page.getByRole('button', { name: /Rodou um comando/ }).click()
      await waitFor(page, 'O comando terminou com o código 1.')
    },
  },
]
