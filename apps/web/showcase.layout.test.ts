import assert from 'node:assert/strict'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { after, before, test } from 'node:test'
import { createHarness, DESKTOP, PHONE, SMALL_PHONE } from './layout-harness.ts'

// The showcase page (pieces.html) holds every piece of ui/, under the Hub's policy in a real browser.
const harness = createHarness(import.meta.dirname)
before(() => harness.start())
after(async () => {
  await harness.stop()
})

/** The `.tsx` files of ui/ and its folders that the showcase must hold, tests and the page itself apart. */
function uiPieces(): string[] {
  const own = new Set(['pieces-fixture.tsx'])
  return readdirSync(join(import.meta.dirname, 'src', 'ui'), { recursive: true, encoding: 'utf8' })
    .map((file) => file.replaceAll('\\', '/'))
    .filter(
      (file) =>
        file.endsWith('.tsx') &&
        !file.endsWith('.test.tsx') &&
        !own.has(file) &&
        !file.startsWith('showcase/'),
    )
    .sort()
}

test('toda peça de ui/ tem entrada na vitrine', async () => {
  const page = await harness.open('/pieces', { viewport: DESKTOP, replies: {} })
  await page.locator('[data-file]').first().waitFor()
  const shown = await page
    .locator('[data-file]')
    .evaluateAll((all) => all.map((one) => one.getAttribute('data-file') ?? '').sort())
  const files = uiPieces()
  assert.deepEqual(
    files.filter((file) => !shown.includes(file)),
    [],
    'a piece of ui/ has no entry in the showcase',
  )
  assert.deepEqual(
    shown.filter((file) => !files.includes(file)),
    [],
    'an entry of the showcase names no file of ui/',
  )
  await page.close()
})

for (const scheme of ['light', 'dark'] as const) {
  for (const viewport of [DESKTOP, PHONE, SMALL_PHONE]) {
    test(`a vitrine sob a política do Hub, no tema ${scheme}, a ${viewport.width}px: sem erro, sem violação, sem rolagem lateral`, async () => {
      const page = await harness.open('/pieces', { viewport, replies: {}, scheme })
      await page.locator('[data-file]').first().waitFor()
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), viewport.width)
      assert.deepEqual(page.problems, [])
      await page.close()
    })
  }
}
