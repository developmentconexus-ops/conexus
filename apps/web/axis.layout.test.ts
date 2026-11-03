import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createHarness, DESKTOP } from './layout-harness.ts'
import { ASSISTANT_PATH, ASSISTANT_REPLIES } from './sweep-assistant-states.ts'
import { STATES } from './sweep-states.ts'

// The axis of a conversation and the labels of the lists beside it, in a real browser (step 13.3, V59 and V61).
const harness = createHarness(import.meta.dirname)
before(() => harness.start())
after(async () => {
  await harness.stop()
  assert.deepEqual(harness.unanswered, [], 'the page asked the Hub for something no reply covers')
})

test('a conversa e a caixa ficam no eixo de 720 a 1366 (V59)', async () => {
  const page = await harness.open(ASSISTANT_PATH, { viewport: DESKTOP, replies: ASSISTANT_REPLIES })
  const log = page.getByRole('log', { name: /^Conversa com o / })
  await log.waitFor()
  const form = page.locator('form').filter({ has: page.getByLabel('Mensagem') })
  for (const [name, element] of [
    ['transcript', log],
    ['box', form],
  ] as const) {
    const box = await element.boundingBox()
    assert.ok(box, `the ${name} is not laid out`)
    assert.ok(box.width <= 720, `the ${name} is ${box.width} wide, past the 720 axis`)
  }
  await page.close()
})

test('os rótulos de grupo da barra lateral não saem em caixa alta (V61)', async () => {
  const home = STATES.find((each) => each.name === 'Início do membro')
  assert.ok(home, 'the sweep lacks Início')
  const page = await harness.open(home.path, { viewport: DESKTOP, replies: home.replies })
  await home.settle(page)
  const transforms = await page
    .locator('[data-slot=sidebar-group-label]')
    .evaluateAll((all) => all.map((one) => getComputedStyle(one).textTransform))
  assert.ok(transforms.length > 0, 'the sidebar has no group label')
  assert.ok(
    transforms.every((value) => value === 'none'),
    `a label is ${transforms}`,
  )
  await page.close()
})
