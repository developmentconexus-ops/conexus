import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { listNotifications } from '@conexus/hub-api'
import { owner } from './frame-replies.ts'
import { createHarness, ok, PHONE, SMALL_PHONE } from './layout-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'

// The phone top bar's menu button and the unread dot on it (step 13.3, Opção 2B of the founder).
const harness = createHarness(import.meta.dirname)
before(() => harness.start())
after(async () => {
  await harness.stop()
  assert.deepEqual(harness.unanswered, [], 'the page asked the Hub for something no reply covers')
})

for (const viewport of [PHONE, SMALL_PHONE]) {
  test(`o menu do topo tem um ponto com não lidas e nenhum sem elas, em ${viewport.width}px`, async () => {
    for (const unread of [1, 0]) {
      const replies = {
        ...owner(),
        [`GET /api/companies/${COMPANY.id}/notifications`]: ok(listNotifications, {
          notifications: [],
          unread,
          next: { kind: 'END' },
        }),
      }
      const page = await harness.open(`/companies/${COMPANY.id}`, { viewport, replies })
      const menu = page.locator('[data-sidebar=trigger]')
      const dot = menu.locator('[data-slot=sidebar-trigger-dot]')
      if (unread === 0) {
        await page.getByRole('button', { name: 'Abrir navegação', exact: true }).waitFor()
        assert.equal(await dot.count(), 0)
      } else {
        await page
          .getByRole('button', { name: 'Abrir navegação, 1 notificação não lida', exact: true })
          .waitFor()
        await dot.waitFor()
        const box = await dot.boundingBox()
        assert.ok(box && box.x + box.width <= viewport.width, 'the dot leaves the screen')
      }
      await page.close()
    }
  })
}
