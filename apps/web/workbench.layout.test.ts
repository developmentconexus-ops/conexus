import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import type { Locator } from 'playwright-core'
import { createHarness, DESKTOP, PHONE } from './layout-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import { WITH_CONVERSATIONS } from './sweep-conversation-states.ts'
import { PROJECT_ID } from './sweep-replies.ts'

// The Projeto's two regions, measured in the browser: jsdom computes no widths (testing T23).
const harness = createHarness(import.meta.dirname)
before(() => harness.start())
after(async () => {
  await harness.stop()
  assert.deepEqual(harness.unanswered, [], 'the page asked the Hub for something no reply covers')
})

function open(path: string, viewport: typeof DESKTOP) {
  return harness.open(path, { viewport, replies: WITH_CONVERSATIONS })
}

async function widthOf(locator: Locator): Promise<number> {
  const box = await locator.boundingBox()
  assert.ok(box, 'the element is not laid out')
  return box.width
}

const PROJECT = `/companies/${COMPANY.id}/projects/${PROJECT_ID}`
const CHAT = '[data-slot=resizable-panel]:last-of-type'

test('no Projeto a barra da empresa encolhe para ícones e volta ao sair', async () => {
  const page = await open(PROJECT, DESKTOP)
  await page.getByRole('textbox', { name: 'Mensagem para o Builder' }).waitFor()
  const rail = page.getByRole('navigation', { name: 'Navegação' }).locator('..')
  const inProject = await widthOf(rail)
  await page.getByRole('link', { name: 'Projetos' }).click()
  await page.getByRole('heading', { name: 'Projetos' }).waitFor()
  assert.deepEqual([inProject, await widthOf(rail)], [56, 224])
  assert.deepEqual(page.problems, [])
  await page.close()
})

test('o divisor da conversa: 380px, arrastado vale de 320px a 60%, e a página lembra', async () => {
  const page = await open(PROJECT, DESKTOP)
  await page.getByRole('textbox', { name: 'Mensagem para o Builder' }).waitFor()
  const chat = page.locator(CHAT)
  const handle = page.getByRole('separator', { name: 'Redimensionar a conversa' })
  async function dragBy(dx: number) {
    const box = await handle.boundingBox()
    assert.ok(box, 'the divider is not laid out')
    const y = box.y + box.height / 2
    await page.mouse.move(box.x + box.width / 2, y)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width / 2 + dx, y, { steps: 5 })
    await page.mouse.up()
    return Math.round(await widthOf(chat))
  }
  const group = await widthOf(page.locator('[data-slot=resizable-panel-group]'))
  const start = Math.round(await widthOf(chat))
  const wide = await dragBy(-200)
  const widest = await dragBy(-1000)
  await page.reload()
  await page.getByRole('textbox', { name: 'Mensagem para o Builder' }).waitFor()
  const remembered = Math.round(await widthOf(chat))
  const narrowest = await dragBy(1500)
  assert.deepEqual(
    { start, wider: wide > start + 150, widest: widest <= group * 0.6 + 1, remembered, narrowest },
    { start: 380, wider: true, widest: true, remembered: widest, narrowest: 320 },
  )
  assert.deepEqual(page.problems, [])
  await page.close()
})

test('no celular, "App | Conversa" troca de região sem perder o rascunho nem a rolagem', async () => {
  const page = await open(PROJECT, PHONE)
  await page.getByRole('tab', { name: 'Conversa' }).click()
  const field = page.getByRole('textbox', { name: 'Mensagem para o Builder' })
  await field.fill('meio da frase')
  const body = page.locator(`${CHAT} .overflow-y-auto`)
  await body.evaluate((element) => {
    element.scrollTop = 120
  })
  const scrolled = await body.evaluate((element) => element.scrollTop)
  await page.getByRole('tab', { name: 'App' }).click()
  const hidden = await field.isVisible()
  await page.getByRole('tab', { name: 'Conversa' }).click()
  assert.deepEqual(
    { hidden, draft: await field.inputValue(), scroll: await body.evaluate((e) => e.scrollTop) },
    { hidden: false, draft: 'meio da frase', scroll: scrolled },
  )
  assert.ok(scrolled > 0, 'the conversation did not scroll in the test')
  assert.deepEqual(page.problems, [])
  await page.close()
})
