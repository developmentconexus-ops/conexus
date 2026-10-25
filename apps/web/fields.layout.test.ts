import assert from 'node:assert/strict'
import { after, before, describe, test } from 'node:test'
import { createHarness, PHONE, SMALL_PHONE } from './layout-harness.ts'
import { STATES } from './sweep-states.ts'

// A phone's browser zooms the page into a text field whose text is under 16px, and the person then
// drags the page both ways to read it. Every state the sweep knows, at 390px and at 320px.
const harness = createHarness(import.meta.dirname)
before(() => harness.start())
after(() => harness.stop())

describe('campos de texto no celular', { concurrency: 4 }, () => {
  for (const state of STATES) {
    for (const viewport of [PHONE, SMALL_PHONE]) {
      test(`${state.name}, ${viewport.width}px: nenhum campo de texto abaixo de 16px`, async () => {
        const page = await harness.open(state.path, {
          viewport,
          replies: state.replies,
          userAgent: state.userAgent,
        })
        await state.settle(page)
        const small = await page.evaluate(() =>
          [
            ...document.querySelectorAll<HTMLElement>(
              'textarea, input:not([type=checkbox], [type=radio], [type=file], [type=hidden], [type=range])',
            ),
          ]
            // Base UI keeps a hidden input for a select's or a slider's value, out of the Tab order.
            .filter((field) => field.tabIndex >= 0 && field.getAttribute('aria-hidden') !== 'true')
            .map((field) => ({
              field: field.getAttribute('aria-label') ?? field.id ?? field.outerHTML.slice(0, 60),
              size: Number.parseFloat(getComputedStyle(field).fontSize),
            }))
            .filter((one) => one.size < 16),
        )
        assert.deepEqual(small, [])
        await page.close()
      })
    }
  }
})
