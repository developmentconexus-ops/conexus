import assert from 'node:assert/strict'
import { after, before, describe, test } from 'node:test'
import type { Page } from 'playwright-core'
import type { Viewport } from './layout-harness.ts'
import { createHarness, DESKTOP, PHONE, presses, SMALL_PHONE } from './layout-harness.ts'
import { STATES } from './sweep-states.ts'

// Each state listed there, at three widths and in both themes: no sideways scroll, and a 2px
// outline at each Tab stop (testing T23, design V18, V28).
const harness = createHarness(import.meta.dirname)
before(() => harness.start())
after(async () => {
  await harness.stop()
  assert.deepEqual(harness.unanswered, [], 'the page asked the Hub for something no reply covers')
})

/** Every stop the key reaches before focus leaves the page, or, in a modal, comes round again. */
async function walk(page: Page, key: string): Promise<string[]> {
  const stops: string[] = []
  for (let stop = 0; stop < 40; stop++) {
    const [reached] = await presses(page, key, 1)
    if (reached === undefined || reached === 'body' || stops.includes(reached)) return stops
    stops.push(reached)
  }
  throw new Error(`${key} never left the page`)
}

/** Back out of wherever the state left focus, then forward through the whole page. */
async function tabStops(page: Page): Promise<string[]> {
  const back = await walk(page, 'Shift+Tab')
  return [...new Set([...back, ...(await walk(page, 'Tab'))])]
}

// The pages are separate browser contexts and spend their time waiting on frames, so the cases
// share the machine's two cores instead of queueing behind each other.
const VIEWPORTS: Viewport[] = [DESKTOP, PHONE, SMALL_PHONE]
describe('varredura', { concurrency: 4 }, () => {
  for (const state of STATES) {
    for (const viewport of VIEWPORTS) {
      for (const scheme of ['light', 'dark'] as const) {
        test(`${state.name}, ${viewport.width}px, tema ${scheme}: sem rolagem lateral e contorno de 2px em cada parada do Tab`, async () => {
          const page = await harness.open(state.path, { viewport, replies: state.replies, scheme })
          await state.settle(page)
          const { scroll, inner } = await page.evaluate(() => ({
            scroll: document.documentElement.scrollWidth,
            inner: window.innerWidth,
          }))
          assert.ok(scroll <= inner, `the page scrolls sideways: ${scroll}px in ${inner}px`)
          const stops = await tabStops(page)
          const flawed = stops.filter((stop) => !/ solid 2px( inside)?$/.test(stop))
          assert.deepEqual(flawed, [])
          await page.close()
        })
      }
    }
  }
})

// The router preloads a link's page once it keeps focus past its 50ms delay, so a Tab stop that
// lingers on the rail's Projetos link asks the Hub for the Projects. The walk above only lingers
// when the machine is slow; here every state lingers, and a state with no reply for it fails the
// run's unanswered check.
describe('pré-carga do trilho', { concurrency: 4 }, () => {
  for (const state of STATES) {
    test(`${state.name}: o foco parado em Projetos pede só o que há resposta`, async () => {
      const page = await harness.open(state.path, {
        viewport: DESKTOP,
        replies: state.replies,
      })
      await state.settle(page)
      const link = page.locator('a[href$="/projects"]').first()
      if (await link.count()) {
        await link.focus()
        await page.waitForTimeout(250)
      }
      await page.close()
    })
  }
})
