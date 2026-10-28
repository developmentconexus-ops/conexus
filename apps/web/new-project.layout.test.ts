import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createHarness, DESKTOP, PHONE } from './layout-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import { OWNER, projectsPage } from './sweep-replies.ts'

// The sidebar's + and the dialog it opens, in a real browser (design V18, V32).
const harness = createHarness(import.meta.dirname)
before(() => harness.start())
after(async () => {
  await harness.stop()
  assert.deepEqual(harness.unanswered, [], 'the page asked the Hub for something no reply covers')
})

for (const viewport of [DESKTOP, PHONE]) {
  test(`o +: 28px na linha do grupo e o diálogo cabe numa tela de ${viewport.width}px`, async () => {
    const page = await harness.open(`/companies/${COMPANY.id}/projects`, {
      viewport,
      replies: { ...OWNER, ...projectsPage(COMPANY.id) },
    })
    if (viewport === PHONE) await page.getByRole('button', { name: 'Abrir navegação' }).click()
    const plus = page.getByRole('button', { name: 'Novo projeto' })
    await plus.waitFor()
    const box = await plus.boundingBox()
    const label = await page.getByText('Projetos recentes').boundingBox()
    assert.ok(box && label, 'the + or the group label is not laid out')
    assert.equal(box.width, 28)
    assert.equal(box.height, 28)
    assert.ok(
      Math.abs(box.y + box.height / 2 - (label.y + label.height / 2)) <= 1,
      '+ is off the label line',
    )
    await plus.click()
    const dialog = page.getByRole('dialog', { name: 'Novo projeto' })
    await dialog.waitFor()
    await page.getByLabel('Nome do projeto').fill('Estoque')
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), viewport.width)
    const drawn = await dialog.boundingBox()
    assert.ok(
      drawn && drawn.x >= 0 && drawn.x + drawn.width <= viewport.width,
      'the dialog leaves the screen',
    )
    assert.deepEqual(page.problems, [])
    await page.close()
  })
}
