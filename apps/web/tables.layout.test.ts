import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import type { Locator } from 'playwright-core'
import { createHarness, DESKTOP } from './layout-harness.ts'
import { STATES } from './sweep-states.ts'

// The settings tables share their column widths: roles, states and actions line up from `lg`,
// and below it the name column keeps the page's own width (testing T23, design V18).
const harness = createHarness(import.meta.dirname)
before(() => harness.start())
after(async () => {
  await harness.stop()
  assert.deepEqual(harness.unanswered, [], 'the page asked the Hub for something no reply covers')
})

async function widthOf(locator: Locator): Promise<number> {
  const box = await locator.boundingBox()
  assert.ok(box, 'the element is not laid out')
  return box.width
}

const TABLE_WIDTHS = { width: 800, height: 900 }

async function leftsOf(locators: Locator[]): Promise<number[]> {
  return Promise.all(
    locators.map(async (locator) => {
      const box = await locator.first().boundingBox()
      assert.ok(box, 'the cell is not laid out')
      return Math.round(box.x)
    }),
  )
}

function stateNamed(name: string) {
  const state = STATES.find((one) => one.name === name)
  assert.ok(state, `no state named ${name}`)
  return state
}

test('as tabelas de Configurações alinham as colunas de papel, estado e ações a 1366px', async () => {
  const people = stateNamed('dono')
  const page = await harness.open(people.path, { viewport: DESKTOP, replies: people.replies })
  await people.settle(page)
  const tables = ['Pessoas', 'Convites pendentes'].map((name) => page.getByRole('table', { name }))
  const rows = tables.map((table) => table.locator('tbody tr:has(td:nth-child(3))'))
  assert.equal(new Set(await leftsOf(rows.map((row) => row.locator('td:nth-child(2)')))).size, 1)
  assert.equal(new Set(await leftsOf(rows.map((row) => row.locator('td:nth-child(3)')))).size, 1)
  await page.close()

  const accounts = stateNamed('Configurações, contas de modelo em tabela do dono')
  const window = await harness.open(accounts.path, { viewport: DESKTOP, replies: accounts.replies })
  await accounts.settle(window)
  const sections = ['Suas contas', 'Contas da empresa'].map((name) =>
    window.getByRole('region', { name }).locator('tbody tr:has(td:nth-child(4))'),
  )
  assert.equal(
    new Set(await leftsOf(sections.map((row) => row.locator('td:nth-child(3)')))).size,
    1,
  )
  assert.equal(
    new Set(await leftsOf(sections.map((row) => row.locator('td:nth-child(4)')))).size,
    1,
  )
  await window.close()
})

test('a coluna do nome das tabelas de Configurações segue legível a 800px', async () => {
  const people = stateNamed('dono')
  const page = await harness.open(people.path, { viewport: TABLE_WIDTHS, replies: people.replies })
  await people.settle(page)
  const name = page.getByRole('table', { name: 'Pessoas' }).locator('tbody tr td:first-child')
  assert.ok((await widthOf(name.first())) >= 150, 'the name column of Pessoas is squeezed')
  await page.close()

  const accounts = stateNamed('Configurações, contas de modelo em tabela do dono')
  const window = await harness.open(accounts.path, {
    viewport: TABLE_WIDTHS,
    replies: accounts.replies,
  })
  await accounts.settle(window)
  const account = window
    .getByRole('region', { name: 'Contas da empresa' })
    .locator('tbody tr:has(td:nth-child(4)) td:nth-child(2)')
  const w = await widthOf(account.first())
  assert.ok(w >= 150, `the account column is squeezed: ${w}`)
  await window.close()
})
