import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { listTools } from '@conexus/hub-api'
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
    effect: 'READ',
    latest: { id: VERSION, number: 12 },
    usedBy: [{ id: '11111111-aaaa-4aaa-8aaa-111111111111', name: 'Conferente de metas' }],
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
