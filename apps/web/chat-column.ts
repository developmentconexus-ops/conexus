import assert from 'node:assert/strict'
import type { Page } from 'playwright-core'
import type { Viewport } from './layout-harness.ts'

/** The 1280 px desktop the founder uses; the phone is `PHONE`. */
export const LAPTOP: Viewport = { width: 1280, height: 800 }

/**
 * A conversation taller than the screen, as the person meets it: the conversation's scroll is what
 * scrolls, the box stays where it was after the scroll, and the page is the height of the screen
 * (design V54; the box sat in the scroll when a screen put no column round the `Chat`).
 */
export async function holdsColumn(page: Page, viewport: Viewport) {
  const box = page.locator('form:has(textarea)').last()
  await box.waitFor()
  await page.evaluate(() => {
    const taller = document.createElement('div')
    taller.style.height = '3000px'
    document.querySelector('[data-slot=message-scroller-content]')?.append(taller)
  })
  const scroller = page.locator('[data-slot=message-scroller-viewport]')
  const rolls = await scroller.evaluate((el) => el.scrollHeight > el.clientHeight)
  const before = (await box.boundingBox())?.y
  await scroller.evaluate((el) => {
    el.scrollTop = 0
  })
  await page.waitForTimeout(200)
  const after = (await box.boundingBox())?.y
  const document_ = await page.evaluate(() => ({
    height: document.documentElement.scrollHeight,
    scrolled: window.scrollY,
  }))
  assert.deepEqual(
    {
      rolls,
      boxStays: before !== undefined && before === after,
      documentHeight: document_.height,
      documentScrolled: document_.scrolled,
    },
    { rolls: true, boxStays: true, documentHeight: viewport.height, documentScrolled: 0 },
  )
  assert.deepEqual(page.problems, [])
}
