import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createHarness, DESKTOP, PHONE } from './layout-harness.ts'
import { messageOf } from './src/builder/conversation/messages.ts'
import { recordedRun } from './src/builder/conversation/test-recorded.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import { WITH_CONVERSATIONS } from './sweep-conversation-states.ts'
import { PROJECT_ID } from './sweep-replies.ts'
import { sessionReplies } from './sweep-session.ts'

const harness = createHarness(import.meta.dirname)
before(() => harness.start())
after(() => harness.stop())

const FIRST = '11111111-1111-4111-8111-111111111111'

// The answer after Anthropic's web search, as Mastra stored it, carries the `source` parts: its
// "Fontes" line stays inside the screen, and each link opens in a new tab without the opener.
const CITED = recordedRun('cited')
  .read.map(messageOf)
  .find((message) => message?.role === 'builder')

test('as fontes', async () => {
  const replies = {
    ...WITH_CONVERSATIONS,
    ...sessionReplies(FIRST, { messages: CITED ? [CITED] : [] }),
  }
  for (const viewport of [DESKTOP, PHONE]) {
    for (const scheme of ['light', 'dark'] as const) {
      const path = `/companies/${COMPANY.id}/projects/${PROJECT_ID}/conversations/${FIRST}`
      const page = await harness.open(path, { viewport, replies, scheme })
      if (viewport === PHONE)
        await page.getByRole('button', { name: 'Conversa', exact: true }).click()
      const sources = page.getByRole('region', { name: 'Fontes' })
      await sources.waitFor()
      const links = await sources
        .getByRole('link')
        .evaluateAll((all) =>
          all.map((link) => [link.getAttribute('target'), link.getAttribute('rel')]),
        )
      assert.ok(links.length > 0)
      assert.deepEqual(
        links.filter(([target, rel]) => target !== '_blank' || rel !== 'noopener noreferrer'),
        [],
      )
      const past = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      assert.ok(past <= 0, `${viewport.width}px, ${scheme}: ${past}px past the screen`)
      assert.deepEqual(page.problems, [])
      await page.close()
    }
  }
})
