import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import type { Locator, Page } from 'playwright-core'
import { atRest } from './at-rest.ts'
import { createHarness, DESKTOP, PHONE, reachOf, touching } from './layout-harness.ts'
import { STATES } from './sweep-states.ts'

// Every piece of ui/ on its showcase page (pieces.html), under the Hub's policy in a real browser.
const harness = createHarness(import.meta.dirname)
before(() => harness.start())
after(async () => {
  await harness.stop()
  assert.deepEqual(harness.unanswered, [], 'the page asked the Hub for something no reply covers')
})

function open(path: string) {
  return harness.open(path, { viewport: DESKTOP, replies: {} })
}

/** One piece's block on the page, in its light band. */
function piece(page: Page, file: string): Locator {
  return page.locator(`[data-file="${file}"] [data-band=light]`)
}

async function widthOf(locator: Locator): Promise<number> {
  const box = await locator.boundingBox()
  assert.ok(box, 'the element is not laid out')
  return box.width
}

test('as peças sob a política do Hub: nenhum erro nem violação, arrastar o divisor incluído', async () => {
  const page = await open('/pieces')
  const resizable = piece(page, 'resizable.tsx')
  const handle = resizable.getByRole('separator', { name: 'Redimensionar' })
  const chat = resizable.locator('[data-slot=resizable-panel]').last()
  await handle.scrollIntoViewIfNeeded()
  const before = await widthOf(chat)
  const box = await handle.boundingBox()
  assert.ok(box, 'the handle is not laid out')
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x - 200, box.y + box.height / 2, { steps: 5 })
  await page.mouse.up()
  assert.ok((await widthOf(chat)) > before + 150, 'dragging the handle did not widen the chat')
  await piece(page, 'tabs.tsx').getByRole('tab', { name: 'Projeto' }).click()
  await piece(page, 'collapsible.tsx').getByRole('button', { name: 'Detalhes' }).click()
  await piece(page, 'popover.tsx').getByRole('button', { name: 'Raciocínio' }).click()
  const popup = page.locator('[data-slot=popover-content]')
  const level = popup.getByRole('slider', { name: 'Raciocínio' })
  assert.equal(await level.getAttribute('aria-valuenow'), '3')
  const track = await popup.locator('[data-slot=slider-track]').boundingBox()
  assert.ok(track, 'the slider is not laid out')
  await page.mouse.move(track.x + track.width * 0.75, track.y + track.height / 2)
  await page.mouse.down()
  await page.mouse.move(track.x + track.width * 0.25, track.y + track.height / 2, { steps: 5 })
  await page.mouse.up()
  assert.equal(await level.getAttribute('aria-valuenow'), '1', 'dragging the thumb moved the level')
  await page.keyboard.press('End')
  assert.equal(await level.getAttribute('aria-valuenow'), '4')
  await page.keyboard.press('Escape')
  await piece(page, 'combobox.tsx').getByRole('combobox', { name: 'Modelo' }).first().click()
  await page.getByRole('option', { name: 'Claude Opus 4.5' }).waitFor()
  await page.keyboard.press('Escape')
  await piece(page, 'trace.tsx')
    .getByRole('button', { name: /Leu 3 páginas/ })
    .click()
  await piece(page, 'tooltip.tsx').getByRole('button', { name: 'Enviar' }).hover()
  await page.locator('[data-slot=tooltip-content]').waitFor()
  assert.deepEqual(page.problems, [])
  await page.close()
})

for (const [reducedMotion, moves] of [
  ['no-preference', true],
  ['reduce', false],
] as const) {
  test(`a marca trabalhando ${moves ? 'se mexe' : 'fica parada com prefers-reduced-motion'}`, async () => {
    const page = await open('/pieces')
    await page.emulateMedia({ reducedMotion })
    const mark = page.locator('svg[width="48"]').first()
    const offsets = new Set<string>()
    for (let frame = 0; frame < 6; frame++) {
      await page.evaluate((at) => {
        for (const one of document.getAnimations()) {
          one.pause()
          one.currentTime = at
        }
      }, frame * 150)
      offsets.add(
        await mark
          .locator('path')
          .first()
          .evaluate((piece) => getComputedStyle(piece).transform),
      )
    }
    assert.equal(offsets.size > 1, moves)
    await page.close()
  })
}

