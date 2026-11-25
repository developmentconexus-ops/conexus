import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createHarness, PHONE } from './layout-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import { connectionOf, connectionPage, connectionsPage } from './sweep-connections.ts'
import { INTEGRATIONS_STATES } from './sweep-integrations-states.ts'
import { OWNER } from './sweep-replies.ts'

// The window "Ligar" opens is a form of several fields with its help: on a laptop screen the four
// fields and both buttons are in view with no scrolling, and on a phone the buttons stay in view
// while the body scrolls (design V18, V26).
const harness = createHarness(import.meta.dirname)
before(() => harness.start())
after(async () => {
  await harness.stop()
  assert.deepEqual(harness.unanswered, [], 'the page asked the Hub for something no reply covers')
})

const LINK = INTEGRATIONS_STATES.find((state) => state.name.includes('janela de Ligar'))
const DESKTOPS = [
  { width: 1280, height: 720 },
  { width: 1366, height: 768 },
  { width: 1536, height: 864 },
  { width: 1920, height: 1080 },
]

for (const viewport of DESKTOPS) {
  test(`a janela Ligar mostra os campos e os dois botões sem rolar em ${viewport.width}x${viewport.height}`, async () => {
    assert.ok(LINK, 'the link state is missing')
    const page = await harness.open(LINK.path, { viewport, replies: LINK.replies })
    await LINK.settle(page)
    const dialog = page.getByRole('dialog', { name: 'Ligar Sankhya' })
    const drawn = await dialog.boundingBox()
    assert.ok(
      drawn && drawn.width > 384,
      `the dialog is ${drawn?.width}px wide: a short ask's card`,
    )
    for (const target of [
      dialog.getByLabel('Nome da ligação'),
      dialog.getByLabel('Client ID', { exact: true }),
      dialog.getByLabel('Client Secret', { exact: true }),
      dialog.getByLabel('X-Token', { exact: true }),
      dialog.getByLabel('Desde'),
      dialog.getByRole('button', { name: 'Continuar' }),
      dialog.getByRole('button', { name: 'Cancelar' }),
    ]) {
      const box = await target.boundingBox()
      assert.ok(box, 'a field or a button is not laid out')
      assert.ok(
        box.y >= 0 && box.y + box.height <= viewport.height,
        `${box.y + box.height}px is below the ${viewport.height}px screen`,
      )
    }
    const body = dialog.locator('[data-slot="dialog-body"]')
    const scrolls = await body.evaluate((one) => one.scrollHeight > one.clientHeight)
    assert.equal(scrolls, false, 'the body scrolls on a desktop screen')
    assert.deepEqual(page.problems, [])
    await page.close()
  })
}

test('a janela Ligar no celular ocupa a tela, o corpo rola e os botões ficam à vista', async () => {
  assert.ok(LINK, 'the link state is missing')
  const page = await harness.open(LINK.path, { viewport: PHONE, replies: LINK.replies })
  await LINK.settle(page)
  const dialog = page.getByRole('dialog', { name: 'Ligar Sankhya' })
  const drawn = await dialog.boundingBox()
  assert.deepEqual(drawn && [drawn.x, drawn.y, drawn.width, drawn.height], [
    0,
    0,
    PHONE.width,
    PHONE.height,
  ])
  const help = await dialog.getByRole('region', { name: 'Antes de colar' }).boundingBox()
  const first = await dialog.getByLabel('Nome da ligação').boundingBox()
  assert.ok(help && first && help.y < first.y, 'the help is not above the fields')
  for (const name of ['Continuar', 'Cancelar']) {
    const box = await dialog.getByRole('button', { name }).boundingBox()
    assert.ok(box && box.y + box.height <= PHONE.height, `${name} is below the screen`)
  }
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), PHONE.width)
  assert.deepEqual(page.problems, [])
  await page.close()
})

test('no celular o prefixo e o nome no lago têm 16 px, abaixo disso o navegador dá zoom no campo (V18)', async () => {
  const connection = connectionOf({ name: 'Matriz', state: 'ACTIVE' })
  const replies = {
    ...OWNER,
    ...connectionsPage(COMPANY.id, true, [connection]),
    ...connectionPage(COMPANY.id, connection),
  }
  const page = await harness.open(`/companies/${COMPANY.id}/integrations/${connection.id}`, {
    viewport: PHONE,
    replies,
  })
  await page.getByRole('tab', { name: 'Tabelas' }).click()
  await page.getByRole('button', { name: 'Escolher o que copiar' }).click()
  const dialog = page.getByRole('dialog', { name: 'Ligar Sankhya' })
  await dialog.getByRole('checkbox', { name: 'Notas e pedidos' }).click()
  for (const field of [
    dialog.getByLabel('Prefixo'),
    dialog.getByLabel('Nome no lago: Notas e pedidos'),
  ]) {
    const size = await field.evaluate((one) => getComputedStyle(one).fontSize)
    assert.equal(size, '16px')
  }
  assert.deepEqual(page.problems, [])
  await page.close()
})
