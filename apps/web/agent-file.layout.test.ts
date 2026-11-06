import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import {
  AGENTS_CONTROLLER,
  getAgent,
  listAgentConversations,
  listAgentVersions,
  listTools,
  MACHINE_TOOL,
} from '@conexus/hub-api'
import { createHarness, DESKTOP, ok, PHONE } from './layout-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import { WITH_ACCOUNT } from './sweep-conversation-states.ts'
import { PROJECT_ID, projectsPage } from './sweep-replies.ts'
import { sessionReplies } from './sweep-session.ts'

// The file an agent's Computador shows beside its conversation (step 24.4, U4), in a real browser:
// the agent page already owns a resizable group, and the file's own must not share its id.
const harness = createHarness(import.meta.dirname)
before(() => harness.start())
after(async () => {
  await harness.stop()
  assert.deepEqual(harness.unanswered, [], 'the page asked the Hub for something no reply covers')
})

const AGENT = '11111111-aaaa-4aaa-8aaa-111111111111'
const CHAT = '66666666-aaaa-4aaa-8aaa-666666666666'
const CHART = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" width="320" height="200"><rect width="320" height="200" fill="#fff"/><g fill="#5b3fd1"><rect x="40" y="60" width="50" height="110"/><rect x="135" y="85" width="50" height="85"/><rect x="230" y="30" width="50" height="140"/></g><g font-family="sans-serif" font-size="12" fill="#222" text-anchor="middle"><text x="65" y="188">Ana</text><text x="160" y="188">Bruno</text><text x="255" y="188">Carla</text><text x="160" y="20" font-size="14">Vendas de setembro</text></g></svg>`
const BASE = `/api/companies/${COMPANY.id}/projects/${PROJECT_ID}`
const DRAFT = {
  name: 'Vendas',
  description: 'Compara as vendas com as metas.',
  instructions: 'Diga quem vendeu mais.',
  model: null,
  memory: { observational: true },
  connections: [],
  web: false,
  appData: false,
  machine: true,
}
const DETAIL = {
  id: AGENT,
  projectId: PROJECT_ID,
  ...DRAFT,
  state: { kind: 'PUBLISHED' as const, version: 3, changed: false },
  updatedAt: '2026-11-02T12:00:00.000Z',
  lastRunAt: null,
  draft: DRAFT,
  revision: 4,
  tools: [],
  offered: [],
  createdBy: null,
}
const MESSAGES = [
  {
    id: 'm1',
    role: 'person' as const,
    parts: [{ type: 'text', text: 'Faça um gráfico das vendas de setembro por vendedor.' }],
    createdAt: '2026-11-05T12:00:00.000Z',
  },
  {
    id: 'm2',
    role: 'builder' as const,
    parts: [
      {
        type: 'tool-invocation',
        toolInvocation: {
          state: 'result',
          toolCallId: 'c1',
          toolName: MACHINE_TOOL.showFile,
          args: { path: 'vendas.svg' },
          result: {
            kind: 'FILE',
            path: 'vendas.svg',
            name: 'vendas.svg',
            media: 'image/svg+xml',
            bytes: CHART.length,
          },
        },
      },
      { type: 'text', text: 'Fiz o gráfico na máquina e deixei ao lado.' },
    ],
    model: 'anthropic/claude-sonnet-4',
    createdAt: '2026-11-05T12:01:00.000Z',
  },
]
const replies = {
  ...WITH_ACCOUNT,
  ...projectsPage(COMPANY.id),
  [`GET ${BASE}/agents/${AGENT}`]: ok(getAgent, { agent: DETAIL }),
  [`GET ${BASE}/agents/${AGENT}/versions`]: ok(listAgentVersions, {
    versions: [3, 2, 1].map((number) => ({
      number,
      message: number === 3 ? 'Com o Computador' : '',
      active: number === 3,
      publishedAt: `2026-11-0${number}T12:00:00.000Z`,
      publishedBy: null,
    })),
  }),
  [`GET ${BASE}/tools`]: ok(listTools, { tools: [], ready: [] }),
  [`GET ${BASE}/agents/${AGENT}/conversations`]: ok(listAgentConversations, {
    conversations: [
      {
        id: CHAT,
        agentId: AGENT,
        draft: false,
        title: 'Gráfico de vendas',
        updatedAt: '2026-11-05T12:01:00.000Z',
      },
    ],
  }),
  ...sessionReplies(CHAT, { messages: MESSAGES, controller: AGENTS_CONTROLLER }),
}

for (const viewport of [DESKTOP, PHONE])
  test(`a ${viewport.width} px, o arquivo do Computador abre ao lado da conversa do agente e nada quebra`, async () => {
    const page = await harness.open(
      `/companies/${COMPANY.id}/projects/${PROJECT_ID}/agents/${AGENT}/${CHAT}`,
      { viewport, replies },
    )
    await page.route('**/agents/conversations/*/files*', (route) =>
      route.fulfill({ status: 200, contentType: 'image/svg+xml', body: CHART }),
    )
    await page.getByRole('button', { name: /^Abrir vendas/ }).click()
    await page.getByRole('img', { name: /vendas/ }).waitFor()
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth),
      viewport.width,
      'a página rola para o lado',
    )
    assert.deepEqual(page.problems, [])
    await page.close()
  })