for (const [reducedMotion, name] of [
  ['no-preference', 'shimmer'],
  ['reduce', 'none'],
] as const) {
  test(`o título de uma linha em curso ${name === 'none' ? 'não brilha com prefers-reduced-motion' : 'brilha'}`, async () => {
    const page = await open('/pieces')
    await page.emulateMedia({ reducedMotion })
    const title = page.locator('[data-status=running] > [data-slot=trace-title]').first()
    assert.equal(await title.evaluate((el) => getComputedStyle(el).animationName), name)
    await page.close()
  })
}

test('a escala dos botões, no computador e no celular', async () => {
  for (const viewport of [DESKTOP, PHONE]) {
    const page = await harness.open('/pieces', { viewport, replies: {} })
    const sizes = await Promise.all(
      [
        piece(page, 'button.tsx').getByRole('button', { name: 'Salvar', exact: true }).first(),
        piece(page, 'button.tsx').getByRole('button', { name: 'Pequeno', exact: true }).first(),
        piece(page, 'button.tsx').getByRole('button', { name: 'Ícone', exact: true }).first(),
        piece(page, 'button.tsx')
          .getByRole('button', { name: 'Ícone pequeno', exact: true })
          .first(),
      ].map((each) =>
        each.evaluate((button) => {
          const box = button.getBoundingClientRect()
          return [box.height, getComputedStyle(button).fontSize]
        }),
      ),
    )
    const [padrao, pequeno] = sizes
    assert.deepEqual(padrao, [32, '13px'], `default at ${viewport.width}px`)
    assert.deepEqual(pequeno, [28, '13px'], `sm at ${viewport.width}px`)
    const icons = await Promise.all(
      ['Ícone', 'Ícone pequeno'].map((name) =>
        piece(page, 'button.tsx')
          .getByRole('button', { name, exact: true })
          .first()
          .evaluate((button) => [
            button.getBoundingClientRect().width,
            button.getBoundingClientRect().height,
          ]),
      ),
    )
    assert.deepEqual(
      icons,
      [
        [32, 32],
        [28, 28],
      ],
      `icon at ${viewport.width}px`,
    )
    await page.close()
  }
})

test('a medida: itens de menu e linhas da barra de 32 px, campos de 36 px, a 1366 e a 390 px', async () => {
  // The member's Início lists conversations, none in the sweep; a Projeto's sidebar lists its places.
  const home = STATES.find((each) => each.name === 'Projeto, Sobre do membro')
  assert.ok(home, 'the sweep lacks the member in a Projeto')
  for (const viewport of [DESKTOP, PHONE]) {
    const page = await harness.open('/pieces', { viewport, replies: {} })
    const field = await piece(page, 'input.tsx')
      .getByRole('textbox', { name: 'Campo' })
      .first()
      .boundingBox()
    assert.equal(field?.height, 36, `a field at ${viewport.width}px`)
    await page.close()
  }
  const page = await harness.open(home.path, { viewport: DESKTOP, replies: home.replies })
  await home.settle(page)
  const rows = await page
    .locator('[data-slot=sidebar-menu-item] > a')
    .evaluateAll((all) => all.map((one) => one.getBoundingClientRect().height))
  assert.ok(rows.length > 0, 'the sidebar has no rows')
  assert.ok(rows.includes(32), 'no sidebar row is 32 px')
  assert.ok(!rows.includes(34), 'a sidebar row is still 34 px')
  await page.getByRole('button', { name: /^Conta de / }).click()
  await atRest(page)
  const item = await page.getByRole('menuitem', { name: 'Sair do Conexus' }).boundingBox()
  assert.equal(item?.height, 32, 'a menu item is not 32 px')
  await page.close()
})

