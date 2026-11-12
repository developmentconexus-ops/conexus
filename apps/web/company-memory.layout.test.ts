import assert from 'node:assert/strict'
import { mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, test } from 'node:test'
import { listCompanyMemory, readCompanyMemoryPage } from '@conexus/hub-api'
import type { Replies } from './layout-harness.ts'
import { createHarness, DESKTOP, ok, PHONE } from './layout-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import { MEMBER, OWNER } from './sweep-replies.ts'

const harness = createHarness(import.meta.dirname)
before(() => harness.start())
after(async () => {
  await harness.stop()
  assert.deepEqual(harness.unanswered, [], 'the page asked the Hub for something no reply covers')
})

/** Where the captures are kept: outside the repository, for the person who reviews them. */
const CAPTURES = join(tmpdir(), 'conexus-u9-capturas')
const PAGE = `/companies/${COMPANY.id}/settings/company-memory`
const MEMORY = `/api/companies/${COMPANY.id}/assistant/company-memory`
const DAY = '2026-11-11T15:00:00.000Z'
const INSTRUCTIONS = {
  pageId: '01M77190XASM4QGT4DFDJ6K1Y4',
  name: 'Instruções da empresa',
  updatedAt: DAY,
  author: 'Ana Lima',
  body: 'Valores em reais com duas casas. A semana comercial começa na segunda. Chame cliente pelo nome fantasia.',
  version: 2,
  notes: [],
}
const OPERATION = {
  pageId: '01M771918E4B2GA6D4KYHGY5TW',
  name: 'CODTIPOPER 1100, a venda de balcão da loja da matriz e das filiais do interior',
  updatedAt: DAY,
  author: null,
  body: 'O campo CODTIPOPER 1100 é a venda de balcão.',
  version: 1,
  notes: [
    {
      id: '01M77191AKD9SG2VNWW30X2HE9',
      body: 'Vale desde janeiro de 2026.',
      updatedAt: DAY,
      author: null,
    },
  ],
}

function repliesOf(role: 'owner' | 'member', pages: boolean): Replies {
  const { notes: _, body: __, version: ___, ...entry } = OPERATION
  return {
    ...(role === 'owner' ? OWNER : MEMBER),
    [`GET ${MEMORY}`]: ok(listCompanyMemory, {
      instructions: pages ? INSTRUCTIONS : { ...INSTRUCTIONS, body: '', author: null, version: 1 },
      pages: pages ? [entry] : [],
      mayManage: role === 'owner',
    }),
    [`GET ${MEMORY}/pages/${OPERATION.pageId}`]: ok(readCompanyMemoryPage, { page: OPERATION }),
  }
}

// Configurações › Memória da empresa (card of the alignment, U9), at 1366 and 390 px in both themes:
// the instructions take the column, a long page name wraps beside Ver, and nothing scrolls sideways.
// The test saves what it saw in CAPTURES, outside the repository (testing T23).
for (const viewport of [DESKTOP, PHONE])
  for (const scheme of ['light', 'dark'] as const)
    for (const [state, role, pages] of [
      ['com páginas', 'owner', true],
      ['vazio', 'owner', false],
      ['sem permissão', 'member', true],
    ] as const)
      test(`a memória da empresa ${state}: ${viewport.width} px, tema ${scheme}`, async () => {
        const page = await harness.open(PAGE, { viewport, replies: repliesOf(role, pages), scheme })
        const section = page.locator('body')
        const box = section.getByRole('textbox', { name: INSTRUCTIONS.name })
        await box.waitFor()
        if (pages) {
          await section.getByRole('button', { name: `Ver ${OPERATION.name}` }).click()
          await section.getByText(OPERATION.body).waitFor()
          const shown = section.getByRole('button', { name: `Fechar ${OPERATION.name}` })
          const button = await shown.boundingBox()
          assert.ok(button && button.x + button.width <= viewport.width, 'Fechar fits')
        } else {
          await section.getByText('Nenhuma página guardada ainda.').waitFor()
        }
        const edits = section.getByRole('button', { name: /^(Editar|Apagar|Corrigir|Salvar)/ })
        assert.equal(
          (await edits.count()) > 0,
          role === 'owner',
          'only who may change sees buttons',
        )
        const measured = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
        }))
        assert.equal(measured.scrollWidth, viewport.width, 'the page does not scroll sideways')
        const boxed = await box.boundingBox()
        assert.ok(boxed && boxed.x >= 0 && boxed.x + boxed.width <= viewport.width)
        assert.deepEqual(page.problems, [], 'no script error or CSP refusal')
        mkdirSync(CAPTURES, { recursive: true })
        const name = `memoria-empresa-${state.replace(' ', '-')}-${viewport.width}-${scheme}.png`
        await page.screenshot({ path: join(CAPTURES, name), fullPage: true })
        await page.close()
      })
