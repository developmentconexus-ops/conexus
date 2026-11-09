import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { getAgent, listAgentConversations, listAgentVersions, listTools } from '@conexus/hub-api'
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
    kind: 'PRESET' as const,
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

// The window of the agent's Ferramentas section on a phone: the fields scroll between the title and
// the footer, and the buttons stay in view (design V23, V18). The library's list is gone: a
// connection's tools sit under it in Ligações (decision E4).
const AGENT = '11111111-aaaa-4aaa-8aaa-111111111111'
const DRAFT = {
  name: 'Conferente de metas',
  description: 'Compara as vendas com as metas.',
  instructions: 'Diga quem ficou abaixo da meta.',
  model: null,
  memory: { observational: true },
  connections: [],
  web: false,
  appData: false,
  byTool: true,
}
const AGENT_DETAIL = {
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
      writes: [],
    },
  ],
  createdBy: null,
}
const agentReplies = {
  ...replies,
  [`GET ${BASE}/tools`]: ok(listTools, { tools: [], ready: [] }),
  [`GET ${BASE}/agents/${AGENT}`]: ok(getAgent, { agent: AGENT_DETAIL }),
  [`GET ${BASE}/agents/${AGENT}/versions`]: ok(listAgentVersions, { versions: [] }),
}

for (const [opening, button, footer, viewport] of [
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
    const popupScrolls = await dialog.evaluate((node) => node.scrollHeight > node.clientHeight)
    assert.equal(popupScrolls, false, 'a janela corta o que passa da tela')
    const at = await dialog.getByRole('button', { name: footer }).boundingBox()
    assert.ok(at && at.y + at.height <= viewport.height, `o ${footer} passa do pé da tela`)
    await page.close()
  })
}

function handMade(id: string, slug: string, description: string, operation: string) {
  return {
    kind: 'PRESET' as const,
    id,
    slug,
    connectionId: CONNECTION,
    operation,
    effect: 'READ' as const,
    latest: { id: VERSION, number: 1 },
    version: { kind: 'PRESET' as const, id: VERSION, number: 1, description, bound: {}, open: [] },
  }
}

// The agent's Ligações keep each chosen tool's lines inside its row, whichever the tool (design V23).
test('as ligações do agente com duas ferramentas escolhidas não deixam o texto de uma passar sobre a outra', async () => {
  const page = await harness.open(
    `/companies/${COMPANY.id}/projects/${PROJECT_ID}/agents/${AGENT}`,
    {
      viewport: PHONE,
      replies: {
        ...agentReplies,
        [`GET ${BASE}/agents/${AGENT}`]: ok(getAgent, {
          agent: {
            ...AGENT_DETAIL,
            draft: { ...DRAFT, connections: [CONNECTION] },
            offered: [
              {
                connectionId: CONNECTION,
                connector: 'sankhya',
                name: 'Matriz',
                reads: [
                  { operation: 'pedidos', label: 'Pedidos', summary: 'Pedidos de venda.' },
                  { operation: 'metas', label: 'Metas', summary: 'As metas do mês.' },
                ],
                writes: [],
              },
            ],
            tools: [
              handMade(
                '33333333-aaaa-4aaa-8aaa-000000000001',
                'vendas_de_ontem',
                'Vendas de ontem.',
                'pedidos',
              ),
              handMade(
                '33333333-aaaa-4aaa-8aaa-000000000002',
                'metas_do_mes',
                'Metas do mês.',
                'metas',
              ),
            ],
          },
        }),
      },
    },
  )
  const rows = page.getByRole('list', { name: 'Ferramentas de Matriz' }).locator('li')
  await rows.first().waitFor()
  const cut = await rows.evaluateAll((nodes) =>
    nodes.map((node) => node.scrollHeight > node.clientHeight),
  )
  assert.deepEqual(cut, [false, false], 'o texto de uma ferramenta passa da linha dela')
  await page.close()
})

// Founder's real test, 2026-11-08: at 1280 the first column of the list shrank to 40px and the name
// and description broke letter by letter. The name keeps a readable column whenever the table shows.
const LAPTOP = { width: 1280, height: 800 }
test('a 1280 px a coluna da ferramenta mostra o nome inteiro, sem quebrar letra por letra', async () => {
  const page = await harness.open(`/companies/${COMPANY.id}/projects/${PROJECT_ID}/agents/tools`, {
    viewport: LAPTOP,
    replies: {
      ...replies,
      [`GET ${BASE}/tools`]: ok(listTools, {
        tools: TOOLS.map((tool) => ({
          ...tool,
          slug: 'lancar_pedido_de_venda',
          description: 'Lança um pedido de venda no Sankhya, a confirmar, com a nota modelo.',
          readLabel: 'Lançar pedido',
          effect: 'WRITE' as const,
          usedBy: [
            { id: AGENT, projectId: PROJECT_ID, name: 'Conferente de metas' },
            {
              id: '11111111-aaaa-4aaa-8aaa-222222222222',
              projectId: PROJECT_ID,
              name: 'Vendedor',
            },
          ],
        })),
        ready: [],
      }),
    },
  })
  const name = page.getByRole('link', { name: /lancar_pedido_de_venda/ })
  await name.waitFor()
  const line = Number.parseFloat(await name.evaluate((el) => getComputedStyle(el).lineHeight))
  const box = await name.boundingBox()
  assert.ok(box && box.height <= line + 1, `o nome tem ${box?.height}px de altura, quebrou`)
  const description = page.getByText('Lança um pedido de venda no Sankhya, a confirmar')
  const text = await description.boundingBox()
  assert.ok(text && text.width >= 200, `a descrição tem ${text?.width}px de largura`)
  await page.close()
})

const WRITE_SUMMARY =
  'Lança um pedido de venda no Sankhya, sempre "a confirmar": nota modelo, cliente, itens com o valor unitário e o local de estoque.'
const writeAgentReplies = {
  ...agentReplies,
  [`GET ${BASE}/agents/${AGENT}/conversations`]: ok(listAgentConversations, {
    conversations: [],
  }),
  [`GET ${BASE}/agents/${AGENT}`]: ok(getAgent, {
    agent: {
      ...AGENT_DETAIL,
      draft: { ...DRAFT, connections: [CONNECTION] },
      offered: [
        {
          connectionId: CONNECTION,
          connector: 'sankhya',
          name: 'Matriz',
          reads: [],
          writes: [{ operation: 'lancarPedido', label: 'Lançar pedido', summary: WRITE_SUMMARY }],
        },
      ],
      tools: [
        {
          ...handMade(
            '33333333-aaaa-4aaa-8aaa-000000000003',
            'lancar_pedido',
            WRITE_SUMMARY,
            'lancarPedido',
          ),
          effect: 'WRITE' as const,
          latest: { id: '44444444-aaaa-4aaa-8aaa-444444444445', number: 2 },
        },
      ],
    },
  }),
}
test('a 1280 px a linha da escrita com versão nova dá ao texto uma coluna que se lê', async () => {
  const page = await harness.open(
    `/companies/${COMPANY.id}/projects/${PROJECT_ID}/agents/${AGENT}`,
    { viewport: LAPTOP, replies: writeAgentReplies },
  )
  const row = page.getByRole('list', { name: 'Ferramentas de Matriz' }).locator('li').first()
  await row.waitFor()
  const text = row.getByText(WRITE_SUMMARY)
  const box = await text.boundingBox()
  assert.ok(box && box.width >= 200, `o texto da escrita tem ${box?.width}px de largura`)
  await page.close()
})
