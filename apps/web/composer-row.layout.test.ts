import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import type { Page } from 'playwright-core'
import { createHarness, PHONE, SMALL_PHONE } from './layout-harness.ts'
import { ASSISTANT_PATH, ASSISTANT_REPLIES } from './sweep-assistant-states.ts'

const harness = createHarness(import.meta.dirname)
before(() => harness.start())
after(async () => {
  await harness.stop()
  assert.deepEqual(harness.unanswered, [], 'the page asked the Hub for something no reply covers')
})

// The Assistant's box on a phone (the card of 13.3, criterion 16): under 416 px the words go, never the controls.
async function rowOf(page: Page) {
  const names = [
    'Anexar e ferramentas',
    /^\d+ ferramentas?$/,
    /Memória da conversa/,
    'Ditar',
    'Enviar',
  ]
  const found = await Promise.all(
    names.map(async (name) => {
      const box = await page.locator('form').getByRole('button', { name }).first().boundingBox()
      assert.ok(box, `${name} is not laid out`)
      return box
    }),
  )
  return found
}

test('a 390, a linha da caixa do Assistente perde as palavras e guarda todos os controles, na mesma ordem', async () => {
  const page = await harness.open(ASSISTANT_PATH, { viewport: PHONE, replies: ASSISTANT_REPLIES })
  await page
    .locator('form')
    .getByRole('button', { name: /Memória da conversa/ })
    .waitFor()
  const row = await page.locator('form [data-slot="input-group-addon"]').last().boundingBox()
  const boxes = await rowOf(page)
  assert.ok(row, 'the row is not laid out')
  const lefts = boxes.map((box) => box.x)
  assert.deepEqual(
    lefts,
    lefts.toSorted((a, b) => a - b),
    'a control changed side',
  )
  for (const box of boxes) {
    assert.ok(
      box.x >= row.x && box.x + box.width <= row.x + row.width + 1,
      'a control left the row',
    )
  }
  const ring = page.locator('form').getByRole('button', { name: /Memória da conversa/ })
  assert.equal(await ring.getByText('Memória', { exact: true }).isVisible(), false)
  assert.equal(await ring.getByText(/%$/).isVisible(), true)
  assert.equal(
    await page
      .getByRole('button', { name: /^\d+ ferramentas?$/ })
      .first()
      .getByText(/^ ferramenta/)
      .isVisible(),
    false,
  )
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), PHONE.width)
  await page.close()
})

test('a 320, o grupo da esquerda ganha uma linha própria e nenhum controle troca de lado', async () => {
  const page = await harness.open(ASSISTANT_PATH, {
    viewport: SMALL_PHONE,
    replies: ASSISTANT_REPLIES,
  })
  await page
    .locator('form')
    .getByRole('button', { name: /Memória da conversa/ })
    .waitFor()
  const [plus, tools, ring, mic, send] = await rowOf(page)
  assert.ok(plus && tools && ring && mic && send)
  assert.ok(plus.y < ring.y && tools.y < ring.y, 'the left group is not on its own line')
  assert.ok(plus.x < tools.x, '+ comes before the tools')
  assert.ok(ring.x < mic.x && mic.x < send.x, 'the right group changed order')
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), SMALL_PHONE.width)
  await page.close()
})
