import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createHarness, DESKTOP, PHONE, SMALL_PHONE } from './layout-harness.ts'
import { TREATMENT_STATES } from './sweep-treatment-states.ts'

const harness = createHarness(import.meta.dirname, { scrollbars: 'classic' })
before(() => harness.start())
after(async () => {
  await harness.stop()
  assert.deepEqual(harness.unanswered, [], 'the page asked the Hub for something no reply covers')
})

const PAGES = ['Dados, a tabela tratada', 'Dados, a página do tratamento']

for (const name of PAGES) {
  for (const viewport of [DESKTOP, PHONE, SMALL_PHONE]) {
    test(`${name}: a faixa de abas não rola na vertical e mostra a linha da aba ativa em ${viewport.width}px`, async () => {
      const state = TREATMENT_STATES.find((one) => one.name === name)
      assert.ok(state, `no sweep state named ${name}`)
      const page = await harness.open(state.path, { viewport, replies: state.replies })
      const tabs = page.getByRole('tablist')
      await tabs.waitFor()
      const drawn = await tabs.evaluate((list) => {
        const strip: Element[] = []
        for (
          let element: Element | null = list;
          element !== null && element.getAttribute('data-slot') !== 'tabs';
          element = element.parentElement
        )
          strip.push(element)
        const scrollers = strip.filter(
          (element) => getComputedStyle(element).overflowY !== 'visible',
        )
        const active = list.querySelector('[role=tab][aria-selected=true]')
        const last = [...list.querySelectorAll('[role=tab]')].at(-1)
        if (!active || !last) throw new Error('the strip has no tabs')
        const box = active.getBoundingClientRect()
        const hitOnUnderline = document.elementFromPoint(box.left + box.width / 2, box.bottom + 0.5)
        const upAndDown = scrollers.filter((one) => one.scrollHeight > one.clientHeight).length
        const sideways = scrollers.filter((one) => one.scrollWidth > one.clientWidth).length
        last.scrollIntoView({ block: 'nearest', inline: 'nearest' })
        return {
          upAndDown,
          sideways,
          lineShown: hitOnUnderline === active,
          ruleAcross: list.getBoundingClientRect().width >= (list.parentElement?.clientWidth ?? 0),
          lastReached: last.getBoundingClientRect().right <= window.innerWidth + 0.5,
          pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        }
      })
      assert.deepEqual(drawn, {
        upAndDown: 0,
        sideways: viewport === SMALL_PHONE ? 1 : 0,
        lineShown: true,
        ruleAcross: true,
        lastReached: true,
        pageOverflow: 0,
      })
      assert.deepEqual(page.problems, [])
      await page.close()
    })
  }
}
