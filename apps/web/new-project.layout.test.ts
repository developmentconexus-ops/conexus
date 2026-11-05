import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createHarness, DESKTOP, PHONE } from './layout-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import { MEMBER, OWNER, projectsPage } from './sweep-replies.ts'

// The Novo projeto button of Início's Projetos block and the dialog it opens, in a real browser (design V18, V32).
const harness = createHarness(import.meta.dirname)
before(() => harness.start())
after(async () => {
  await harness.stop()
  assert.deepEqual(harness.unanswered, [], 'the page asked the Hub for something no reply covers')
})

for (const viewport of [DESKTOP, PHONE]) {
  test(`o diálogo de "Novo projeto", aberto pelo membro no bloco Projetos do Início, cabe numa tela de ${viewport.width}px`, async () => {
    const page = await harness.open(`/companies/${COMPANY.id}`, {
      viewport,
      replies: { ...MEMBER, ...projectsPage(COMPANY.id) },
    })
    const plus = page.getByRole('region', { name: 'Projetos' }).getByRole('button', {
      name: 'Novo projeto',
    })
    await plus.waitFor()
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
    // A pop-up asking one name, not a page: a 24rem card, and on the phone a card 16px from each side.
    assert.ok(drawn.height < viewport.height, 'the dialog fills the screen')
    assert.ok(drawn.y > 0, 'the dialog touches the top edge')
    if (viewport === DESKTOP) assert.ok(drawn.width <= 384, `the dialog is ${drawn.width}px wide`)
    else assert.equal(drawn.width, viewport.width - 32)
    assert.deepEqual(page.problems, [])
    await page.close()
  })
}

test('ninguém tem o + na lista: "Novo projeto" fica no cabeçalho do bloco Projetos do Início e abre o diálogo', async () => {
  const page = await harness.open(`/companies/${COMPANY.id}`, {
    viewport: DESKTOP,
    replies: { ...OWNER, ...projectsPage(COMPANY.id) },
  })
  const block = page.getByRole('region', { name: 'Projetos' })
  const trigger = block.getByRole('button', { name: 'Novo projeto' })
  await trigger.waitFor()
  assert.equal(
    await page
      .getByRole('navigation', { name: 'Navegação' })
      .getByRole('button', { name: 'Novo projeto' })
      .count(),
    0,
  )
  await trigger.click()
  await page.getByRole('dialog', { name: 'Novo projeto' }).waitFor()
  await page.close()
})

for (const viewport of [DESKTOP, PHONE]) {
  test(`Todos os projetos: o nome comprido do Projeto aparece inteiro no cartão a ${viewport.width}px, em mais de uma linha se for preciso (V18)`, async () => {
    const page = await harness.open(`/companies/${COMPANY.id}/projects`, {
      viewport,
      replies: { ...OWNER, ...projectsPage(COMPANY.id) },
    })
    const name = page.getByRole('link').locator('span.font-display').last()
    await name.waitFor()
    const cut = await name.evaluate((element) => ({
      ellipsis: getComputedStyle(element).textOverflow === 'ellipsis',
      clipped: element.scrollWidth > element.clientWidth,
    }))
    assert.deepEqual(cut, { ellipsis: false, clipped: false }, 'the name is cut in the card')
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), viewport.width)
    await page.close()
  })
}
