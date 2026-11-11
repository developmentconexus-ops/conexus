import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import type { Page } from 'playwright-core'
import { createHarness, DESKTOP, PHONE } from './layout-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import { ID, WITH_CONVERSATIONS } from './sweep-conversation-states.ts'
import { PROJECT_ID } from './sweep-replies.ts'
import type { Said } from './sweep-session.ts'
import { sessionReplies } from './sweep-session.ts'

const harness = createHarness(import.meta.dirname)
before(() => harness.start())
after(() => harness.stop())

function called(toolName: string, toolCallId: string, result: unknown) {
  return {
    type: 'tool-invocation' as const,
    toolInvocation: {
      state: 'result' as const,
      toolCallId,
      toolName,
      args: { sql: 'select * from pedidos' },
      result,
    },
  }
}
function checked(toolCallId: string, result: unknown) {
  return called('app_data_check', toolCallId, result)
}

const REASON = 'definition.window: a janela pede uma coluna de data de alteração'

const MESSAGES: Said[] = [
  {
    id: 'd1',
    role: 'builder',
    parts: [
      called('copy_propose', 'p1', { kind: 'MALFORMED', issues: [REASON] }),
      checked('k1', { kind: 'COUNTED', rows: { kind: 'EXACT', rows: 0 }, columns: [], ms: 3 }),
      checked('k2', { kind: 'COUNTED', rows: { kind: 'OVER' }, columns: [], ms: 3 }),
      checked('k3', { kind: 'REFUSED', code: 'APP_DATA_REFUSED', sqlstate: '42601' }),
      { type: 'text', text: 'Conferi as leituras.' },
    ],
    model: 'anthropic/claude-sonnet-4',
    createdAt: '2026-11-10T12:01:00.000Z',
  },
]
const replies = { ...WITH_CONVERSATIONS, ...sessionReplies(ID, { messages: MESSAGES }) }

async function openChat(page: Page, width: number) {
  if (width < 768) await page.getByRole('button', { name: 'Conversa', exact: true }).click()
  await page.getByText('Conferi as leituras.').waitFor()
}

// QA of Capacidade 3: in the chat panel (about 350 px at 1366) a refused proposal's reason broke
// word by word, 220 px tall, and a check's count took two or three lines. A tool row is one line:
// the sentence whole (step 12.1), the detail cut beside it (founder, 2026-11-02); the open row says
// the count and the reason whole, in words.
for (const viewport of [DESKTOP, PHONE]) {
  test(`as linhas de conferir e de propor ficam numa linha, com a frase inteira, em ${viewport.width}px`, async () => {
    const page = await harness.open(`/companies/${COMPANY.id}/projects/${PROJECT_ID}`, {
      viewport,
      replies,
    })
    await openChat(page, viewport.width)
    const title = page.locator('[data-slot=trace-title]', { hasText: '3 ferramentas' }).first()
    await title.waitFor()
    await page.getByRole('button', { name: /3 ferramentas/ }).click()
    await page.locator('[data-slot=trace-description]', { hasText: 'mais de 10' }).waitFor()
    const cut = await page
      .locator('[data-slot=trace-title]')
      .evaluateAll((titles) => titles.filter((el) => el.scrollWidth > el.clientWidth).length)
    assert.equal(cut, 0, 'a sentence is cut')
    const heights = await page
      .locator('[data-slot=trace-line]')
      .evaluateAll((lines) => lines.map((line) => line.getBoundingClientRect().height))
    const one = Math.min(...heights)
    assert.ok(
      heights.every((height) => height === one),
      `every line is one line high: ${heights.join(', ')}`,
    )
    await page.getByRole('button', { name: /mais de 10\.000 linhas/ }).click()
    // The open row says it in words, apart from the cut line's span.
    function said(text: string) {
      return page.getByText(text, { exact: true }).and(page.locator('div'))
    }
    await said('mais de 10.000 linhas').waitFor()
    await page
      .getByRole('button', { name: /Não conseguiu propor a cópia/ })
      .first()
      .click()
    await said(REASON).waitFor()
    assert.equal(
      await said(REASON).evaluate((el) => el.scrollWidth > el.clientWidth),
      false,
      'the open row cuts the reason',
    )
    await page.close()
  })
}
