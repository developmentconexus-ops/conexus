import { readConversation } from '@conexus/hub-api'
import type { Page } from 'playwright-core'
import { ok } from './layout-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import { WITH_CONVERSATIONS } from './sweep-conversation-states.ts'
import type { State } from './sweep-kit.ts'
import { waitFor } from './sweep-kit.ts'
import { PROJECT_ID } from './sweep-replies.ts'
import type { Said } from './sweep-session.ts'
import { parkedOf, sessionReplies } from './sweep-session.ts'

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
const QUESTIONS = {
  questions: [
    {
      question: 'Quem cadastra as encomendas?',
      options: [{ label: 'Todos (recomendado)' }, { label: 'Só eu' }],
      multiSelect: false,
    },
  ],
}
const PLAN_ARGS = { title: 'App de encomendas', plan: PLAN }
const COMMAND = 'npm test -- --reporter=dot src/encomendas/um-caminho-bem-comprido.test.ts'

const MESSAGES: Said[] = [
  {
    id: 'm1',
    role: 'builder',
    parts: [
      { type: 'data-conexus-thought', data: { seconds: 9 } },
      { type: 'reasoning', reasoning: 'Vou conferir as entregas da padaria.', details: [] },
      {
        type: 'tool-invocation',
        toolInvocation: {
          state: 'result',
          toolCallId: 'q0',
          toolName: 'ask_user',
          args: {
            questions: [
              {
                question: 'Quais dias a padaria entrega?',
                options: [{ label: 'Sábado' }, { label: 'Domingo' }],
                multiSelect: true,
              },
            ],
          },
          result: { answers: [['Sábado', 'Domingo']] },
        },
      },
      {
        type: 'data-conexus-version',
        data: {
          number: 2,
          changed: true,
          files: 9,
          changedFiles: 3,
          check: { state: 'failed', code: 'APP_CHECK_FAILED' },
        },
      },
      {
        type: 'data-conexus-version',
        data: {
          number: 3,
          changed: true,
          files: 9,
          changedFiles: 1,
          check: { state: 'unchecked', code: 'CHECK_PLATFORM_FAILED' },
        },
      },
      {
        type: 'tool-invocation',
        toolInvocation: {
          state: 'result',
          toolCallId: 'c1',
          toolName: 'mastra_workspace_execute_command',
          args: { command: COMMAND },
          result: `18 passaram\n1 falhou: ${'x'.repeat(120)}`,
        },
      },
      {
        type: 'tool-invocation',
        toolInvocation: {
          state: 'call',
          toolCallId: 'q1',
          toolName: 'ask_user',
          args: {
            questions: [
              {
                question: 'Quem cadastra as encomendas?',
                options: [{ label: 'Todos (recomendado)' }, { label: 'Só eu' }],
                multiSelect: false,
              },
            ],
          },
        },
      },
      {
        type: 'tool-invocation',
        toolInvocation: {
          state: 'call',
          toolCallId: 'p1',
          toolName: 'submit_plan',
          args: { title: 'App de encomendas', plan: PLAN },
        },
      },
    ],
    model: 'anthropic/claude-sonnet-4',
    createdAt: '2026-10-22T12:01:00.000Z',
  },
]

const PARKED = parkedOf(
  { toolCallId: 'q1', toolName: 'ask_user', args: QUESTIONS },
  { toolCallId: 'p1', toolName: 'submit_plan', args: PLAN_ARGS },
)
const CARDS = readConversation.success.body.parse({
  conversation: {
    id: ID,
    title: 'Encomendas',
    createdAt: '2026-10-22T12:00:00.000Z',
    model: 'anthropic/claude-sonnet-4',
    effort: 'off',
    tasks: [
      { id: '1', content: 'Montar a tabela', activeForm: 'Montando', status: 'completed' },
      { id: '2', content: 'Fazer a tela', activeForm: 'Fazendo a tela', status: 'in_progress' },
      { id: '3', content: 'Conferir', activeForm: 'Conferindo', status: 'pending' },
    ],
  },
})

const REPLIES = {
  ...WITH_CONVERSATIONS,
  [`GET ${API}`]: ok(readConversation, CARDS),
  // The cards wait on the person: Mastra's display state holds their calls.
  ...sessionReplies(ID, { messages: MESSAGES, display: { pendingSuspensions: PARKED } }),
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
    name: 'Conversa, a pergunta respondida, a versão que não montou e a sem conferência',
    path: PATH,
    replies: REPLIES,
    settle: async (page) => {
      await inChat(page)
      await page.getByText('Sábado, Domingo').scrollIntoViewIfNeeded()
      await waitFor(page, 'O app não passou na conferência depois de 4 tentativas.')
      await waitFor(page, 'Não consegui conferir o app.')
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
      await waitFor(page, '1 falhou')
    },
  },
]
