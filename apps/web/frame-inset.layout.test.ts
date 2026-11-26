import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import type { Locator } from 'playwright-core'
import { atRest } from './at-rest.ts'
import { CONVERSATIONS, OPENED, onlyList, owner } from './frame-replies.ts'
import { createHarness, DESKTOP, PHONE } from './layout-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import { ASSISTANT_PATH, ASSISTANT_REPLIES } from './sweep-assistant-states.ts'
import { DEFAULT_STATES } from './sweep-defaults-states.ts'

// The frame in a real browser (design V5, V19): the graphite round the sheet, the sheet
// inset in it, and the current place of the sidebar.
const harness = createHarness(import.meta.dirname)
before(() => harness.start())
after(async () => {
  await harness.stop()
  assert.deepEqual(harness.unanswered, [], 'the page asked the Hub for something no reply covers')
})

/** Whether the element draws a tick before itself. */
function tickDrawn(element: Element): boolean {
  const tick = getComputedStyle(element, '::before')
  return tick.content !== 'none' && tick.backgroundColor !== 'rgba(0, 0, 0, 0)'
}

/** A computed colour as sRGB channels, whatever notation the browser answers in. */
function channelsOf(locator: Locator, property: 'backgroundColor' | 'color'): Promise<number[]> {
  return locator.evaluate((element, name) => {
    const context = document.createElement('canvas').getContext('2d')
    if (!context) throw new Error('the browser gives no canvas')
    context.fillStyle = getComputedStyle(element)[name]
    context.fillRect(0, 0, 1, 1)
    return [...context.getImageData(0, 0, 1, 1).data.slice(0, 3)]
  }, property)
}

const GRAPHITE = {
  light: { frame: [24, 24, 24], sheet: [252, 252, 252], current: [51, 51, 51] },
  dark: { frame: [16, 16, 16], sheet: [25, 25, 25], current: [43, 43, 43] },
}
// Inside the frame a colour resolves on its dark side in both themes.
const FRAME_TEXT_2 = [177, 177, 177]
const IPE = [255, 215, 102]

for (const scheme of ['light', 'dark'] as const) {
  test(`a folha encaixada na moldura, no tema ${scheme}`, async () => {
    const page = await harness.open(`/companies/${COMPANY.id}`, {
      viewport: DESKTOP,
      replies: owner(CONVERSATIONS),
      scheme,
    })
    const nav = page.getByRole('navigation', { name: 'Navegação' })
    const label = nav.getByRole('heading', { name: 'Conversas' })
    await label.waitFor()
    await atRest(page)
    const frame = page.locator('[data-slot=sidebar-wrapper]')
    const sheet = page.locator('[data-slot=sidebar-inset]')
    assert.deepEqual(await channelsOf(frame, 'backgroundColor'), GRAPHITE[scheme].frame)
    assert.deepEqual(await channelsOf(sheet, 'backgroundColor'), GRAPHITE[scheme].sheet)
    assert.equal(
      await nav.evaluate((element) => getComputedStyle(element).backgroundColor),
      'rgba(0, 0, 0, 0)',
      'the sidebar paints a ground of its own over the frame',
    )
    assert.deepEqual(await channelsOf(label, 'color'), FRAME_TEXT_2)
    const [around, inset, bar] = await Promise.all([
      frame.boundingBox(),
      sheet.boundingBox(),
      nav.boundingBox(),
    ])
    assert.ok(around && inset && bar, 'the frame is not laid out')
    assert.deepEqual(
      {
        left: inset.x - (bar.x + bar.width),
        top: inset.y - around.y,
        right: around.x + around.width - (inset.x + inset.width),
        bottom: around.y + around.height - (inset.y + inset.height),
        corner: await sheet.evaluate((element) => getComputedStyle(element).borderRadius),
      },
      { left: 0, top: 8, right: 8, bottom: 8, corner: '16px' },
    )
    assert.deepEqual(page.problems, [])
    await page.close()
  })
}

