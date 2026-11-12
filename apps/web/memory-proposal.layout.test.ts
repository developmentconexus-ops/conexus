import assert from 'node:assert/strict'
import { mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, test } from 'node:test'
import { ASSISTANT_TOOL, listCompanyMemory } from '@conexus/hub-api'
import { createHarness, DESKTOP, ok, PHONE } from './layout-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import { ASSISTANT_PATH, CARD_SPEAKS, cardReplies } from './sweep-assistant-states.ts'
import type { Said } from './sweep-session.ts'

const harness = createHarness(import.meta.dirname)
before(() => harness.start())
after(async () => {
  await harness.stop()
  assert.deepEqual(harness.unanswered, [], 'the page asked the Hub for something no reply covers')
})

/** Where the captures are kept: outside the repository, for the person who reviews them. */
const CAPTURES = join(tmpdir(), 'conexus-u9-capturas')
const NAME = 'Valores e prazos da padaria, para todas as filiais do interior e da capital'
const TEXT =
  'Valores em reais com duas casas. A semana comercial começa na segunda. Pedidos feitos até as 14h saem no mesmo dia; os outros, no dia útil seguinte.'

const PROPOSED: Said = {
  id: 'm-memory',
  role: 'builder',
  parts: [
    {
      type: 'tool-invocation',
      toolInvocation: {
        state: 'result',
        toolCallId: 'c-memory',
        toolName: ASSISTANT_TOOL.proposeCompanyMemory,
        args: {},
        result: { kind: 'PAGE', name: NAME, body: TEXT },
      },
    },
  ],
  model: 'anthropic/claude-sonnet-4',
  createdAt: '2026-10-19T12:01:00.000Z',
}

function repliesOf(mayManage: boolean) {
  return {
    ...cardReplies(null, [...CARD_SPEAKS, PROPOSED]),
    [`GET /api/companies/${COMPANY.id}/assistant/company-memory`]: ok(listCompanyMemory, {
      instructions: {
        ...{ name: 'Instruções da empresa', body: '' },
        ...{ updatedAt: '2026-11-11T15:00:00.000Z', author: null },
      },
      pages: [],
      mayManage,
    }),
  }
}

// The card of what the Assistant proposed to save in the company's memory (U9), at 1366 and 390 px in
// both themes: a long name wraps, the card stays in the column, and only who may save sees Salvar.
// The test saves what it saw in CAPTURES, outside the repository (testing T23).
for (const viewport of [DESKTOP, PHONE])
  for (const scheme of ['light', 'dark'] as const)
    for (const [state, may] of [
      ['com permissão', true],
      ['sem permissão', false],
    ] as const)
      test(`o cartão da proposta para a memória da empresa ${state}: ${viewport.width} px, tema ${scheme}`, async () => {
        const page = await harness.open(ASSISTANT_PATH, {
          viewport,
          replies: repliesOf(may),
          scheme,
        })
        const body = page.locator('body')
        await body.getByText(TEXT).waitFor()
        if (may) await body.getByRole('button', { name: 'Salvar' }).waitFor()
        else
          await body.getByText('Só o dono ou um administrador muda a memória da empresa.').waitFor()
        assert.equal(await body.getByRole('button', { name: 'Salvar' }).count(), may ? 1 : 0)
        const measured = await page.evaluate(() => {
          const scroller = document.querySelector('[data-slot=message-scroller-viewport]')
          return {
            page: document.documentElement.scrollWidth,
            scroll: scroller?.scrollWidth ?? 0,
            client: scroller?.clientWidth ?? 0,
          }
        })
        assert.equal(measured.page, viewport.width, 'the page does not scroll sideways')
        assert.ok(measured.scroll <= measured.client, 'the conversation does not scroll sideways')
        assert.deepEqual(page.problems, [], 'no script error or CSP refusal')
        await body.getByText(NAME).scrollIntoViewIfNeeded()
        mkdirSync(CAPTURES, { recursive: true })
        const name = `proposta-${state.replace(' ', '-')}-${viewport.width}-${scheme}.png`
        await page.screenshot({ path: join(CAPTURES, name) })
        await page.close()
      })
