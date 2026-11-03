import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createHarness } from './layout-harness.ts'
import { INTEGRATIONS_STATES } from './sweep-integrations-states.ts'
import type { State } from './sweep-kit.ts'
import { PROJECT_INTEGRATIONS_STATES } from './sweep-project-integrations-states.ts'
import { PROJECT_STATES } from './sweep-project-states.ts'
import { companies } from './sweep-replies.ts'

// The pages of the frame beside Início, in a real browser: each page's column is centred in the sheet (`main`), not hugging its left edge.
const harness = createHarness(import.meta.dirname)
before(() => harness.start())
after(async () => {
  await harness.stop()
  assert.deepEqual(harness.unanswered, [], 'the page asked the Hub for something no reply covers')
})

function state(states: State[], name: string): State {
  const found = states.find((one) => one.name === name)
  assert.ok(found, `no state named "${name}"`)
  return found
}

const AUTOMATIONS: State = {
  name: 'Automações da empresa',
  path: `/companies/${'0'.repeat(32)}/automations`,
  replies: companies([{ name: 'Empresa Teste', role: 'owner' }], false),
  settle: (page) => page.getByRole('heading', { name: 'Automações' }).waitFor(),
}

const PAGES: State[] = [
  state(PROJECT_STATES, 'Todos os projetos, com um Projeto'),
  state(INTEGRATIONS_STATES, 'Integrações com duas ligações do Sankhya'),
  state(INTEGRATIONS_STATES, 'Página da ligação testada'),
  state(
    PROJECT_INTEGRATIONS_STATES,
    'Integrações do Projeto, a dona com liberadas e uma escolha pelo nome',
  ),
  AUTOMATIONS,
]

for (const width of [1366, 1490, 1600, 1862, 1920])
  for (const one of PAGES)
    test(`${one.name}: a coluna tem o centro da folha, numa tela de ${width}px`, async () => {
      const page = await harness.open(one.path, {
        viewport: { width, height: 800 },
        replies: one.replies,
      })
      await one.settle(page)
      const [sheet, column] = await Promise.all([
        page.locator('main').boundingBox(),
        page.locator('main .max-w-page').first().boundingBox(),
      ])
      assert.ok(sheet && column, 'the sheet or the column is not laid out')
      const gap = sheet.x + sheet.width / 2 - (column.x + column.width / 2)
      assert.ok(Math.abs(gap) <= 1, `the column's centre is ${gap}px off the sheet's`)
      await page.close()
    })
