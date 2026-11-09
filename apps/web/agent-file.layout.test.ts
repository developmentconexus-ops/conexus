import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import {
  AGENTS_CONTROLLER,
  getAgent,
  listAgentConversations,
  listAgentVersions,
  listOpenWrites,
  listTools,
  MACHINE_TOOL,
} from '@conexus/hub-api'
import type { Page } from 'playwright-core'
import { createHarness, DESKTOP, ok, PHONE } from './layout-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import { connectionsPage } from './sweep-connections.ts'
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
const CONNECTION = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const BASE = `/api/companies/${COMPANY.id}/projects/${PROJECT_ID}`
const DRAFT = {
  name: 'Vendas',
  description: 'Compara as vendas com as metas.',
  instructions: 'Diga quem vendeu mais.',
  model: null,
  memory: { observational: true },
  connections: [CONNECTION],
  web: false,
  appData: false,
  byTool: true,
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
  offered: [
    {
      connectionId: CONNECTION,
      connector: 'sankhya',
      name: 'Matriz',
      reads: [{ operation: 'pedidos', label: 'Pedidos', summary: 'Pedidos de venda.' }],
      writes: [],
    },
  ],
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
  ...connectionsPage(COMPANY.id, true),
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
        createdAt: '2026-11-05T12:01:00.000Z',
        updatedAt: '2026-11-05T12:01:00.000Z',
      },
    ],
  }),
  [`GET ${BASE}/agents/${AGENT}/conversations/${CHAT}/open-writes`]: ok(listOpenWrites, {
    writes: [],
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

// Opening the file widens the test panel (the founder chose it, 24.4 U4): at 1366 the conversation
// keeps at least 320 px and the file 260 px (before: ~200 and ~180), and closing gives the width back.
const MIN_CHAT = 320
const MIN_FILE = 260
function widthOf(page: Page, selector: string) {
  return page.locator(selector).evaluate((element) => element.getBoundingClientRect().width)
}

// The panel resizes after the file shows: wait, up to a deadline, for the width to arrive.
async function until(
  page: Page,
  selector: string,
  ok: (width: number) => boolean,
  message: string,
) {
  const deadline = Date.now() + 5000
  let width = await widthOf(page, selector)
  while (!ok(width) && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 50))
    width = await widthOf(page, selector)
  }
  assert.ok(ok(width), `${message} (${width} px)`)
}

test('a 1366 px, o arquivo alarga o painel de teste e, fechado, ele volta', async () => {
  const page = await harness.open(
    `/companies/${COMPANY.id}/projects/${PROJECT_ID}/agents/${AGENT}/${CHAT}`,
    { viewport: DESKTOP, replies },
  )
  await page.route('**/agents/conversations/*/files*', (route) =>
    route.fulfill({ status: 200, contentType: 'image/svg+xml', body: CHART }),
  )
  const test = '[data-slot="resizable-panel"][id="test"]'
  const chat = '[id="conexus-agent-file"] [id="chat"]'
  const side = '[id="conexus-agent-file"] [id="side"]'
  await page.getByRole('button', { name: /^Abrir vendas/ }).waitFor()
  const before = await widthOf(page, test)
  await page.getByRole('button', { name: /^Abrir vendas/ }).click()
  await page.getByRole('img', { name: /vendas/ }).waitFor()
  await until(page, chat, (width) => width >= MIN_CHAT, 'a conversa ficou estreita')
  await until(page, side, (width) => width >= MIN_FILE, 'o arquivo ficou estreito')
  await page.getByRole('button', { name: /^Fechar/ }).click()
  await page.getByRole('img', { name: /vendas/ }).waitFor({ state: 'detached' })
  await until(page, test, (width) => Math.abs(width - before) <= 2, 'o painel não voltou')
  assert.deepEqual(page.problems, [])
  await page.close()
})

// The two scenes the founder is shown beside the file's (step 24.4, U4): choosing the Computador in
// the library's list, and its row among the agent's tools with the connection it reads.
for (const viewport of [DESKTOP, PHONE]) {
  test(`a ${viewport.width} px, o Computador ligado aparece na lista da biblioteca e entre as ferramentas, com a ligação do agente`, async () => {
    const page = await harness.open(
      `/companies/${COMPANY.id}/projects/${PROJECT_ID}/agents/${AGENT}`,
      { viewport, replies },
    )
    const connection = page.getByRole('checkbox', { name: 'Sankhya · Matriz' })
    await connection.waitFor()
    assert.equal(await connection.isChecked(), true, 'a ligação do agente não está ligada')
    const tools = page.getByRole('region', { name: 'Ferramentas' })
    await tools.getByRole('button', { name: 'Tirar Computador' }).waitFor()
    await tools.getByRole('button', { name: 'Adicionar da biblioteca', exact: true }).click()
    const dialog = page.getByRole('dialog')
    assert.equal(await dialog.getByRole('switch', { name: 'Computador' }).isChecked(), true)
    assert.equal(await dialog.getByRole('switch', { name: 'Pesquisar na web' }).isChecked(), false)
    await dialog.getByRole('button', { name: 'Usar as escolhidas' }).waitFor()
    await dialog.getByRole('button', { name: 'Cancelar' }).waitFor()
    assert.deepEqual(page.problems, [])
    await page.close()
  })
}
