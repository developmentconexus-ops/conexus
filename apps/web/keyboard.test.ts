import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { listModelAccounts, ModelFallback, orderModelAccounts } from '@conexus/hub-api'
import type { Locator } from 'playwright-core'
import { atRest } from './at-rest.ts'
import type { Replies } from './layout-harness.ts'
import { createHarness, DESKTOP, presses } from './layout-harness.ts'
import { PLACES, popupOf, triggerOf } from './picker-places.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import { withAccounts } from './sweep-accounts-states.ts'
import { DEFAULT_STATES } from './sweep-defaults-states.ts'
import { waitFor } from './sweep-kit.ts'
import { OWNER } from './sweep-replies.ts'

const harness = createHarness(import.meta.dirname)
before(() => harness.start())
after(async () => {
  await harness.stop()
  assert.deepEqual(harness.unanswered, [], 'the page asked the Hub for something no reply covers')
})

const COMPANIES = '/api/companies'
/** Opens Início, then reloads it: the company switcher reads the company list on each load. */
async function menuRead(replies: Replies) {
  const page = await harness.open(`/companies/${COMPANY.id}`, { viewport: DESKTOP, replies })
  await waitFor(page, /^(Bom dia|Boa tarde|Boa noite)/)
  const read = page.waitForResponse((response) => new URL(response.url()).pathname === COMPANIES)
  await page.reload()
  return { page, response: await read }
}

test('a troca de empresa lê a lista de empresas a cada carga, e o Hub de teste responde', async () => {
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
  const page = await harness.open(`/companies/${COMPANY.id}/settings/people`, {
    viewport: DESKTOP,
    replies: OWNER,
  })
  await waitFor(page, 'Convidar pessoa')
  await page.getByRole('combobox', { name: 'Papel' }).focus()
  const stops = [...(await presses(page, 'Enter', 1)), ...(await presses(page, 'ArrowUp', 1))]
  stops.push(...(await presses(page, 'ArrowDown', 1)))
  assert.deepEqual(
    stops.map((stop) => stop.replace(/ inside$/, '')),
    ['Membro solid 2px', 'Desenvolvedor solid 2px', 'Membro solid 2px'],
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

test('Meus padrões, pelo teclado: o botão abre a lista, Tab vai ao deslizante, as setas mudam o nível e Esc devolve o foco, com nomes em português', async () => {
  const state = DEFAULT_STATES.find((one) => one.name.endsWith('com padrão próprio'))
  assert.ok(state)
  const page = await harness.open(state.path, { viewport: DESKTOP, replies: state.replies })
  await state.settle(page)
  const button = page.getByRole('combobox', { name: 'Modelo e raciocínio' })
  await button.focus()
  await page.keyboard.press('Enter')
  await page.getByRole('combobox', { name: 'Buscar modelo' }).waitFor()
  await page.getByRole('option').first().waitFor()
  await page.keyboard.press('Tab')
  const level = page.getByRole('slider', { name: 'Raciocínio' })
  assert.equal(await level.evaluate((one) => one === document.activeElement), true)
  assert.equal(await level.getAttribute('aria-valuetext'), 'Alto')
  await page.keyboard.press('ArrowLeft')
  assert.equal(await level.getAttribute('aria-valuetext'), 'Baixo')
  await page.keyboard.press('Escape')
  await page.getByRole('listbox').waitFor({ state: 'detached' })
  assert.equal(
    await page.evaluate(() => document.activeElement?.getAttribute('aria-label')),
    'Modelo e raciocínio',
  )
  assert.equal(await page.getByRole('button', { name: 'Salvar padrão' }).isEnabled(), true)
  await page.close()
})

test('as filas, pelo teclado: depois de Subir ou Descer o foco fica na seta ou no par, na troca automática e nas contas', async () => {
  const accountsPath = `/api/companies/${COMPANY.id}/model-accounts`
  const replies = withAccounts(OWNER, true)
  const read = replies[`GET ${accountsPath}`]
  assert.ok(read)
  const held = listModelAccounts.success.body.parse(read.json)
  const state = {
    ...held,
    fallback: ModelFallback.parse({
      enabled: true,
      chain: ['anthropic/claude-sonnet-4', 'openai/gpt-5'],
      revision: 0,
    }),
  }
  const page = await harness.open(`/companies/${COMPANY.id}/settings/model-accounts`, {
    viewport: DESKTOP,
    replies,
  })
  await page.route(`**${accountsPath}`, (route) => route.fulfill({ json: state }))
  await page.route('**/model-fallback', async (route) => {
    const body = ModelFallback.parse(route.request().postDataJSON())
    state.fallback = { ...body, revision: body.revision + 1 }
    await route.fulfill({ json: state.fallback })
  })
  await page.route('**/model-account-orders/**', async (route) => {
    const { ids } = orderModelAccounts.input.body.parse(route.request().postDataJSON())
    state.company = state.company.map((one) =>
      ids.includes(one.id) ? { ...one, position: ids.indexOf(one.id) } : one,
    )
    await route.fulfill({ json: { accounts: state.company } })
  })
  await page.reload()
  await waitFor(page, 'Claude do financeiro')

  async function focused() {
    return page.evaluate(() => document.activeElement?.getAttribute('aria-label') ?? 'body')
  }
  async function pressed(label: string, expected: string) {
    await page.getByRole('button', { name: label, exact: true }).focus()
    const written = page.waitForResponse((one) => one.request().method() === 'PUT')
    await page.keyboard.press('Enter')
    await written
    await page.waitForLoadState('networkidle')
    await atRest(page)
    assert.equal(await focused(), expected, `after ${label}`)
  }
  await pressed('Descer Claude Sonnet 4', 'Subir Claude Sonnet 4')
  await pressed('Subir Claude Sonnet 4', 'Descer Claude Sonnet 4')
  await pressed('Descer Claude do financeiro', 'Descer Claude do financeiro')
  await page.close()
})

async function walkTo(list: Locator, name: string) {
  // Base UI highlights the first option a frame before it moves focus into the popup; a key pressed
  // in that frame lands on the trigger, where Enter closes the list without choosing (issue 1194).
  await popupOf(list.page()).locator(':focus').waitFor()
  const option = list.getByRole('option', { name, exact: true })
  for (let step = 0; step < 8 && (await option.getAttribute('data-highlighted')) === null; step++)
    await list.page().keyboard.press('ArrowDown')
  assert.notEqual(
    await option.getAttribute('data-highlighted'),
    null,
    `the arrows never reach ${name}`,
  )
}

for (const place of PLACES)
  test(`${place.name}, pelo teclado: Enter abre, as setas andam, Esc fecha e devolve o foco ao gatilho, a seta reabre e Enter escolhe (critério 11)`, async () => {
    const page = await harness.open(place.path, { viewport: DESKTOP, replies: place.replies({}) })
    const trigger = await triggerOf(page, place)
    await trigger.focus()
    await page.keyboard.press('Enter')
    const list = page.getByRole('listbox', { name: place.label, exact: true })
    await walkTo(list, place.pick.option)
    await page.keyboard.press('Escape')
    await list.waitFor({ state: 'hidden' })
    await page.waitForFunction(
      (label) => document.activeElement?.getAttribute('aria-label') === label,
      place.label,
    )
    await page.keyboard.press('ArrowDown')
    await walkTo(list, place.pick.option)
    await page.keyboard.press('Enter')
    await list.waitFor({ state: 'hidden' })
    const { address } = place.pick
    if (address === undefined) await trigger.getByText(place.pick.option).waitFor()
    else await page.waitForURL(address)
    await page.close()
  })
