import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import type { Replies } from './layout-harness.ts'
import {
  createHarness,
  DESKTOP,
  PHONE,
  reachOf,
  SMALL_PHONE,
  stolenBy,
  touching,
} from './layout-harness.ts'
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

/** The longest name the test providers' models can take, the effort level in it too. */
const LONG_MODEL = 'google/gemini-3.8-flash-preview-high-thinking-long'

/** The conversation's session answering with `model`, and the memory at two digits. */
async function openedWith(viewport: typeof DESKTOP, model: string, effort = 'off') {
  const replies: Replies = { ...WITH_CONVERSATIONS }
  const session = sessionReplies(FIRST, {
    messages: MESSAGES,
    display: { omProgress: MEMORY },
  })
  const key = Object.keys(session).find((one) => one.endsWith(`/sessions/${FIRST}`))
  assert.ok(key)
  const read = session[key]
  assert.ok(typeof read?.json === 'object' && read.json !== null)
  session[key] = {
    ...read,
    json: {
      ...read.json,
      modelId: model,
      settings: { yolo: false, thinkingLevel: effort, notifications: 'off', smartEditing: true },
    },
  }
  Object.assign(replies, session)
  const page = await harness.open(`${PROJECT}/conversations/${FIRST}`, {
    viewport,
    replies,
  })
  if (viewport.width < 768)
    await page.getByRole('button', { name: 'Conversa', exact: true }).click()
  return page
}

for (const viewport of [
  DESKTOP,
  { width: 768, height: 900 },
  PHONE,
  { width: 360, height: 800 },
  SMALL_PHONE,
]) {
  for (const model of ['anthropic/claude-sonnet-4', LONG_MODEL]) {
    test(`a linha de ações da caixa fica em uma linha em ${viewport.width}px com ${model}`, async () => {
      const page = await openedWith(viewport, model)
      await page.getByRole('button', { name: 'Enviar' }).waitFor()
      const measured = await page
        .locator('form [data-slot="input-group-addon"]')
        .last()
        .evaluate((row) => {
          const form = row.closest('form')
          const tops = [...row.querySelectorAll('button')].map((one) =>
            Math.round(one.getBoundingClientRect().top + one.getBoundingClientRect().height / 2),
          )
          const small = [
            ...row.querySelectorAll(
              'button[aria-label="Anexar arquivos"], button[aria-label="Modelo e raciocínio"], button[aria-label="Enviar"]',
            ),
          ].map((one) => one.getBoundingClientRect().height)
          const buttons = [...row.querySelectorAll('button')]
          const seen = buttons.map((one) => one.getAttribute('aria-label') ?? '')
          const byLeft = buttons
            .toSorted((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left)
            .map((one) => one.getAttribute('aria-label') ?? '')
          return {
            seen,
            tabIsVisualOrder: seen.join('|') === byLeft.join('|'),
            centres: new Set(tops).size,
            inside: row.scrollWidth <= Math.ceil(row.getBoundingClientRect().width),
            rowHeight: Math.round(row.getBoundingClientRect().height),
            formHeight: Math.round(form?.getBoundingClientRect().height ?? 0),
            small,
          }
        })
      assert.equal(measured.seen[0], 'Anexar arquivos', '+ is the first of the row')
      assert.equal(measured.seen[1], 'Modelo e raciocínio', 'the model follows the +')
      assert.match(measured.seen[2] ?? '', /^Memória da conversa/, 'the ring follows the model')
      assert.equal(measured.seen.at(-1), 'Enviar')
      assert.ok(measured.tabIsVisualOrder, 'Tab goes in the order the eye reads')
      assert.equal(measured.centres, 1, 'the buttons share one line')
      assert.ok(measured.inside, 'the row stays inside the box')
      assert.ok(measured.rowHeight <= 44, `the row is one line high, ${measured.rowHeight}px`)
      assert.deepEqual(measured.small, [32, 32, 32], 'the row draws 32 px, at any width')
      if (viewport.width < 768) {
        // A button with nothing to send is disabled and takes no press, its touch area included.
        await page.locator('form textarea').fill('Um app de encomendas')
        await touching(page)
        const buttons = page
          .locator('form [data-slot="input-group-addon"]')
          .last()
          .locator('button')
        for (const button of await buttons.all()) {
          const name = await button.getAttribute('aria-label')
          const reach = await reachOf(button)
          assert.ok(
            reach.up >= 6 && reach.down >= 6,
            `${name} is touched over 44 px: ${JSON.stringify(reach)}`,
          )
          assert.deepEqual(
            await stolenBy(button),
            [],
            `a neighbour covers ${name} at ${viewport.width}px with ${model}`,
          )
        }
      }
      await page.close()
    })
  }
}

for (const [viewport, effort, shown] of [
  [DESKTOP, 'off', false],
  [DESKTOP, 'high', true],
  [PHONE, 'high', false],
] as const) {
  test(`o botão do modelo ${shown ? 'nomeia' : 'não nomeia'} o nível ${effort} em ${viewport.width}px, e o popover o mostra`, async () => {
    const page = await openedWith(viewport, 'anthropic/claude-sonnet-4', effort)
    const button = page.getByRole('combobox', { name: 'Modelo e raciocínio' })
    await button.waitFor()
    assert.equal(
      await button
        .getByText('Alto', { exact: true })
        .isVisible()
        .catch(() => false),
      shown,
    )
    if (shown) {
      const name = button.getByText('Claude Sonnet 4', { exact: true })
      assert.ok(await name.evaluate((one) => one.scrollWidth <= one.clientWidth), 'name whole')
      // Playwright calls a level clipped by the one-line box visible, so the line is measured.
      const level = await button
        .getByText('Alto', { exact: true })
        .evaluate((one) => one.getBoundingClientRect().top)
      const line = await name.evaluate((one) => one.getBoundingClientRect().top)
      assert.ok(Math.abs(level - line) < 2, 'the level is on the name line, not clipped below it')
    }
    await button.click()
    const slider = page.getByRole('slider', { name: 'Raciocínio' })
    await slider.waitFor()
    assert.equal(
      await slider.getAttribute('aria-valuetext'),
      effort === 'off' ? 'Desligado' : 'Alto',
    )
    await page.close()
  })
}

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

for (const viewport of [DESKTOP, PHONE]) {
  test(`+, o modelo, o microfone e Enviar são uma família: 32 px e o mesmo fundo suave, em ${viewport.width}px`, async () => {
    const page = await openedWith(viewport, 'anthropic/claude-sonnet-4')
    await page.getByRole('button', { name: 'Enviar' }).waitFor()
    const row = page.locator('form [data-slot="input-group-addon"]').last()
    function look(name: string) {
      return row.locator(`button[aria-label="${name}"]`).evaluate((button) => {
        const style = getComputedStyle(button)
        const height = button.getBoundingClientRect().height
        return {
          height,
          background: style.backgroundColor,
          radius: Number.parseFloat(style.borderTopLeftRadius) >= height / 2,
        }
      })
    }
    const [attach, model, mic] = await Promise.all(
      ['Anexar arquivos', 'Modelo e raciocínio', 'Ditar'].map(look),
    )
    assert.ok(attach && model && mic)
    for (const each of [attach, model, mic]) assert.equal(each.height, 32)
    assert.equal(attach.background, model.background, "+ paints the pill's background")
    assert.equal(mic.background, model.background, "the microphone paints the pill's background")
    assert.ok(attach.radius && mic.radius, '+ and the microphone are circles')
    await page.close()
  })
}
