import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createHarness, DESKTOP, PHONE, SMALL_PHONE } from './layout-harness.ts'
import { messageOf } from './src/builder/conversation/messages.ts'
import { recordedRun } from './src/builder/conversation/test-recorded.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import { ID, WITH_CONVERSATIONS } from './sweep-conversation-states.ts'
import { PROJECT_ID } from './sweep-replies.ts'
import { sessionReplies } from './sweep-session.ts'

const harness = createHarness(import.meta.dirname)
before(() => harness.start())
after(() => harness.stop())

/** The search as Mastra stored it (recorded 2026-10-24), with the query a phone would cut. */
const searched = recordedRun('cited')
  .read.map(messageOf)
  .find((message) => message?.role === 'builder')
const replies = {
  ...WITH_CONVERSATIONS,
  ...sessionReplies(ID, { messages: searched ? [searched] : [] }),
}

// Founder, 2026-11-02: the search row on a phone broke in two lines; Mastra Studio keeps it in one.
// A row's sentence never wraps and its detail gives way, hidden under the phone breakpoint.
test('a linha de uma ferramenta tem uma linha só, em 320, 390 e 1366', async () => {
  for (const viewport of [SMALL_PHONE, PHONE, DESKTOP]) {
    const page = await harness.open(`/companies/${COMPANY.id}/projects/${PROJECT_ID}`, {
      viewport,
      replies,
    })
    if (viewport.width < 768)
      await page.getByRole('button', { name: 'Conversa', exact: true }).click()
    const line = page.locator('[data-slot=trace-line]', { hasText: 'Pesquisou na internet' })
    await line.waitFor()
    const { height, text } = await line.evaluate((el) => ({
      height: el.getBoundingClientRect().height,
      text: Number.parseFloat(getComputedStyle(el).lineHeight),
    }))
    assert.ok(height <= text + 1, `the row is ${height}px high at ${viewport.width}`)
    await page.close()
  }
})
