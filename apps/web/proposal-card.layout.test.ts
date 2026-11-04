import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { ASSISTANT_TOOL } from '@conexus/hub-api'
import { createHarness, DESKTOP, PHONE } from './layout-harness.ts'
import { ASSISTANT_PATH, CARD_SPEAKS, cardReplies, proposed } from './sweep-assistant-states.ts'

const harness = createHarness(import.meta.dirname)
before(() => harness.start())
after(async () => {
  await harness.stop()
  assert.deepEqual(harness.unanswered, [], 'the page asked the Hub for something no reply covers')
})

// A briefing with one very long unbroken line (a SQL block) must not widen the proposal card: the line
// scrolls inside the briefing's box (design V18, step 24.3.2).
for (const [where, viewport] of [
  ['no computador', DESKTOP],
  ['no celular', PHONE],
] as const) {
  test(`${where}, uma linha comprida do briefing rola dentro da caixa e o cartão da proposta fica na coluna`, async () => {
    const long = `SELECT ${'coluna_com_nome_bem_comprido, '.repeat(40)}fim FROM tabela`
    const replies = cardReplies(null, [
      ...CARD_SPEAKS,
      proposed(ASSISTANT_TOOL.proposeApp, `## Consulta\n\n\`\`\`sql\n${long}\n\`\`\`\n`),
    ])
    const page = await harness.open(ASSISTANT_PATH, { viewport, replies })
    const card = page.locator('[data-slot=card]').filter({ hasText: 'Briefing' })
    await card.waitFor()
    const box = card.locator('.max-h-64')
    const measured = await page.evaluate(() => {
      const scroller = document.querySelector('[data-slot=message-scroller-viewport]')
      const cardEl = [...document.querySelectorAll('[data-slot=card]')].find((one) =>
        one.textContent?.includes('Briefing'),
      )
      const edge = cardEl?.getBoundingClientRect().right ?? 0
      const content = cardEl?.querySelector('[data-slot=card-content]')
      return {
        scrollerClient: scroller?.clientWidth ?? 0,
        scrollerScroll: scroller?.scrollWidth ?? 0,
        cardRight: edge,
        contentRight: content?.getBoundingClientRect().right ?? 0,
        page: document.documentElement.scrollWidth,
      }
    })
    assert.ok(
      measured.scrollerScroll <= measured.scrollerClient,
      `the conversation scrolls sideways: ${measured.scrollerScroll} in ${measured.scrollerClient}`,
    )
    assert.ok(
      measured.contentRight <= measured.cardRight,
      `the card's content leaves the card by ${measured.contentRight - measured.cardRight}px`,
    )
    assert.equal(measured.page, viewport.width)
    const inside = await box.evaluate((el) => ({
      scrolls: [el, ...el.querySelectorAll('*')].some((one) => one.scrollWidth > one.clientWidth),
      right: el.getBoundingClientRect().right,
    }))
    assert.ok(inside.scrolls, 'the long line does not scroll inside the briefing box')
    assert.ok(inside.right <= measured.cardRight, 'the briefing box leaves the card')
    await page.close()
  })
}
