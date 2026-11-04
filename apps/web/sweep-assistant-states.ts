import {
  ASSISTANT_CONTROLLER,
  ASSISTANT_TOOL,
  BUILDER_TOOL,
  readAssistantConversation,
} from '@conexus/hub-api'
import type { Page } from 'playwright-core'
import { failure, ok } from './layout-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import { WITH_ACCOUNT } from './sweep-conversation-states.ts'
import type { State } from './sweep-kit.ts'
import { waitFor } from './sweep-kit.ts'
import { PROJECT_ID } from './sweep-replies.ts'
import type { Said } from './sweep-session.ts'
import { sessionReplies } from './sweep-session.ts'

// The Assistant's conversation in the sweep: its rows, its box's folder and tools, the file beside it
// (over it, on a phone) and Criar app (step 24.1, F32).
const ID = '33333333-3333-4333-8333-333333333333'
export const ASSISTANT_PATH = `/companies/${COMPANY.id}/conversations/${ID}`
const LONG_NAME = 'Filial de Campinas com um nome de ligação bem comprido'
const READ = { operation: 'sankhya.consultar', connection: LONG_NAME }
const SUMMARY =
  'Um app de encomendas para a padaria: quem pediu, o que, a data de entrega e o valor, lido do Sankhya e com um painel dos pedidos da semana.'

function tool(toolName: string, args: unknown, result: unknown, id: string) {
  return {
    type: 'tool-invocation' as const,
    toolInvocation: { state: 'result' as const, toolCallId: id, toolName, args, result },
  }
}

const BRIEFING =
  '## Quem usa\n\nO time de vendas da padaria, todo dia, no celular.\n\n## O que registra\n\n- quem pediu\n- o que pediu\n- a data de entrega'

const MESSAGES: Said[] = [
  {
    id: 'm1',
    role: 'person',
    parts: [{ type: 'text', text: 'Quanto vendemos na semana e como automatizo as encomendas?' }],
    createdAt: '2026-10-19T12:00:00.000Z',
  },
  {
    id: 'm2',
    role: 'builder',
    parts: [
      tool(BUILDER_TOOL.connectorRead, READ, { kind: 'BUSY', waitMs: 90_000 }, 'c1'),
      tool(BUILDER_TOOL.connectorRead, READ, { kind: 'UNREACHABLE' }, 'c2'),
      tool(BUILDER_TOOL.connectorRead, READ, { kind: 'CALLS_SPENT' }, 'c3'),
      tool(
        BUILDER_TOOL.connectorRead,
        READ,
        { kind: 'OK', value: { linhas: [{ a: 1 }] }, complete: false },
        'c4',
      ),
      tool(
        ASSISTANT_TOOL.showFile,
        { path: 'relatorio.md' },
        {
          kind: 'TEXT',
          path: 'relatorio.md',
          name: 'relatorio-de-vendas-da-semana-com-nome-bem-comprido.md',
          media: 'text/markdown',
          content: '# Vendas\n\n- Total da semana: 1.234',
        },
        'c5',
      ),
      tool(
        ASSISTANT_TOOL.proposeApp,
        {},
        { summary: SUMMARY, briefing: { name: 'briefing.md', content: BRIEFING } },
        'c6',
      ),
      { type: 'text', text: 'Resumi o que achei e deixei o relatório ao lado.' },
    ],
    model: 'anthropic/claude-sonnet-4',
    createdAt: '2026-10-19T12:01:00.000Z',
  },
]

export const ASSISTANT_REPLIES = {
  ...WITH_ACCOUNT,
  [`GET /api/companies/${COMPANY.id}/assistant/conversations/${ID}`]: ok(
    readAssistantConversation,
    {
      conversation: {
        id: ID,
        title: 'Vendas da semana',
        updatedAt: '2026-10-19T12:00:00.000Z',
        projectId: null,
        automation: null,
        connections: [
          {
            connectionId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            connector: 'sankhya',
            name: LONG_NAME,
            chosen: true,
          },
          {
            connectionId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
            connector: 'sankhya',
            name: 'Matriz',
            chosen: false,
          },
        ],
      },
    },
  ),
  ...sessionReplies(ID, { messages: MESSAGES, controller: ASSISTANT_CONTROLLER }),
}

async function opened(page: Page) {
  await waitFor(page, 'Resumi o que achei e deixei o relatório ao lado.')
}

const CARD_SPEAKS = [
  {
    id: 'q1',
    role: 'person' as const,
    parts: [{ type: 'text', text: 'Quero um app de encomendas para a padaria.' }],
    createdAt: '2026-10-19T12:00:00.000Z',
  },
]

