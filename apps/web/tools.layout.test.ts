import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { getAgent, listAgentVersions, listTools } from '@conexus/hub-api'
import { createHarness, DESKTOP, ok, PHONE, ZOOMED_PHONE } from './layout-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import { connectionsPage } from './sweep-connections.ts'
import { OWNER, PROJECT_ID, projectsPage } from './sweep-replies.ts'

// The Ferramentas tab as a table: it keeps Versão and Apagar in view at every width, with no
// sideways scroll inside its frame (design V18, testing T23).
const harness = createHarness(import.meta.dirname)
before(() => harness.start())
after(async () => {
  await harness.stop()
  assert.deepEqual(harness.unanswered, [], 'the page asked the Hub for something no reply covers')
})

const TOOL = '33333333-aaaa-4aaa-8aaa-333333333333'
const CONNECTION = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const VERSION = '44444444-aaaa-4aaa-8aaa-444444444444'
const BASE = `/api/companies/${COMPANY.id}/projects/${PROJECT_ID}`

const TOOLS = [
  {
    id: TOOL,
    slug: 'vendas_de_ontem_por_vendedor',
    connectionId: CONNECTION,
    operation: 'pedidos',
    description: 'Vendas de ontem por vendedor.',
    connectionName: 'Matriz',
    readLabel: 'Pedidos',
    effect: 'READ' as const,
    latest: { id: VERSION, number: 12 },
    usedBy: [
      {
        id: '11111111-aaaa-4aaa-8aaa-111111111111',
        projectId: PROJECT_ID,
        name: 'Conferente de metas',
      },
    ],
  },
]

const replies = {
  ...OWNER,
  ...projectsPage(COMPANY.id),
  ...connectionsPage(COMPANY.id, true, []),
  [`GET ${BASE}/tools`]: ok(listTools, { tools: TOOLS, ready: [] }),
}

for (const viewport of [DESKTOP, PHONE, ZOOMED_PHONE]) {
  test(`a lista de ferramentas cabe em ${viewport.width}px sem rolar para o lado, com a versão e o Apagar à vista`, async () => {
    const page = await harness.open(
      `/companies/${COMPANY.id}/projects/${PROJECT_ID}/agents/tools`,
      {
        viewport,
        replies,
      },
    )
    const remove = page.getByRole('button', { name: 'Apagar vendas_de_ontem_por_vendedor' })
    await remove.waitFor()
    const box = await page
      .locator('[data-slot=table-container]')
      .first()
      .evaluate((node) => ({
        scroll: node.scrollWidth,
        client: node.clientWidth,
      }))
    assert.equal(box.scroll, box.client, 'a tabela rola para o lado')
    assert.equal(await page.getByText('v12').isVisible(), true)
    const at = await remove.boundingBox()
    assert.ok(at && at.x + at.width <= viewport.width, 'o Apagar passa da borda')
    await page.close()
  })
}

// The windows of the agent's Ferramentas section on a phone: the list or the fields scroll between the
// title and the footer, and the buttons stay in view (design V23, V18).
const AGENT = '11111111-aaaa-4aaa-8aaa-111111111111'
const LONG = TOOLS.flatMap((tool) =>
  Array.from({ length: 30 }, (_, at) => ({
    ...tool,
    id: `33333333-aaaa-4aaa-8aaa-${String(at).padStart(12, '0')}`,
    slug: `leitura_numero_${at}`,
  })),
)
const DRAFT = {
  name: 'Conferente de metas',
  description: 'Compara as vendas com as metas.',
  instructions: 'Diga quem ficou abaixo da meta.',
  model: null,
  memory: { observational: true },
  connections: [],
  web: false,
  appData: false,
}
const agentReplies = {
  ...replies,
  [`GET ${BASE}/tools`]: ok(listTools, { tools: LONG, ready: [] }),
  [`GET ${BASE}/agents/${AGENT}`]: ok(getAgent, {
    agent: {
      id: AGENT,
      projectId: PROJECT_ID,
      ...DRAFT,
      state: { kind: 'DRAFT' as const },
      updatedAt: '2026-11-02T12:00:00.000Z',
      lastRunAt: null,
      draft: DRAFT,
      revision: 1,
      tools: [],
      offered: [
        {
          connectionId: CONNECTION,
          connector: 'sankhya',
          name: 'Matriz',
          reads: [{ operation: 'pedidos', label: 'Pedidos', summary: 'Pedidos de venda.' }],
        },
      ],
      createdBy: null,
    },
  }),
  [`GET ${BASE}/agents/${AGENT}/versions`]: ok(listAgentVersions, { versions: [] }),
}

for (const [opening, button, footer, viewport] of [
  ['a lista da biblioteca', 'Adicionar da biblioteca', 'Usar as escolhidas', PHONE],
  ['o formulário de criar', 'Criar', 'Criar ferramenta', ZOOMED_PHONE],
] as const) {
  test(`a ${viewport.width} px, ${opening} rola no corpo da janela e o ${footer} fica à vista`, async () => {
    const page = await harness.open(
      `/companies/${COMPANY.id}/projects/${PROJECT_ID}/agents/${AGENT}`,
      {
        viewport,
        replies: agentReplies,
      },
    )
    const panel = page.getByRole('region', { name: 'Ferramentas' })
    await panel.getByRole('button', { name: button, exact: true }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('button', { name: footer }).waitFor()
    const reach = await dialog.evaluate((node) => {
      const body = node.querySelector('[data-slot=dialog-body]')
      return {
        popupScrolls: node.scrollHeight > node.clientHeight,
        bodyScrolls: body ? body.scrollHeight > body.clientHeight : false,
      }
    })
    assert.equal(reach.popupScrolls, false, 'a janela corta o que passa da tela')
    const at = await dialog.getByRole('button', { name: footer }).boundingBox()
    assert.ok(at && at.y + at.height <= viewport.height, `o ${footer} passa do pé da tela`)
    if (button !== 'Criar') assert.equal(reach.bodyScrolls, true, 'a lista longa não rola no corpo')
    await page.close()
  })
}
