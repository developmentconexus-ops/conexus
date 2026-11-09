import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import {
  CONSTRUTOR_CONTROLLER,
  listAgents,
  listConstrutorConversations,
  listModelAccounts,
  listTools,
} from '@conexus/hub-api'
import { holdsColumn, LAPTOP } from './chat-column.ts'
import { createHarness, DESKTOP, ok, PHONE, ZOOMED_PHONE } from './layout-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import { connectionsPage } from './sweep-connections.ts'
import { WITH_ACCOUNT } from './sweep-conversation-states.ts'
import { PROJECT_ID, PROJECT_NAME, projectsPage } from './sweep-replies.ts'
import { sessionReplies } from './sweep-session.ts'

// The Construtor's boxes, at the start and in a conversation: the model's button inside the box, the
// Projeto's folder out of it, and nothing past the edge at any width (design V18, testing T23).
const harness = createHarness(import.meta.dirname)
before(() => harness.start())
after(async () => {
  await harness.stop()
  assert.deepEqual(harness.unanswered, [], 'the page asked the Hub for something no reply covers')
})

const CONVERSATION = '55555555-5555-4555-8555-555555555555'
const BASE = `/api/companies/${COMPANY.id}/projects/${PROJECT_ID}`
const AREA = `/companies/${COMPANY.id}/projects/${PROJECT_ID}/agents`
const ACCOUNTS = `GET /api/companies/${COMPANY.id}/model-accounts`
const accounts = WITH_ACCOUNT[ACCOUNTS]
if (accounts?.json === undefined) throw new Error('the account replies lack the accounts read')

const replies = {
  ...WITH_ACCOUNT,
  ...projectsPage(COMPANY.id),
  ...connectionsPage(COMPANY.id, true, []),
  [ACCOUNTS]: ok(listModelAccounts, {
    ...Object(accounts.json),
    defaults: {
      company: null,
      mine: null,
      start: {
        model: 'anthropic/claude-sonnet-4',
        effort: 'off',
        from: 'mine',
        account: '00000000-0000-4000-8000-000000000001',
      },
      companyStart: null,
    },
  }),
  [`GET /api/companies/${COMPANY.id}/agents`]: ok(listAgents, { agents: [] }),
  [`GET ${BASE}/tools`]: ok(listTools, { tools: [], ready: [] }),
  [`GET ${BASE}/construtor/conversations`]: ok(listConstrutorConversations, {
    conversations: [
      { id: CONVERSATION, title: 'Meu agente', updatedAt: '2026-11-02T12:00:00.000Z' },
    ],
  }),
  ...sessionReplies(CONVERSATION, { controller: CONSTRUTOR_CONTROLLER }),
}

for (const viewport of [DESKTOP, PHONE, ZOOMED_PHONE]) {
  for (const [where, path] of [
    ['a caixa de começar', AREA],
    ['a caixa da conversa', `${AREA}/construtor/${CONVERSATION}`],
  ] as const) {
    test(`${where} do Construtor, a ${viewport.width}px, tem o botão do modelo dentro, sem a pasta do Projeto e sem rolar para o lado`, async () => {
      const page = await harness.open(path, { viewport, replies })
      const picker = page.locator('form').getByRole('combobox', { name: 'Modelo e raciocínio' })
      await picker.waitFor()
      const form = await page.locator('form').first().boundingBox()
      const button = await picker.boundingBox()
      assert.ok(form && button, 'the box is not laid out')
      assert.ok(
        button.x >= form.x && button.x + button.width <= form.x + form.width + 1,
        'the model button left the box',
      )
      assert.equal(await page.locator('form').getByText(PROJECT_NAME).count(), 0)
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth),
        viewport.width,
        'the page scrolls sideways',
      )
      await page.close()
    })
  }
}

// The founder, 2026-11-09: the box moved and the scroll took it along (design V54).
for (const viewport of [LAPTOP, PHONE])
  test(`a ${viewport.width} px, na conversa do Construtor, quem rola é a conversa e a caixa fica onde estava`, async () => {
    const page = await harness.open(`${AREA}/construtor/${CONVERSATION}`, { viewport, replies })
    await holdsColumn(page, viewport)
    await page.close()
  })
