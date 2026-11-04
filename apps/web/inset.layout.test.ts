import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { listAssistantConnections, listAssistantConversations } from '@conexus/hub-api'
import type { Page } from 'playwright-core'
import type { Replies } from './layout-harness.ts'
import { createHarness, DESKTOP, ok, PHONE, ZOOMED_PHONE } from './layout-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import { WITH_CONVERSATIONS } from './sweep-conversation-states.ts'
import { OWNER, PROJECT_ID, projectsPage, startsOn } from './sweep-replies.ts'

// The bottom safe-area inset a phone browser reports changes as its toolbar collapses (an iPhone's
// Safari: 0 to about 34px). Only a box docked at the bottom may follow it; a box in the page's flow
// must not push what lies under it.
const API = `/api/companies/${COMPANY.id}/assistant`
const INICIO: Replies = {
  ...OWNER,
  ...projectsPage(COMPANY.id),
  ...startsOn(COMPANY.id),
  [`GET ${API}/connections`]: ok(listAssistantConnections, { connections: [] }),
  [`GET ${API}/conversations`]: ok(listAssistantConversations, {
    conversations: [],
    next: { kind: 'END' },
  }),
}

const harness = createHarness(import.meta.dirname)
before(() => harness.start())
after(async () => {
  await harness.stop()
  assert.deepEqual(harness.unanswered, [], 'the page asked the Hub for something no reply covers')
})

/** The inset the browser reports at the bottom (`Emulation.setSafeAreaInsetsOverride`). */
async function insetBottom(page: Page, bottom: number): Promise<void> {
  const session = await page.context().newCDPSession(page)
  await session.send('Emulation.setSafeAreaInsetsOverride', {
    insets: { top: 0, left: 0, right: 0, bottom },
  })
}

for (const viewport of [PHONE, ZOOMED_PHONE, DESKTOP]) {
  test(`a ${viewport.width}px, a caixa do Início fica no fluxo e o que vem abaixo não se mexe quando a barra do navegador recolhe`, async () => {
    const page = await harness.open(`/companies/${COMPANY.id}`, { viewport, replies: INICIO })
    const examples = page.getByRole('button', { name: 'Vendas da semana' })
    await examples.waitFor()
    await insetBottom(page, 0)
    const before = await examples.boundingBox()
    await insetBottom(page, 34)
    const after = await examples.boundingBox()
    assert.ok(before && after, 'the examples are not laid out')
    assert.equal(after.y, before.y, 'the examples moved when the bottom inset grew')
    const position = await page
      .locator('form')
      .first()
      .evaluate((form) => getComputedStyle(form).position)
    assert.notEqual(position, 'sticky', 'the Início box is docked like the conversation box')
    await page.close()
  })
}

test('a caixa da conversa fica fixada no rodapé e se afasta da barra de início quando o inset cresce', async () => {
  const first = '11111111-1111-4111-8111-111111111111'
  const page = await harness.open(
    `/companies/${COMPANY.id}/projects/${PROJECT_ID}/conversations/${first}`,
    { viewport: DESKTOP, replies: WITH_CONVERSATIONS },
  )
  const form = page.locator('form').last()
  await form.waitFor()
  await insetBottom(page, 34)
  const { position, padding } = await form.evaluate((one) => ({
    position: getComputedStyle(one).position,
    padding: getComputedStyle(one).paddingBottom,
  }))
  assert.equal(position, 'sticky')
  assert.equal(padding, '34px')
  await page.close()
})