test('o toque alcança 44 × 44 sem desenhar o botão maior', async () => {
  const page = await harness.open('/pieces', { viewport: PHONE, replies: {} })
  await touching(page)
  for (const name of ['Salvar', 'Pequeno', 'Ícone', 'Ícone pequeno']) {
    const button = piece(page, 'button.tsx').getByRole('button', { name, exact: true }).first()
    const box = await button.boundingBox()
    const reach = await reachOf(button)
    assert.ok(box, `${name} is not laid out`)
    assert.ok(box.height <= 32, `${name} is drawn larger under touch: ${box.height}`)
    assert.ok(box.height + reach.up + reach.down >= 44, `${name} reaches less than 44 high`)
    assert.ok(box.width + reach.left + reach.right >= 44, `${name} reaches less than 44 wide`)
  }
  await page.close()
})

test('o celular desenhado da Prévia mede 390', async () => {
  const state = STATES.find((each) => each.name === 'Projeto, Prévia no Celular')
  assert.ok(state, 'the sweep lacks the Prévia no Celular')
  const page = await harness.open(state.path, { viewport: DESKTOP, replies: state.replies })
  await state.settle(page)
  const frame = await page.locator('iframe').first().boundingBox()
  assert.equal(frame?.width, 390, 'the drawn phone is not 390 wide')
  await page.close()
})

test('num toque as linhas e os itens têm 44 px; com o mouse ficam em 32 (V58)', async () => {
  // The member's Início lists conversations, none in the sweep; a Projeto's sidebar lists its places.
  const home = STATES.find((each) => each.name === 'Projeto, Sobre do membro')
  assert.ok(home, 'the sweep lacks the member in a Projeto')
  const page = await harness.open(home.path, { viewport: DESKTOP, replies: home.replies })
  await home.settle(page)
  await page.getByRole('button', { name: /^Conta de / }).click()
  await atRest(page)
  await touching(page)
  const rows = await page
    .locator('[data-slot=sidebar-menu-item] > a')
    .evaluateAll((all) => all.map((one) => one.getBoundingClientRect().height))
  assert.ok(rows.length > 0, 'the sidebar has no rows')
  assert.ok(rows.includes(44), 'no sidebar row is 44 px under touch')
  assert.ok(!rows.includes(32), 'a sidebar row stayed 32 px under touch')
  const item = await page.getByRole('menuitem', { name: 'Sair do Conexus' }).boundingBox()
  assert.equal(item?.height, 44, 'a menu item is not 44 px under touch')
  await page.close()

  const mouse = await harness.open(home.path, { viewport: DESKTOP, replies: home.replies })
  await home.settle(mouse)
  const fine = await mouse
    .locator('[data-slot=sidebar-menu-item] > a')
    .evaluateAll((all) => all.map((one) => one.getBoundingClientRect().height))
  assert.ok(fine.includes(32), 'no sidebar row is 32 px with a mouse')
  assert.ok(!fine.includes(44), 'a sidebar row is 44 px with a mouse')
  await mouse.getByRole('button', { name: /^Conta de / }).click()
  await atRest(mouse)
  const fineItem = await mouse.getByRole('menuitem', { name: 'Sair do Conexus' }).boundingBox()
  assert.equal(fineItem?.height, 32, 'a menu item is not 32 px with a mouse')
  await mouse.close()

  const rail = await harness.open(home.path, {
    viewport: { width: 800, height: 900 },
    replies: home.replies,
  })
  await home.settle(rail)
  const tile = rail.locator('[data-slot=sidebar-rail-column]').getByRole('link').first()
  await tile.waitFor()
  const fineBox = await tile.boundingBox()
  assert.equal(fineBox?.height, 40, 'the collapsed rail has no 40 px tile with a mouse')
  assert.equal(
    await rail.locator('[data-sidebar=sidebar]').evaluate((one) => getComputedStyle(one).display),
    'none',
    'the list is not collapsed below 1024 px',
  )
  await touching(rail)
  const reach = await reachOf(tile)
  const touchBox = await tile.boundingBox()
  assert.equal(touchBox?.height, 40, 'a collapsed rail tile changed size under touch')
  assert.ok(
    (touchBox?.height ?? 0) + reach.up + reach.down >= 44 &&
      (touchBox?.width ?? 0) + reach.left + reach.right >= 44,
    'a collapsed rail tile reaches less than 44 under touch',
  )
  await rail.close()
})
