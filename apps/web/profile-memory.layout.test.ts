import assert from 'node:assert/strict'
import { mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, test } from 'node:test'
import { getProfileMemory } from '@conexus/hub-api'
import type { Replies } from './layout-harness.ts'
import { createHarness, DESKTOP, ok, PHONE } from './layout-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import { MEMBER } from './sweep-replies.ts'

const harness = createHarness(import.meta.dirname)
before(() => harness.start())
after(async () => {
  await harness.stop()
  assert.deepEqual(harness.unanswered, [], 'the page asked the Hub for something no reply covers')
})

/** Where the captures are kept: outside the repository, for the person who reviews them. */
const CAPTURES = join(tmpdir(), 'conexus-u7-capturas')
const PAGE = `/companies/${COMPANY.id}/settings/account`
const TITLE = 'O que o Assistente lembra de você'
const KEPT = [
  '# About the person',
  'Diretora comercial; acompanha a linha de bebidas (2026-11-10)',
  '# Corrections they gave',
  'Valores em reais com duas casas, sem centavos arredondados (2026-11-10)',
].join('\n')

// "O que o Assistente lembra de você" in Sua conta (card of the alignment, U7), at 1366 and 390 px
// in both themes: the box takes the column, Salvar and Apagar tudo share a line, and nothing scrolls
// sideways. The test saves what it saw in CAPTURES, outside the repository (testing T23).
for (const viewport of [DESKTOP, PHONE])
  for (const scheme of ['light', 'dark'] as const)
    for (const [state, text] of [
      ['com texto', KEPT],
      ['vazio', null],
    ] as const)
      test(`a memória da pessoa ${state}: ${viewport.width} px, tema ${scheme}`, async () => {
        const replies: Replies = {
          ...MEMBER,
          [`GET /api/companies/${COMPANY.id}/assistant/profile-memory`]: ok(getProfileMemory, {
            text,
          }),
        }
        const page = await harness.open(PAGE, { viewport, replies, scheme })
        const section = page.getByRole('region', { name: TITLE })
        const box = section.getByRole('textbox', { name: TITLE })
        await box.waitFor()
        const save = section.getByRole('button', { name: 'Salvar' })
        const measured = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
        }))
        assert.equal(measured.scrollWidth, viewport.width, 'the page does not scroll sideways')
        const boxed = await box.boundingBox()
        assert.ok(boxed && boxed.x >= 0 && boxed.x + boxed.width <= viewport.width)
        if (text !== null) {
          const erase = section.getByRole('button', { name: 'Apagar tudo' })
          const [saved, erased] = await Promise.all([save.boundingBox(), erase.boundingBox()])
          assert.ok(saved && erased)
          assert.ok(
            Math.abs(saved.y + saved.height / 2 - (erased.y + erased.height / 2)) < 2,
            'Salvar and Apagar tudo share a line',
          )
          assert.ok(erased.x > saved.x, 'Apagar tudo is to the right of Salvar')
        } else {
          await section.getByText(/ainda não guardou nada sobre você/).waitFor()
        }
        assert.deepEqual(page.problems, [], 'no script error or CSP refusal')
        mkdirSync(CAPTURES, { recursive: true })
        const name = `memoria-${state.replace(' ', '-')}-${viewport.width}-${scheme}.png`
        await section.scrollIntoViewIfNeeded()
        await page.screenshot({ path: join(CAPTURES, name), fullPage: true })
        if (text !== null) {
          await section.getByRole('button', { name: 'Apagar tudo' }).click()
          const dialog = page.getByRole('alertdialog')
          await dialog.waitFor()
          await page.waitForFunction(() =>
            document.getAnimations().every((one) => one.playState !== 'running'),
          )
          const drawn = await dialog.boundingBox()
          assert.ok(
            drawn && drawn.x >= 0 && drawn.x + drawn.width <= viewport.width,
            'the box fits',
          )
          const asked = `memoria-apagar-${viewport.width}-${scheme}.png`
          await page.screenshot({ path: join(CAPTURES, asked) })
        }
        await page.close()
      })