/** The conversation of `ASSISTANT_REPLIES`, in the company or in a Projeto, with the messages the card needs. */
function cardReplies(projectId: string | null, messages: Said[]) {
  const key = `GET /api/companies/${COMPANY.id}/assistant/conversations/${ID}`
  const read = ASSISTANT_REPLIES[key]
  if (read === undefined) throw new Error('the Assistant replies lack the conversation read')
  return {
    ...ASSISTANT_REPLIES,
    [key]: ok(readAssistantConversation, {
      conversation: {
        id: ID,
        title: 'Vendas da semana',
        updatedAt: '2026-10-19T12:00:00.000Z',
        projectId,
        automation: null,
        connections: [
          {
            connectionId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            connector: 'sankhya',
            name: 'Matriz',
            chosen: true,
          },
        ],
      },
    }),
    ...sessionReplies(ID, { messages, controller: ASSISTANT_CONTROLLER }),
  }
}

function proposed(tool: string): Said {
  return {
    id: 'm-card',
    role: 'builder',
    parts: [
      {
        type: 'tool-invocation',
        toolInvocation: {
          state: 'result',
          toolCallId: 'c-card',
          toolName: tool,
          args: {},
          result: { summary: SUMMARY, briefing: { name: 'briefing.md', content: BRIEFING } },
        },
      },
    ],
    model: 'anthropic/claude-sonnet-4',
    createdAt: '2026-10-19T12:01:00.000Z',
  }
}

const INSIDE = `/companies/${COMPANY.id}/projects/${PROJECT_ID}/assistant/${ID}`
const HANDOFF = `POST /api/companies/${COMPANY.id}/assistant/conversations/${ID}/handoffs`

export const ASSISTANT_STATES: State[] = [
  {
    name: 'Assistente, a conversa com leituras recusadas e o pedido de app',
    path: ASSISTANT_PATH,
    replies: ASSISTANT_REPLIES,
    settle: opened,
  },
  {
    name: 'Assistente, o arquivo aberto ao lado (folha no celular)',
    path: ASSISTANT_PATH,
    replies: ASSISTANT_REPLIES,
    settle: async (page) => {
      await opened(page)
      await page.getByRole('button', { name: /^Abrir relatorio/ }).click()
      await page.getByRole('region', { name: /^relatorio/ }).waitFor()
    },
  },
  {
    name: 'Assistente, a lista das ferramentas aberta',
    path: ASSISTANT_PATH,
    replies: ASSISTANT_REPLIES,
    settle: async (page) => {
      await opened(page)
      await page.locator('form').getByRole('button', { name: '1 ferramenta' }).click()
      await page.getByRole('switch', { name: /Matriz/ }).waitFor()
    },
  },
  {
    name: 'Assistente, o cartão Mandar ao Builder de um Projeto',
    path: INSIDE,
    replies: cardReplies(PROJECT_ID, [...CARD_SPEAKS, proposed(ASSISTANT_TOOL.proposeAppChange)]),
    settle: async (page) => {
      await page.getByRole('button', { name: 'Mandar ao Builder' }).waitFor()
    },
  },
  {
    name: 'Assistente, o cartão do app depois do Continuar aqui, sem botão',
    path: ASSISTANT_PATH,
    replies: cardReplies(null, [
      ...CARD_SPEAKS,
      proposed(ASSISTANT_TOOL.proposeApp),
      {
        id: 'q2',
        role: 'person',
        parts: [{ type: 'text', text: 'Continuar aqui' }],
        createdAt: '2026-10-19T12:02:00.000Z',
      },
    ]),
    settle: async (page) => {
      await waitFor(page, 'Continuar aqui')
      await page.getByText('Quem usa').waitFor()
    },
  },
  {
    name: 'Assistente, o cartão do app com a falha e Tentar de novo',
    path: ASSISTANT_PATH,
    replies: {
      ...cardReplies(null, [...CARD_SPEAKS, proposed(ASSISTANT_TOOL.proposeApp)]),
      [HANDOFF]: failure('HANDOFF_NOT_DELIVERED'),
    },
    settle: async (page) => {
      await page.getByLabel('Nome do projeto').fill('Encomendas')
      await page.getByRole('button', { name: 'Criar app' }).click()
      await page.getByRole('button', { name: 'Tentar de novo' }).waitFor()
    },
  },
  {
    name: 'Assistente, o cartão do app com o nome do Projeto escrito',
    path: ASSISTANT_PATH,
    replies: ASSISTANT_REPLIES,
    settle: async (page) => {
      await opened(page)
      await page.getByLabel('Nome do projeto').fill('Encomendas')
      await page.getByRole('button', { name: 'Criar app' }).waitFor()
    },
  },
]

export { ID as ASSISTANT_ID, MESSAGES as ASSISTANT_MESSAGES }
