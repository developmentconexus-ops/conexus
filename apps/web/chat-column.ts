import assert from 'node:assert/strict'
import type { Page } from 'playwright-core'
import type { Viewport } from './layout-harness.ts'

/**
 * A conversation taller than the screen, as the person meets it: the conversation's scroll is what
 * scrolls, the box stays where it was after the scroll, and the page is the height of the screen
 * (design V54; the box sat in the scroll when a screen put no column round the `Chat`).
 */
export async function holdsColumn(page: Page & { problems: string[] }, viewport: Viewport) {
  const box = page.getByRole('textbox', { name: /^Mensagem/ }).locator('xpath=ancestor::form')
  await box.waitFor()
  await page.evaluate(() => {
    const taller = document.createElement('div')
    taller.style.height = '3000px'
    document.querySelector('[data-slot=message-scroller-content]')?.append(taller)
  })
  const scroller = page.getByLabel('Rolagem da conversa')
  const rolls = await scroller.evaluate((el) => el.scrollHeight > el.clientHeight)
  const before = await box.boundingBox()
  await scroller.evaluate((el) => {
    el.scrollTop = 0
  })
  await page.waitForTimeout(200)
  const after = await box.boundingBox()
  const document_ = await page.evaluate(() => ({
    height: document.documentElement.scrollHeight,
    scrolled: window.scrollY,
  }))
  assert.deepEqual(
    {
      rolls,
      boxStays: before !== null && before.y === after?.y,
      boxInView: before !== null && before.y + before.height <= viewport.height,
      documentHeight: document_.height,
      documentScrolled: document_.scrolled,
    },
    {
      rolls: true,
      boxStays: true,
      boxInView: true,
      documentHeight: viewport.height,
      documentScrolled: 0,
    },
  )
  assert.deepEqual(page.problems, [])
}
