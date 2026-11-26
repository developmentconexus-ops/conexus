import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { setDefaultModel } from '@conexus/hub-api'
import type { Page } from 'playwright-core'
import type { Reply } from './layout-harness.ts'
import { createHarness, DESKTOP, failure, ok } from './layout-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import { DEFAULT_STATES } from './sweep-defaults-states.ts'

// The notice in a real browser, under the Hub's policy: it says what the Hub confirmed, leaves by
// itself and never takes the focus (design V26).
const harness = createHarness(import.meta.dirname)
before(() => harness.start())
after(async () => {
  await harness.stop()
  assert.deepEqual(harness.unanswered, [], 'the page asked the Hub for something no reply covers')
})

const SAVE = `PUT /api/companies/${COMPANY.id}/default-model`

/** Padrões da empresa as its owner, with another model chosen, so "Salvar padrão" can send. */
async function choosing(answer: Reply) {
  const state = DEFAULT_STATES.find((one) => one.name.endsWith('padrões da empresa do dono'))
  assert.ok(state, 'the sweep lacks the owner at Padrões da empresa')
  const page = await harness.open(state.path, {
    viewport: DESKTOP,
    replies: { ...state.replies, [SAVE]: answer },
  })
  await state.settle(page)
  await page.getByRole('combobox', { name: 'Modelo e raciocínio' }).click()
  await page.getByRole('option', { name: 'Claude Sonnet 4' }).click()
  await page.keyboard.press('Escape')
  await page.getByRole('listbox').waitFor({ state: 'detached' })
  return page
}

/** The notices' live region, which is what announces one (Base UI's viewport). */
function notices(page: Page) {
  return page.getByRole('region', { name: 'Avisos' })
}

function said(page: Page) {
  return notices(page).getByText('Padrão salvo')
}

test('salvar o padrão avisa', async () => {
  const { promise: hold, resolve: release } = Promise.withResolvers<void>()
  const page = await choosing({
    ...ok(setDefaultModel, {
      defaultModel: { model: 'anthropic/claude-sonnet-4', effort: 'off' },
    }),
    hold,
  })
  await page.getByRole('button', { name: 'Salvar padrão' }).click()
  await page.getByRole('button', { name: 'Salvando…' }).waitFor()
  assert.equal(await said(page).count(), 0, 'the notice came before the Hub answered')
  release()
  await said(page).waitFor()
  assert.equal(await notices(page).getAttribute('aria-live'), 'polite')
  assert.equal(
    await notices(page).getByRole('status').count(),
    0,
    'a live region inside the live region: a screen reader may say the notice twice',
  )
  assert.deepEqual(page.problems, [])
  await page.close()
})

test('o erro fica no campo', async () => {
  const page = await choosing(failure('MODEL_NO_ACCOUNT'))
  await page.getByRole('button', { name: 'Salvar padrão' }).click()
  await page.getByRole('alert').waitFor()
  assert.equal(await page.locator('[data-slot=notice]').count(), 0, 'a refusal showed a notice')
  // The browser logs the refusal itself.
  assert.deepEqual(
    page.problems.filter((one) => !one.includes('status of 422')),
    [],
  )
  await page.close()
})

test('a pilha mostra até três avisos', async () => {
  const page = await harness.open('/pieces', { viewport: DESKTOP, replies: {} })
  const save = page
    .locator('[data-file="notice.tsx"] [data-band=light]')
    .getByRole('button', { name: 'Salvar padrão' })
  for (let asked = 1; asked <= 4; asked++) {
    await save.click()
    await page
      .locator('[data-slot=notice]')
      .nth(asked - 1)
      .waitFor({ state: 'attached' })
  }
  assert.equal(await page.locator('[data-slot=notice]:visible').count(), 3)
  assert.deepEqual(page.problems, [])
  await page.close()
})

test('o aviso some e não rouba o foco', async () => {
  const page = await harness.open('/pieces', { viewport: DESKTOP, replies: {} })
  const save = page
    .locator('[data-file="notice.tsx"] [data-band=light]')
    .getByRole('button', { name: 'Salvar padrão' })
  const notice = page.locator('[data-slot=notice]')
  function focused() {
    return save.evaluate((button) => button === document.activeElement)
  }

  await save.click()
  await said(page).waitFor()
  const shown = Date.now()
  assert.equal(await focused(), true, 'the notice took the focus as it came')
  await notice.waitFor({ state: 'detached', timeout: 8000 })
  const stayed = Date.now() - shown
  assert.ok(stayed > 4000 && stayed < 7000, `the notice stayed ${stayed}ms, not 5s`)
  assert.equal(await focused(), true, 'the focus moved as the notice left')

  await save.click()
  await notice.hover()
  await page.getByRole('button', { name: 'Fechar aviso' }).click()
  await notice.waitFor({ state: 'detached', timeout: 2000 })

  await save.click()
  await said(page).waitFor()
  // F6 goes to the notices and Tab to the first of them, where Esc closes it.
  await page.keyboard.press('F6')
  await page.keyboard.press('Tab')
  await page.waitForFunction(() => document.activeElement?.matches('[data-slot=notice]'))
  await page.keyboard.press('Tab')
  const ring = await page.getByRole('button', { name: 'Fechar aviso' }).evaluate((close) => {
    const ground = close.closest('[data-slot=notice]')
    return [
      close === document.activeElement,
      getComputedStyle(close).outlineColor,
      ground && getComputedStyle(ground).color,
    ]
  })
  assert.equal(ring[0], true, 'Tab did not reach the close button')
  assert.equal(ring[1], ring[2], 'the close button draws its focus ring in a colour of the page')
  await page.keyboard.press('Escape')
  await notice.waitFor({ state: 'detached', timeout: 2000 })
  assert.equal(await focused(), true, 'Esc did not give the focus back')
  assert.deepEqual(page.problems, [])
  await page.close()
})