test('a folha encaixada na moldura: a 768 px tem a margem e o canto, a 390 px ocupa a tela sem rolagem lateral', async () => {
  const tablet = await harness.open(`/companies/${COMPANY.id}`, {
    viewport: { width: 768, height: 900 },
    replies: owner([]),
  })
  const inset = tablet.locator('[data-slot=sidebar-inset]')
  await tablet.getByRole('navigation', { name: 'Navegação' }).waitFor()
  await atRest(tablet)
  const box = await inset.boundingBox()
  assert.deepEqual(
    [box?.y, 768 - ((box?.x ?? 0) + (box?.width ?? 0))],
    [8, 8],
    'at 768px the sheet is not inset',
  )
  assert.equal(await inset.evaluate((element) => getComputedStyle(element).borderRadius), '16px')
  await tablet.close()

  const phone = await harness.open(`/companies/${COMPANY.id}`, {
    viewport: PHONE,
    replies: owner([]),
  })
  const sheet = phone.locator('[data-slot=sidebar-inset]')
  await phone.getByRole('button', { name: /Abrir navegação/ }).waitFor()
  await atRest(phone)
  const whole = await sheet.boundingBox()
  assert.deepEqual([whole?.x, whole?.y, whole?.width], [0, 0, PHONE.width])
  assert.equal(await sheet.evaluate((element) => getComputedStyle(element).borderRadius), '0px')
  assert.equal(await phone.evaluate(() => document.documentElement.scrollWidth), PHONE.width)
  await phone.getByRole('button', { name: /Abrir navegação/ }).click()
  const drawer = phone.locator('[data-slot=sheet-content]')
  await drawer.waitFor()
  assert.deepEqual(await channelsOf(drawer, 'backgroundColor'), GRAPHITE.light.frame)
  await phone.close()
})

for (const scheme of ['light', 'dark'] as const) {
  test(`o item atual acende o ícone, com a barra aberta e recolhida, no tema ${scheme}`, async () => {
    const page = await harness.open(`/companies/${COMPANY.id}`, {
      viewport: DESKTOP,
      replies: owner(CONVERSATIONS),
      scheme,
    })
    const nav = page.getByRole('navigation', { name: 'Navegação' })
    const home = nav.getByRole('link', { name: 'Início' })
    const other = nav.getByRole('link', { name: 'Projetos' })
    await home.waitFor()
    for (const state of ['expanded', 'collapsed']) {
      await page.locator(`[data-slot=sidebar][data-state=${state}]`).waitFor()
      await atRest(page)
      assert.equal(await home.getAttribute('aria-current'), 'page', state)
      assert.deepEqual(await channelsOf(home, 'backgroundColor'), GRAPHITE[scheme].current, state)
      assert.deepEqual(await channelsOf(home.locator('svg'), 'color'), IPE, state)
      assert.equal(
        await home.evaluate(tickDrawn),
        false,
        `${state}: the current place draws a tick`,
      )
      assert.equal(await other.getAttribute('aria-current'), null, state)
      assert.deepEqual(await channelsOf(other.locator('svg'), 'color'), FRAME_TEXT_2, state)
      assert.equal(
        await other.evaluate((element) => getComputedStyle(element).backgroundColor),
        'rgba(0, 0, 0, 0)',
        state,
      )
      await page.keyboard.press('Control+b')
    }
    await page.close()

    const opened = await harness.open(ASSISTANT_PATH, {
      viewport: DESKTOP,
      replies: {
        ...ASSISTANT_REPLIES,
        ...onlyList(owner([{ id: OPENED, title: 'Vendas da semana' }])),
      },
      scheme,
    })
    const row = opened
      .getByRole('navigation', { name: 'Navegação' })
      .locator('[data-sidebar=sidebar]')
      .getByRole('link', { name: /Vendas da semana/ })
    await row.waitFor()
    await atRest(opened)
    assert.equal(await row.getAttribute('aria-current'), 'page')
    assert.deepEqual(await channelsOf(row, 'backgroundColor'), GRAPHITE[scheme].current)
    assert.equal(await row.evaluate(tickDrawn), false, 'the current conversation draws a tick')
    await opened.close()
  })
}

// A place in a list with an icon, such as a section of Configurações; "Voltar" leads out and is
// never the current place.
test('em Configurações a seção aberta acende o ícone e "Voltar" não é o lugar atual', async () => {
  const state = DEFAULT_STATES.find((one) => one.name.endsWith('padrões da empresa do dono'))
  assert.ok(state, 'the sweep lacks the owner at Padrões da empresa')
  const page = await harness.open(state.path, { viewport: DESKTOP, replies: state.replies })
  await state.settle(page)
  await atRest(page)
  const bar = page.locator('[data-slot=sidebar]')
  const current = bar.locator('a[aria-current=page]')
  assert.equal(await current.count(), 1, 'the sidebar marks more than one current place')
  assert.deepEqual(await channelsOf(current, 'backgroundColor'), GRAPHITE.light.current)
  assert.deepEqual(await channelsOf(current.locator('svg'), 'color'), IPE)
  const back = bar.getByRole('link', { name: 'Voltar' })
  assert.equal(await back.getAttribute('aria-current'), null)
  assert.deepEqual(await channelsOf(back.locator('svg'), 'color'), FRAME_TEXT_2)
  await page.close()
})
