import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import type { Locator, Page } from 'playwright-core'
import { createHarness, DESKTOP, PHONE, reachOf, touching } from './layout-harness.ts'
import { STATES } from './sweep-states.ts'

// The chat pieces on their fixture page (pieces.html), under the Hub's policy in a real browser.
const harness = createHarness(import.meta.dirname)
before(() => harness.start())
after(async () => {
  await harness.stop()
  assert.deepEqual(harness.unanswered, [], 'the page asked the Hub for something no reply covers')
})

function open(path: string) {
  return harness.open(path, { viewport: DESKTOP, replies: {} })
}

async function widthOf(locator: Locator): Promise<number> {
  const box = await locator.boundingBox()
  assert.ok(box, 'the element is not laid out')
  return box.width
}

test('as peças de chat sob a política do Hub: nenhum erro nem violação, arrastar o divisor incluído', async () => {
  const page = await open('/pieces')
  const handle = page.getByRole('separator', { name: 'Redimensionar' })
  const chat = page.locator('[data-slot=resizable-panel]').last()
  const before = await widthOf(chat)
  const box = await handle.boundingBox()
  assert.ok(box, 'the handle is not laid out')
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x - 200, box.y + box.height / 2, { steps: 5 })
  await page.mouse.up()
  assert.ok((await widthOf(chat)) > before + 150, 'dragging the handle did not widen the chat')
  await page.getByRole('tab', { name: 'Projeto' }).click()
  await page.getByRole('button', { name: 'Detalhes' }).click()
  await page.getByRole('button', { name: 'Raciocínio' }).click()
  const level = page.getByRole('slider', { name: 'Raciocínio' })
  assert.equal(await level.getAttribute('aria-valuenow'), '3')
  const track = await page.locator('[data-slot=slider-track]').boundingBox()
  assert.ok(track, 'the slider is not laid out')
  await page.mouse.move(track.x + track.width * 0.75, track.y + track.height / 2)
  await page.mouse.down()
  await page.mouse.move(track.x + track.width * 0.25, track.y + track.height / 2, { steps: 5 })
  await page.mouse.up()
  assert.equal(await level.getAttribute('aria-valuenow'), '1', 'dragging the thumb moved the level')
  await page.keyboard.press('End')
  assert.equal(await level.getAttribute('aria-valuenow'), '4')
  await page.keyboard.press('Escape')
  await page.getByRole('combobox', { name: 'Modelo' }).click()
  await page.getByRole('option', { name: 'Claude Opus 4.5' }).waitFor()
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: /Leu 3 páginas/ }).click()
  await page.getByRole('button', { name: 'Enviar' }).hover()
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
    const mark = page.locator('svg[width="48"]')
    const offsets = new Set<string>()
    for (let frame = 0; frame < 6; frame++) {
      offsets.add(
        await mark
          .locator('path')
          .first()
          .evaluate((piece) => getComputedStyle(piece).transform),
      )
      await page.waitForTimeout(150)
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
        page.getByRole('button', { name: 'Padrão', exact: true }),
        page.getByRole('button', { name: 'Pequeno', exact: true }),
        page.getByRole('button', { name: 'Ícone', exact: true }),
        page.getByRole('button', { name: 'Ícone pequeno', exact: true }),
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
        page
          .getByRole('button', { name, exact: true })
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
  const home = STATES.find((each) => each.name === 'Início, a primeira de duas empresas')
  assert.ok(home, 'the sweep lacks Início')
  for (const viewport of [DESKTOP, PHONE]) {
    const page = await harness.open('/pieces', { viewport, replies: {} })
    const field = await page.getByRole('textbox', { name: 'Campo' }).boundingBox()
    assert.equal(field?.height, 36, `a field at ${viewport.width}px`)
    await page.close()
  }
  const page = await harness.open(home.path, { viewport: DESKTOP, replies: home.replies })
  await home.settle(page)
  const rows = await page
    .locator('[data-slot=sidebar-menu-item] > *')
    .evaluateAll((all) => all.map((one) => one.getBoundingClientRect().height))
  assert.ok(rows.length > 0, 'the sidebar has no rows')
  assert.ok(rows.includes(32), 'no sidebar row is 32 px')
  assert.ok(!rows.includes(34), 'a sidebar row is still 34 px')
  await page.getByRole('button', { name: /^Conta de / }).click()
  const item = await page.getByRole('menuitem', { name: 'Sair do Conexus' }).boundingBox()
  assert.equal(item?.height, 32, 'a menu item is not 32 px')
  await page.close()
})

test('o toque alcança 44 × 44 sem desenhar o botão maior', async () => {
  const page = await harness.open('/pieces', { viewport: PHONE, replies: {} })
  await touching(page)
  for (const name of ['Padrão', 'Pequeno', 'Ícone', 'Ícone pequeno']) {
    const button = page.getByRole('button', { name, exact: true })
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

/** The line height of every element that holds text of its own, as the browser computes it. */
function textLineHeights(page: Page) {
  return page.evaluate(() => {
    const found: string[] = []
    for (const element of document.body.querySelectorAll('*')) {
      const own = [...element.childNodes].some(
        (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
      )
      if (!own) continue
      const { lineHeight } = getComputedStyle(element)
      if (!(Number.parseFloat(lineHeight) % 4 === 0))
        found.push(`${element.tagName}: ${lineHeight}`)
    }
    return found
  })
}

test('a fonte: Hanken Grotesk e JetBrains Mono, a saudação em 28 e 24, toda linha de texto na grade de 4', async () => {
  const home = STATES.find((each) => each.name === 'Início, a primeira de duas empresas')
  assert.ok(home, 'the sweep lacks Início')
  for (const [viewport, size, line] of [
    [DESKTOP, '28px', '36px'],
    [{ width: 639, height: 844 }, '24px', '32px'],
  ] as const) {
    const page = await harness.open(home.path, { viewport, replies: home.replies })
    await home.settle(page)
    const families = await page.evaluate(async () => {
      await document.fonts.ready
      return [...new Set([...document.fonts].map((face) => face.family.replaceAll('"', '')))].sort()
    })
    assert.deepEqual(families, ['Hanken Grotesk', 'JetBrains Mono'])
    const greeting = await page.getByRole('heading', { level: 1 }).evaluate((heading) => {
      const style = getComputedStyle(heading)
      return [style.fontSize, style.lineHeight, style.fontFamily.split(',')[0]?.replaceAll('"', '')]
    })
    assert.deepEqual(
      greeting,
      [size, line, 'Hanken Grotesk'],
      `the greeting at ${viewport.width}px`,
    )
    assert.deepEqual(
      await textLineHeights(page),
      [],
      `a line height off the 4px grid at ${viewport.width}px`,
    )
    await page.close()
  }
})

test('a prosa das mensagens usa o tipo reading, 15px com linha de 24, ', async () => {
  const page = await harness.open('/pieces', { viewport: DESKTOP, replies: {} })
  for (const text of ['Compare dois apps de encomenda', 'Resposta']) {
    const prose = await page
      .locator('[data-slot=bubble-content]', { hasText: text })
      .first()
      .evaluate((element) => {
        const style = getComputedStyle(element)
        return [style.fontSize, style.lineHeight]
      })
    assert.deepEqual(prose, ['15px', '24px'], text)
  }
  await page.close()
})
