import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import type { Page } from 'playwright-core'
import { createHarness, DESKTOP } from './layout-harness.ts'

// The theme in a real browser: tokens.css writes each colour once, as light-dark(), and the theme is
// the page's color-scheme; jsdom resolves neither.
const harness = createHarness(import.meta.dirname)
before(() => harness.start())
after(async () => {
  await harness.stop()
  assert.deepEqual(harness.unanswered, [], 'the page asked the Hub for something no reply covers')
})

/** The page as it paints: the body's own background, and a probe that takes the sheet's token through `var()`. */
async function paint(page: Page) {
  return page.evaluate(() => {
    const probe = document.createElement('div')
    probe.style.backgroundColor = 'var(--color-surface)'
    document.body.append(probe)
    const surface = getComputedStyle(probe).backgroundColor
    probe.remove()
    return { canvas: getComputedStyle(document.body).backgroundColor, surface }
  })
}

const LIGHT = { canvas: 'rgb(245, 246, 247)', surface: 'rgb(255, 255, 255)' }
const DARK = { canvas: 'rgb(18, 20, 23)', surface: 'rgb(24, 27, 31)' }

test('o tema', async () => {
  const cases = [
    ['sistema claro, sem escolha', 'light', undefined, LIGHT],
    ['sistema escuro, sem escolha', 'dark', undefined, DARK],
    ['sistema escuro, escolha escura', 'dark', 'dark', DARK],
    ['sistema escuro, escolha clara', 'dark', 'light', LIGHT],
    ['sistema claro, escolha escura', 'light', 'dark', DARK],
  ] as const
  for (const [name, scheme, chosen, expected] of cases) {
    const page = await harness.open('/pieces', { viewport: DESKTOP, replies: {}, scheme })
    if (chosen)
      await page.evaluate((theme) => (document.documentElement.dataset.theme = theme), chosen)
    assert.deepEqual(await paint(page), expected, name)
    assert.deepEqual(page.problems, [], name)
    await page.close()
  }
})

/** The colour a half-mixed accent paints in a scheme, read from a probe in a real page. */
async function mixed(scheme: 'light' | 'dark') {
  const page = await harness.open('/pieces', { viewport: DESKTOP, replies: {}, scheme })
  const color = await page.evaluate(() => {
    const probe = document.createElement('div')
    probe.style.backgroundColor = 'color-mix(in srgb, var(--color-accent) 50%, transparent)'
    document.body.append(probe)
    return getComputedStyle(probe).backgroundColor
  })
  await page.close()
  return color
}

// The unit stops if light-dark() inside color-mix() (a Tailwind `/50` class, `focus-field`) paints nothing.
test('light-dark() dentro de color-mix() pinta, e pinta a cor do tema', async () => {
  const light = await mixed('light')
  const dark = await mixed('dark')
  assert.notEqual(light, 'rgba(0, 0, 0, 0)')
  assert.notEqual(dark, 'rgba(0, 0, 0, 0)')
  assert.notEqual(light, dark)
})
