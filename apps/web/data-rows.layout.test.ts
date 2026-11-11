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

function checked(toolCallId: string, result: unknown) {
  return {
    type: 'tool-invocation' as const,
    toolInvocation: {
      state: 'result' as const,
      toolCallId,
      toolName: 'app_data_check',
      args: { sql: 'select * from pedidos' },
      result,
    },
  }
}

const MESSAGES: Said[] = [
  {
    id: 'd1',
    role: 'builder',
    parts: [
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

// QA of Capacidade 3: in the chat panel (about 350 px at 1366) the group's title and the count of a
// check were cut. The title is sized by the panel, and the count is read whole.
for (const viewport of [DESKTOP, PHONE]) {
  test(`o grupo de conferências e a contagem se leem inteiros em ${viewport.width}px`, async () => {
    const page = await harness.open(`/companies/${COMPANY.id}/projects/${PROJECT_ID}`, {
      viewport,
      replies,
    })
    await openChat(page, viewport.width)
    const title = page.locator('[data-slot=trace-title]', { hasText: '3 ferramentas' }).first()
    await title.waitFor()
    assert.equal(await title.isVisible(), true)
    const clipped = await title.evaluate((el) => el.scrollWidth > el.clientWidth)
    assert.equal(clipped, false, 'the group title is cut')
    await page.getByRole('button', { name: /3 ferramentas/ }).click()
    for (const text of ['Nenhuma linha.', 'mais de 10.000 linhas']) {
      const count = page.locator('[data-slot=trace-description]', { hasText: text })
      await count.waitFor()
      assert.equal(await count.evaluate((el) => el.scrollWidth > el.clientWidth), false, text)
    }
    await page.close()
  })
}
