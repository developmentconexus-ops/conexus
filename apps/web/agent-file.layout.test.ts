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
const SHOWN = {
  type: 'tool-invocation',
  toolInvocation: {
    state: 'result',
    toolCallId: 'c1',
    toolName: MACHINE_TOOL.showFile,
    args: { path: 'vendas.md' },
    result: {
      kind: 'TEXT',
      path: 'vendas.md',
      name: 'vendas.md',
      media: 'text/markdown',
      content: '# Vendas de setembro\n\n- Ana: 12.400',
    },
  },
}
const MESSAGES = [
  {
    id: 'm1',
    role: 'builder' as const,
    parts: [SHOWN, { type: 'text', text: 'Escrevi o relatório e deixei ao lado.' }],
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
      message: '',
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
        title: 'Relatório',
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
    await page.getByRole('button', { name: /^Abrir vendas/ }).click()
    await page.getByText('Vendas de setembro', { exact: true }).waitFor()
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth),
      viewport.width,
      'a página rola para o lado',
    )
    assert.deepEqual(page.problems, [])
    await page.close()
  })
