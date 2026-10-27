import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import type { Locator } from 'playwright-core'
import { createHarness, DESKTOP, PHONE } from './layout-harness.ts'

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
