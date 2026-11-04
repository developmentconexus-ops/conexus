import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createHarness, PHONE, reachOf, touching } from './layout-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import { OWNER, projectsPage, startsOn } from './sweep-replies.ts'

// The company's list inside the phone's drawer: the place label and the list's own controls (design V22, V32, V56).
const harness = createHarness(import.meta.dirname)
before(() => harness.start())
after(async () => {
  await harness.stop()
  assert.deepEqual(harness.unanswered, [], 'the page asked the Hub for something no reply covers')
})

test('a lista na gaveta do celular: o rótulo do lugar é pílula com × de 44 de toque, e buscar ou filtrar não fecha a gaveta', async () => {
  const page = await harness.open(`/companies/${COMPANY.id}?place=HOME`, {
    viewport: PHONE,
    replies: { ...OWNER, ...projectsPage(COMPANY.id), ...startsOn(COMPANY.id) },
  })
  await page.getByRole('button', { name: 'Abrir navegação' }).click()
  const drawer = page.getByRole('dialog', { name: 'Navegação' })
  const clear = drawer.getByRole('button', { name: 'Tirar o filtro: Início' })
  await clear.waitFor()
  await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running'))
  const pill = await clear.evaluate((button) => {
    const label = button.parentElement
    if (label === null) throw new Error('the button has no label')
    return {
      radius: parseFloat(getComputedStyle(label).borderTopLeftRadius),
      height: label.getBoundingClientRect().height,
    }
  })
  assert.ok(pill.radius >= pill.height / 2, 'the place label is not a pill')
  await drawer.getByRole('button', { name: 'Buscar conversa' }).click()
  await drawer.getByRole('searchbox', { name: 'Buscar pelo título' }).fill('rel')
  await page.waitForURL((url) => url.searchParams.get('q') === 'rel')
  await drawer.getByRole('tab', { name: 'Projetos' }).click()
  await page.waitForURL((url) => url.searchParams.get('tab') === 'projects')
  await page.waitForTimeout(400)
  assert.ok(await drawer.isVisible(), 'searching or switching the tab closed the drawer')
  await touching(page)
  const reach = await reachOf(clear)
  const drawn = await clear.boundingBox()
  assert.ok(drawn, 'the × is not laid out')
  assert.ok(drawn.width + reach.left + reach.right >= 44, 'the × is under 44 px wide to a finger')
  assert.ok(
    drawn.height + reach.up + reach.down >= 44,
    `the × is under 44 px tall to a finger ${JSON.stringify({ drawn, reach })}`,
  )
  await page.close()
})
