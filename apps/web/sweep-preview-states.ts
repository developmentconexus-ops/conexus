import type { Page } from 'playwright-core'
import { COMPANY } from './src/platform/fixtures.ts'
import { ID, WITH_CONVERSATIONS } from './sweep-conversation-states.ts'
import type { State } from './sweep-kit.ts'
import { waitFor } from './sweep-kit.ts'
import { OWNER, PROJECT_ID, projectsPage } from './sweep-replies.ts'
import type { Said } from './sweep-session.ts'
import { sessionReplies } from './sweep-session.ts'

const PROJECT = `/companies/${COMPANY.id}/projects/${PROJECT_ID}`
const WITH_APP = { ...OWNER, ...projectsPage(COMPANY.id, { appVersion: 3 }) }
const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 26_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.6 Mobile/15E148 Safari/604.1'

const ASKED: Said = {
  id: 'm1',
  role: 'person',
  parts: [{ type: 'text', text: 'Crie um app de encomendas com cliente e data de entrega.' }],
  model: null,
  createdAt: '2026-10-19T12:00:00.000Z',
}

/** The Builder's turn that ended with `parts`. */
function answered(...parts: Said['parts']): Said {
  return {
    id: 'm2',
    role: 'builder',
    parts,
    model: 'anthropic/claude-sonnet-4',
    createdAt: '2026-10-19T12:01:00.000Z',
  }
}

const VERSION = {
  number: 2,
  changed: true,
  files: 9,
  changedFiles: 2,
  check: { state: 'passed' },
} as const

function turnOf(parts: Said['parts'], display?: Record<string, unknown>) {
  return {
    ...WITH_CONVERSATIONS,
    ...projectsPage(COMPANY.id, { appVersion: 2 }),
    ...sessionReplies(ID, { messages: [ASKED, answered(...parts)], display }),
  }
}

async function framed(page: Page) {
  await page.getByTitle('Prévia').waitFor()
  await page.frameLocator('iframe[title="Prévia"]').getByText('Maria, bolo de cenoura').waitFor()
}

/** On a phone the conversation is the other region of "App | Conversa". */
async function inChat(page: Page, text: string) {
  if ((page.viewportSize()?.width ?? 0) < 768) {
    await page.getByRole('button', { name: 'Conversa', exact: true }).click()
  }
  await waitFor(page, text)
}

export const PREVIEW_STATES: State[] = [
  {
    name: 'Projeto, Prévia com o app',
    path: PROJECT,
    replies: WITH_APP,
    settle: framed,
  },
  {
    name: 'Projeto, Prévia no Celular',
    path: PROJECT,
    replies: WITH_APP,
    settle: async (page) => {
      await framed(page)
      // Under `md` the bar has no Computador or Celular.
      if ((page.viewportSize()?.width ?? 0) >= 768) {
        await page.getByRole('button', { name: 'Celular', exact: true }).click()
      }
    },
  },
  {
    name: 'Projeto, Prévia no WebKit da Apple',
    path: PROJECT,
    replies: WITH_APP,
    userAgent: IPHONE,
    settle: async (page) => {
      await framed(page)
      await waitFor(page, 'O app pode não abrir aqui dentro neste navegador.')
    },
  },
  {
    name: 'Conversa, subindo o app',
    path: `${PROJECT}/conversations/${ID}`,
    // Opened mid-send: the wait shows only while the turn runs.
    replies: turnOf(
      [
        { type: 'data-conexus-version', data: VERSION },
        { type: 'data-conexus-preview', data: { state: 'sending', number: 2 } },
      ],
      { isRunning: true },
    ),
    settle: (p) => inChat(p, 'Subindo o app…'),
  },
  {
    name: 'Conversa, com a Prévia pronta',
    path: `${PROJECT}/conversations/${ID}`,
    replies: turnOf([
      { type: 'data-conexus-version', data: VERSION },
      { type: 'data-conexus-preview', data: { state: 'ready', number: 2 } },
    ]),
    settle: (p) => inChat(p, 'Prévia pronta.'),
  },
  {
    name: 'Conversa, com a Prévia que não subiu',
    path: `${PROJECT}/conversations/${ID}`,
    replies: turnOf([
      {
        type: 'data-conexus-preview',
        data: { state: 'failed', number: 2, code: 'APP_VERSION_NOT_STARTING' },
      },
    ]),
    settle: (p) => inChat(p, 'Prévia não atualizada:'),
  },
  {
    name: 'Conversa, com a Prévia que o banco recusou',
    path: `${PROJECT}/conversations/${ID}`,
    replies: turnOf([
      {
        type: 'data-conexus-preview',
        data: {
          state: 'failed',
          number: 7,
          code: 'APP_MIGRATION_FAILED',
          cause: {
            kind: 'database',
            sqlstate: '23505',
            table: 'encomenda',
            constraint: 'encomenda_whatsapp_key',
          },
        },
      },
    ]),
    settle: (p) => inChat(p, 'Pedir ao Builder para corrigir'),
  },
  {
    name: 'Conversa, com a Prévia que a lista fixa recusou',
    path: `${PROJECT}/conversations/${ID}`,
    replies: turnOf([
      {
        type: 'data-conexus-preview',
        data: {
          state: 'failed',
          number: 7,
          code: 'APP_MIGRATION_REFUSED',
          cause: {
            kind: 'rule',
            migration: '004_publico',
            statement: 1,
            subject: 'dar ou tirar permissão de acesso',
          },
        },
      },
    ]),
    settle: (p) => inChat(p, 'Pedir ao Builder para corrigir'),
  },
  {
    name: 'Conversa, com a Prévia que a garantia recusou por linhas apagadas',
    path: `${PROJECT}/conversations/${ID}`,
    replies: turnOf([
      {
        type: 'data-conexus-preview',
        data: {
          state: 'failed',
          number: 7,
          code: 'APP_MIGRATION_FAILED',
          cause: { kind: 'database', sqlstate: 'CX002', table: 'recado' },
        },
      },
    ]),
    settle: (p) => inChat(p, 'Pedir ao Builder para corrigir'),
  },
]
