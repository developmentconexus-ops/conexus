import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import type { Replies } from './layout-harness.ts'
import { createHarness, DESKTOP, presses } from './layout-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import { waitFor } from './sweep-kit.ts'
import { OWNER } from './sweep-replies.ts'

const harness = createHarness(import.meta.dirname)
before(() => harness.start())
after(async () => {
  await harness.stop()
  assert.deepEqual(harness.unanswered, [], 'the page asked the Hub for something no reply covers')
})

const COMPANIES = '/api/companies'

/** Opens the company page, then reloads it: the account menu reads the company list on each load. */
async function menuRead(replies: Replies) {
  const page = await harness.open(`/companies/${COMPANY.id}/people`, { viewport: DESKTOP, replies })
  await waitFor(page, 'Convidar pessoa')
  const read = page.waitForResponse((response) => new URL(response.url()).pathname === COMPANIES)
  await page.reload()
  return { page, response: await read }
}

test('o menu da conta lê a lista de empresas a cada carga, e o Hub de teste responde', async () => {
  const before = harness.unanswered.length
  const { page, response } = await menuRead(OWNER)
  assert.deepEqual([response.status(), harness.unanswered.length - before], [200, 0])
  await page.close()
})

test('um pedido que ninguém responde continua recusado: 500 e registrado como sem resposta', async () => {
  const { 'GET /api/companies': _answered, ...unlisted } = OWNER
  const { page, response } = await menuRead(unlisted)
  assert.equal(response.status(), 500)
  // The refusal is the point of this case, so it is taken off the run's list before the final check.
  const refused = harness.unanswered.splice(0)
  assert.ok(refused.length > 0)
  assert.deepEqual(new Set(refused), new Set(['GET /api/companies']))
  await page.close()
})

test('o popup do papel, aberto pelo teclado, mostra o contorno de 2px inteiro dentro da lista', async () => {
  const page = await harness.open(`/companies/${COMPANY.id}/people`, {
    viewport: DESKTOP,
    replies: OWNER,
  })
  await waitFor(page, 'Convidar pessoa')
  await page.getByRole('combobox', { name: 'Papel' }).focus()
  const stops = [...(await presses(page, 'Enter', 1)), ...(await presses(page, 'ArrowUp', 1))]
  stops.push(...(await presses(page, 'ArrowDown', 1)))
  assert.deepEqual(
    stops.map((stop) => stop.replace(/ inside$/, '')),
    ['Membro solid 2px', 'Administrador solid 2px', 'Membro solid 2px'],
  )
  const clipped = await page.evaluate(() => {
    const option = document.activeElement
    if (option?.getAttribute('role') !== 'option') return ['focus is not on an option']
    const { outlineOffset, outlineWidth } = getComputedStyle(option)
    const reach = Number.parseFloat(outlineOffset) + Number.parseFloat(outlineWidth)
    const box = option.getBoundingClientRect()
    const cut: string[] = []
    for (let up = option.parentElement; up; up = up.parentElement) {
      const { overflowX, overflowY } = getComputedStyle(up)
      if (overflowX === 'visible' && overflowY === 'visible') continue
      const clip = up.getBoundingClientRect()
      const inside =
        box.left - reach >= clip.left + up.clientLeft &&
        box.right + reach <= clip.left + up.clientLeft + up.clientWidth &&
        box.top - reach >= clip.top + up.clientTop &&
        box.bottom + reach <= clip.top + up.clientTop + up.clientHeight
      if (!inside) cut.push(up.getAttribute('role') ?? up.tagName)
    }
    return cut
  })
  assert.deepEqual(clipped, [])
  await page.close()
})
