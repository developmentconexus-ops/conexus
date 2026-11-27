import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import type { Page } from 'playwright-core'
import { createHarness, DESKTOP } from './layout-harness.ts'
import { STATES } from './sweep-states.ts'

// The type of the screens in a real browser: the faces, the sizes and the 4px grid of the lines.
const harness = createHarness(import.meta.dirname)
before(() => harness.start())
after(async () => {
  await harness.stop()
  assert.deepEqual(harness.unanswered, [], 'the page asked the Hub for something no reply covers')
})

/** The line height of every element that holds text of its own, as the browser computes it. */
function textLineHeights(page: Page) {
  return page.evaluate(() => {
    const found: string[] = []
    for (const element of document.body.querySelectorAll('*')) {
      const own = [...element.childNodes].some(
        (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
      )
      if (!own) continue
      const { lineHeight } = getComputedStyle(element)
      if (!(Number.parseFloat(lineHeight) % 4 === 0))
        found.push(`${element.tagName}: ${lineHeight}`)
    }
    return found
  })
}

test('a fonte: Hanken Grotesk e JetBrains Mono, a saudação em 30 e 24, toda linha de texto na grade de 4', async () => {
  const home = STATES.find((each) => each.name === 'Início, a primeira de duas empresas')
  assert.ok(home, 'the sweep lacks Início')
  for (const [viewport, size, line] of [
    [DESKTOP, '30px', '36px'],
    [{ width: 639, height: 844 }, '24px', '32px'],
  ] as const) {
    const page = await harness.open(home.path, { viewport, replies: home.replies })
    await home.settle(page)
    const families = await page.evaluate(async () => {
      await document.fonts.ready
      return [...new Set([...document.fonts].map((face) => face.family.replaceAll('"', '')))].sort()
    })
    assert.deepEqual(families, ['Hanken Grotesk', 'JetBrains Mono'])
    const greeting = await page.getByRole('heading', { level: 1 }).evaluate((heading) => {
      const style = getComputedStyle(heading)
      return [
        style.fontSize,
        style.lineHeight,
        style.fontWeight,
        style.fontFamily.split(',')[0]?.replaceAll('"', ''),
      ]
    })
    assert.deepEqual(
      greeting,
      [size, line, '700', 'Hanken Grotesk'],
      `the greeting at ${viewport.width}px`,
    )
    assert.deepEqual(
      await textLineHeights(page),
      [],
      `a line height off the 4px grid at ${viewport.width}px`,
    )
    await page.close()
  }
})

test('a prosa das mensagens usa o tipo reading, 15px com linha de 24', async () => {
  const page = await harness.open('/pieces', { viewport: DESKTOP, replies: {} })
  for (const text of ['Compare dois apps de encomenda', 'Resposta']) {
    const prose = await page
      .locator('[data-slot=bubble-content]', { hasText: text })
      .first()
      .evaluate((element) => {
        const style = getComputedStyle(element)
        return [style.fontSize, style.lineHeight]
      })
    assert.deepEqual(prose, ['15px', '24px'], text)
  }
  await page.close()
})
