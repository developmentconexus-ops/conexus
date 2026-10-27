import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { listModelAccounts } from '@conexus/hub-api'
import type { Locator } from 'playwright-core'
import type { Replies, Viewport } from './layout-harness.ts'
import { createHarness, DESKTOP, ok, PHONE } from './layout-harness.ts'
import { companies } from './sweep-replies.ts'

// Início in a real browser: one company Ana owns, its Início in the company's frame.
const HOUSE = companies([{ name: 'Empresa Teste', role: 'owner' }], false)
const COMPANY_ID = '0'.repeat(32)

const harness = createHarness(import.meta.dirname)
before(() => harness.start())
after(async () => {
  await harness.stop()
  assert.deepEqual(harness.unanswered, [], 'the page asked the Hub for something no reply covers')
})

function open(path: string, viewport: Viewport, replies: Replies) {
  return harness.open(path, { viewport, replies })
}

/** The centre of what an element draws, its text or its children, not of its own block's box. */
async function centreOf(locator: Locator): Promise<number> {
  const [left, right] = await locator.evaluate((element) => {
    const drawn = document.createRange()
    drawn.selectNodeContents(element)
    const rects = [...drawn.getClientRects()].filter((rect) => rect.width > 0)
    return [
      Math.min(...rects.map((rect) => rect.left)),
      Math.max(...rects.map((rect) => rect.right)),
    ]
  })
  assert.ok(Number.isFinite(left) && Number.isFinite(right), 'the element draws nothing')
  return (left + right) / 2
}

const SONNET = 'anthropic/claude-sonnet-4'
// Início opens its box only for a person with a model to start on.
const WITH_MODEL: Replies = {
  ...HOUSE,
  [`GET /api/companies/${COMPANY_ID}/model-accounts`]: ok(listModelAccounts, {
    company: [],
    mine: [],
    order: [],
    kinds: [],
    defaults: {
      company: null,
      mine: null,
      start: { model: SONNET, effort: 'off', from: 'company', account: 'Claude da empresa' },
      companyStart: null,
    },
    choices: {
      mine: [{ id: 'anthropic', name: 'Anthropic', models: [{ id: SONNET, efforts: ['off'] }] }],
      company: [],
    },
    fallback: { enabled: false, chain: [], revision: 0 },
    usableProviders: ['anthropic'],
    mayManage: false,
  }),
}

for (const viewport of [DESKTOP, PHONE]) {
  test(`o Início é centrado: título, caixa e exemplos no centro da coluna, numa tela de ${viewport.width}px`, async () => {
    const page = await open(`/companies/${COMPANY_ID}`, viewport, WITH_MODEL)
    const title = page.getByRole('heading', { name: 'O que vamos construir?' })
    const box = page
      .getByRole('textbox', { name: 'Mensagem para o Builder' })
      .locator('xpath=ancestor::form')
    const examples = page.getByRole('list', { name: 'Exemplos' })
    await examples.waitFor()
    // The page's column, `max-w-page` at the start of `main`, is the title's section.
    const section = await title.locator('xpath=ancestor::section[1]').boundingBox()
    assert.ok(section, 'the section is not laid out')
    const column = section.x + section.width / 2
    for (const [name, one] of [
      ['título', title],
      ['caixa', box],
      ['exemplos', examples],
    ] as const) {
      assert.ok(Math.abs((await centreOf(one)) - column) <= 1, `${name} is off the column's centre`)
    }
    assert.ok(((await box.boundingBox())?.width ?? Infinity) <= 736, 'the box is wider than 46rem')
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), viewport.width)
    await page.close()
  })
}
