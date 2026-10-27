import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import type { Replies } from './layout-harness.ts'
import { createHarness, DESKTOP, PHONE, SMALL_PHONE } from './layout-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import { MESSAGES, WITH_CONVERSATIONS } from './sweep-conversation-states.ts'
import { PROJECT_ID } from './sweep-replies.ts'
import { sessionReplies } from './sweep-session.ts'

// The memory ring in the composer's action row, measured in the browser: jsdom lays nothing out
// and runs no media query (testing T23).
const harness = createHarness(import.meta.dirname)
before(() => harness.start())
after(async () => {
  await harness.stop()
  assert.deepEqual(harness.unanswered, [], 'the page asked the Hub for something no reply covers')
})

const PROJECT = `/companies/${COMPANY.id}/projects/${PROJECT_ID}`
const FIRST = '11111111-1111-4111-8111-111111111111'

const MEMORY = {
  pendingTokens: 21_000,
  threshold: 30_000,
  observationTokens: 12_000,
  reflectionThreshold: 40_000,
}

/** The first conversation open at `viewport`, its memory at 70%, on the tab that holds the box. */
async function opened(viewport: typeof DESKTOP, display: Record<string, unknown> = {}) {
  const replies: Replies = { ...WITH_CONVERSATIONS }
  Object.assign(
    replies,
    sessionReplies(FIRST, { messages: MESSAGES, display: { omProgress: MEMORY, ...display } }),
  )
  const page = await harness.open(`${PROJECT}/conversations/${FIRST}`, { viewport, replies })
  if (viewport.width < 768)
    await page.getByRole('button', { name: 'Conversa', exact: true }).click()
  return page
}

for (const [viewport, showsPercent] of [
  [DESKTOP, true],
  [PHONE, false],
] as const) {
  test(`o percentual da memória ${showsPercent ? 'aparece' : 'some'} em ${viewport.width}px`, async () => {
    const page = await opened(viewport)
    const ring = page.getByRole('button', { name: /Memória da conversa/ })
    await ring.waitFor()
    assert.equal(await ring.getByText('70%').isVisible(), showsPercent)
    await page.close()
  })
}

test('a linha de ações da caixa quebra em vez de passar da tela', async () => {
  const page = await opened(SMALL_PHONE)
  await page.getByRole('button', { name: 'Enviar' }).waitFor()
  const measured = await page.locator('form [data-slot="input-group-addon"]').evaluate((row) => ({
    wrapped:
      new Set([...row.children].map((one) => Math.round(one.getBoundingClientRect().top))).size > 1,
    inside: row.scrollWidth <= Math.ceil(row.getBoundingClientRect().width),
  }))
  assert.deepEqual(measured, { wrapped: true, inside: true })
  await page.close()
})

for (const [reducedMotion, sweeps] of [
  ['no-preference', true],
  ['reduce', false],
] as const) {
  test(`a luz do anel ${sweeps ? 'corre' : 'fica parada com prefers-reduced-motion'} enquanto a memória trabalha`, async () => {
    const page = await opened(DESKTOP, { bufferingMessages: true })
    await page.emulateMedia({ reducedMotion })
    const light = page
      .getByRole('button', { name: /Memória da conversa/ })
      .locator('svg[data-working] g[mask] rect')
    await light.waitFor()
    const seen = await light.evaluate((rect) => {
      const style = getComputedStyle(rect)
      return { animation: style.animationName, rotate: style.rotate }
    })
    const ring = await page
      .getByRole('button', { name: /Memória da conversa/ })
      .locator('svg[data-working]')
      .evaluate((svg) => getComputedStyle(svg).animationName)
    assert.equal(ring, 'none')
    if (sweeps) assert.equal(seen.animation, 'ring-sweep')
    else assert.deepEqual(seen, { animation: 'none', rotate: '120deg' })
    await page.close()
  })
}
