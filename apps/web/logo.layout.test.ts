import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createHarness, DESKTOP, PHONE } from './layout-harness.ts'
import { INTEGRATIONS_STATES } from './sweep-integrations-states.ts'

// A provider's logo sits on a light plate in both themes, and the list row's text stays short on a
// phone (design V3): what jsdom cannot read, the browser's computed style does.
const harness = createHarness(import.meta.dirname)
before(() => harness.start())
after(async () => {
  await harness.stop()
  assert.deepEqual(harness.unanswered, [], 'the page asked the Hub for something no reply covers')
})

const LIST = INTEGRATIONS_STATES.find((state) => state.name.includes('duas ligações'))

for (const viewport of [DESKTOP, PHONE]) {
  for (const scheme of ['light', 'dark'] as const) {
    test(`o logotipo: placa clara no tema ${scheme} e o texto da linha curto em ${viewport.width}px`, async () => {
      assert.ok(LIST, 'the list state is missing')
      const page = await harness.open(LIST.path, { viewport, replies: LIST.replies, scheme })
      await LIST.settle(page)
      const plate = page.locator('img[src^="data:image/svg+xml"]').first().locator('..')
      const drawn = await plate.evaluate((one) => getComputedStyle(one).backgroundColor)
      assert.equal(drawn, 'rgb(255, 255, 255)')
      const summary = page.getByText('3 ligações')
      const text = await summary.locator('..').boundingBox()
      assert.ok(text, 'the connector text is not laid out')
      assert.ok(text.height <= 64, `the connector's text takes ${text.height}px: it wraps`)
      await page.close()
    })
  }
}
