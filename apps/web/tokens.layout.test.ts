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

// Light then dark, as DESIGN.md writes them.
const PALETTE = {
  frame: ['#181818', '#101010'],
  canvas: ['#f1f1f1', '#141414'],
  surface: ['#fcfcfc', '#191919'],
  'surface-3': ['#f1f1f1', '#222222'],
  raised: ['#ffffff', '#282828'],
  'surface-4': ['#e6e6e6', '#2f2f2f'],
  line: ['#e2e2e2', '#303030'],
  'line-strong': ['#808080', '#7a7a7a'],
  text: ['#1d1d1d', '#f0f0f0'],
  ink: ['#1d1d1d', '#f0f0f0'],
  'text-2': ['#585858', '#b1b1b1'],
  'on-ink': ['#ffffff', '#191919'],
  'accent-from': ['#f5ab0e', '#f0ad27'],
  'accent-to': ['#ffd445', '#ffd766'],
  'on-accent': ['#1f1600', '#1f1600'],
  'accent-soft': ['#f8e8bd', '#2b2a1c'],
  focus: ['#1d1d1d', '#ffd766'],
  notice: ['#191919', '#f2f2f2'],
  'on-notice': ['#f2f2f2', '#191919'],
  success: ['#1f9d5c', '#55d394'],
  warning: ['#d97a06', '#f5a742'],
  danger: ['#d93a4a', '#ff7d8a'],
  'success-text': ['#007f46', '#55d394'],
  'warning-text': ['#a65b00', '#f5a742'],
  'danger-text': ['#ce2e41', '#ff7d8a'],
} as const

function rgb(hex: string): string {
  const value = Number.parseInt(hex.slice(1), 16)
  return `rgb(${value >> 16}, ${(value >> 8) & 255}, ${value & 255})`
}

function expected(theme: 0 | 1): Record<string, string> {
  return Object.fromEntries(Object.entries(PALETTE).map(([name, pair]) => [name, rgb(pair[theme])]))
}

/** The page as it paints: the body's own background, and each token of the table through `var()`. */
async function paint(page: Page) {
  return page.evaluate((names) => {
    const probe = document.createElement('div')
    document.body.append(probe)
    const tokens: Record<string, string> = {}
    for (const name of names) {
      probe.style.backgroundColor = `var(--color-${name})`
      tokens[name] = getComputedStyle(probe).backgroundColor
    }
    probe.remove()
    return { body: getComputedStyle(document.body).backgroundColor, tokens }
  }, Object.keys(PALETTE))
}

const LIGHT = { body: rgb(PALETTE.canvas[0]), tokens: expected(0) }
const DARK = { body: rgb(PALETTE.canvas[1]), tokens: expected(1) }

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
