import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createHarness, ZOOMED_PHONE } from './layout-harness.ts'
import { CONVERSATION_STATES } from './sweep-conversation-states.ts'

// The request the Assistant handed over, measured in the browser: jsdom lays nothing out (testing T23).
const harness = createHarness(import.meta.dirname)
before(() => harness.start())
after(async () => {
  await harness.stop()
  assert.deepEqual(harness.unanswered, [], 'the page asked the Hub for something no reply covers')
})

test('o pedido do Assistente cabe a 195px, a 200% de ampliação: "via Assistente" e a hora à vista, sem rolagem lateral (24.3.2)', async () => {
  const state = CONVERSATION_STATES.find(
    (one) => one.name === 'Conversa, com o pedido do Assistente',
  )
  assert.ok(state, 'the sweep has no such state')
  const page = await harness.open(state.path, { viewport: ZOOMED_PHONE, replies: state.replies })
  await state.settle(page)
  const mark = await page.getByRole('note', { name: 'Enviado pelo Assistente' }).boundingBox()
  const scroll = await page.evaluate(() => document.documentElement.scrollWidth)
  assert.deepEqual(
    {
      scroll,
      inside: (mark?.x ?? -1) >= 0 && (mark?.x ?? 0) + (mark?.width ?? 0) <= ZOOMED_PHONE.width,
    },
    { scroll: ZOOMED_PHONE.width, inside: true },
  )
  assert.deepEqual(page.problems, [])
  await page.close()
})
