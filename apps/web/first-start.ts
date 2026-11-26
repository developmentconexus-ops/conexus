import {
  BUILDER_CONTROLLER,
  CONVERSATION_ROUTES,
  createConversation,
  createProject,
  readConversation,
} from '@conexus/hub-api'
import type { Page } from 'playwright-core'
import type { Replies } from './layout-harness.ts'
import { ok } from './layout-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import { OWNER, PROJECT_ID, PROJECT_NAME, projectsPage, startsOn } from './sweep-replies.ts'
import { sessionReplies } from './sweep-session.ts'

// The first entry's last step, shared by the tests that start the first Projeto from its box.
export const CONVERSATION_ID = '33333333-3333-4333-8333-333333333333'
const PROJECT_API = `/api/companies/${COMPANY.id}/projects/${PROJECT_ID}`
export const MESSAGES = `${CONVERSATION_ROUTES}/agent-controller/${BUILDER_CONTROLLER}/sessions/${CONVERSATION_ID}/messages`
// The Builder's box is the first entry's last step, where the owner starts the first Projeto.
export const BUILD = `/companies/${COMPANY.id}/welcome/build`
export const REQUEST = 'Um app de encomendas com cliente, data de entrega e valor'
const CREATED_AT = '2026-10-27T12:00:00.000Z'

/** The Builder's box creates the Projeto and its conversation, which opens and sends; `sent` holds that send. */
export function starting(sent: Promise<unknown>): Replies {
  return {
    ...OWNER,
    ...projectsPage(COMPANY.id),
    ...startsOn(COMPANY.id),
    [`POST /api/companies/${COMPANY.id}/projects`]: ok(createProject, {
      project: {
        id: PROJECT_ID,
        name: PROJECT_NAME,
        createdAt: CREATED_AT,
        mayDelete: true,
        mayPublish: true,
        publishRequest: null,
        address: 'pedidos--empresa-teste.apps.example.test',
        previewAddress: 'pedidos--empresa-teste--previa.apps.example.test',
        appVersion: null,
        publishedVersion: null,
      },
    }),
    [`POST ${PROJECT_API}/conversations`]: ok(createConversation, {
      conversation: {
        id: CONVERSATION_ID,
        title: null,
        createdAt: CREATED_AT,
        model: 'anthropic/claude-sonnet-4',
      },
    }),
    [`GET ${PROJECT_API}/conversations/${CONVERSATION_ID}`]: ok(readConversation, {
      conversation: { id: CONVERSATION_ID, title: null, createdAt: CREATED_AT },
    }),
    ...sessionReplies(CONVERSATION_ID, {}),
    [`POST ${MESSAGES}`]: { status: 200, json: { ok: true }, hold: sent },
  }
}

/** The request written in the Builder's box, **Enviar**, the name, **Criar e começar**: the conversation opens. */
export async function start(page: Page) {
  await page.getByRole('textbox', { name: 'Mensagem para o Conexus' }).fill(REQUEST)
  await page.getByRole('button', { name: 'Enviar' }).click()
  await page.getByLabel('Nome do projeto').fill('Pedidos')
  await page.getByRole('button', { name: 'Criar e começar' }).click()
  await page.waitForURL((url) => url.pathname.endsWith(`/conversations/${CONVERSATION_ID}`))
}
