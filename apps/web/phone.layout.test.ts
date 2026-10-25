import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import type { Locator, Page } from 'playwright-core'
import type { Viewport } from './layout-harness.ts'
import { createHarness, PHONE, SMALL_PHONE } from './layout-harness.ts'
import { CONVERSATION_STATES } from './sweep-conversation-states.ts'

// The phone's new screens at 390px and 320px: the one-bar top of a Projeto, the conversation sheet
// and the model sheet (design V18, testing T23). layout.test.ts holds the frame's own widths.
const harness = createHarness(import.meta.dirname)
before(() => harness.start())
after(async () => {
  await harness.stop()
  assert.deepEqual(harness.unanswered, [], 'the page asked the Hub for something no reply covers')
})

function conversationState(part: string) {
  const state = CONVERSATION_STATES.find((each) => each.name.includes(part))
  assert.ok(state, `the sweep lacks the state "${part}"`)
  return state
}

async function inside(locator: Locator, viewport: Viewport) {
  const box = await locator.boundingBox()
  assert.ok(box, 'the element is not laid out')
  return (
    box.x >= 0 &&
    box.y >= 0 &&
    box.x + box.width <= viewport.width &&
    box.y + box.height <= viewport.height
  )
}

const SHEETS: [string, (page: Page) => Locator][] = [
  ['a caixa de conversas aberta', (page) => page.getByRole('dialog', { name: 'Conversas' })],
  ['o seletor de modelo e raciocínio', (page) => page.locator('[data-slot=combobox-content]')],
]

for (const viewport of [PHONE, SMALL_PHONE]) {
  test(`o topo de um Projeto é uma barra só: Abrir navegação, o título e App | Conversa, numa linha de ${viewport.width}px`, async () => {
    const state = conversationState('Prévia vazia com a conversa mais recente')
    const page = await harness.open(state.path, { viewport, replies: state.replies })
    await state.settle(page)
    const [opener, title, toggle] = await Promise.all(
      [
        page.getByRole('button', { name: 'Abrir navegação' }),
        page.locator('[data-slot=drawer-trigger]'),
        page.getByRole('group', { name: 'Parte do Projeto' }),
      ].map((each) => each.boundingBox()),
    )
    assert.ok(opener && title && toggle, 'the top line lacks one of its three parts')
    for (const part of [title, toggle]) {
      const apart = Math.abs(part.y + part.height / 2 - (opener.y + opener.height / 2))
      assert.ok(apart <= 2, 'the top line breaks into two rows')
    }
    assert.ok(opener.x + opener.width <= title.x, 'the title overlaps the opener')
    assert.ok(title.x + title.width <= toggle.x, 'the toggle overlaps the title')
    assert.ok(toggle.x + toggle.width <= viewport.width, 'the toggle leaves the screen')
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), viewport.width)
    await page.close()
  })

  for (const [part, sheet] of SHEETS) {
    test(`${part} cabe inteira numa tela de ${viewport.width}px`, async () => {
      const state = conversationState(part)
      const page = await harness.open(state.path, { viewport, replies: state.replies })
      await state.settle(page)
      // Measured after the slide-in, which starts the sheet below the screen.
      await sheet(page).evaluate((open) =>
        Promise.all(open.getAnimations().map((slide) => slide.finished)),
      )
      assert.ok(await inside(sheet(page), viewport), `it leaves the ${viewport.width}px screen`)
      await page.close()
    })
  }
}
