import assert from 'node:assert/strict'
import { mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, test } from 'node:test'
import type { Replies } from './layout-harness.ts'
import { createHarness, DESKTOP, PHONE } from './layout-harness.ts'
import { recordedSubagent } from './src/builder/conversation/test-recorded.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import { MESSAGES, WITH_CONVERSATIONS } from './sweep-conversation-states.ts'
import { PROJECT_ID } from './sweep-replies.ts'
import type { Said } from './sweep-session.ts'
import { sessionReplies } from './sweep-session.ts'

const harness = createHarness(import.meta.dirname)
before(() => harness.start())
after(async () => {
  await harness.stop()
  assert.deepEqual(harness.unanswered, [], 'the page asked the Hub for something no reply covers')
})

const PROJECT = `/companies/${COMPANY.id}/projects/${PROJECT_ID}`
const FIRST = '11111111-1111-4111-8111-111111111111'
/** Where the captures are kept: outside the repository, for the person who reviews them. */
const CAPTURES = join(tmpdir(), 'conexus-u12-capturas')

// The helper that reads (card of the alignment, U12): its line is one cut line, never a sideways
// scroll, at 1366 and 390 px in both themes; open, the findings read as a message. The test
// saves what it saw in CAPTURES, outside the repository (testing T23).
const ASKED =
  'Quantos pedidos a Matriz e a Filial tiveram em outubro de 2026, por vendedor, comparados com setembro, separando os cancelados e os devolvidos e dizendo de onde veio cada número'

const RESEARCH_MESSAGES: Said[] = [
  MESSAGES[0] ?? { id: 'p', role: 'person', parts: [], createdAt: '2026-10-19T12:00:00.000Z' },
  {
    id: 'r1',
    role: 'builder',
    parts: [
      recordedSubagent('research', 'pending', ASKED, 'call'),
      recordedSubagent('research', 'found', ASKED),
      recordedSubagent('research-failed', 'lost', ASKED),
    ],
    createdAt: '2026-10-19T12:01:00.000Z',
  },
]

for (const viewport of [DESKTOP, PHONE])
  for (const scheme of ['light', 'dark'] as const)
    test(`a linha do ajudante: ${viewport.width} px, tema ${scheme}`, async () => {
      const replies: Replies = {
        ...WITH_CONVERSATIONS,
        ...sessionReplies(FIRST, { messages: RESEARCH_MESSAGES }),
      }
      const page = await harness.open(`${PROJECT}/conversations/${FIRST}`, {
        viewport,
        replies,
        scheme,
      })
      if (viewport === PHONE)
        await page.getByRole('button', { name: 'Conversa', exact: true }).click()
      const lines = page.locator('[data-slot=trace-line]')
      const running = lines.filter({ hasText: 'Pesquisando' })
      const done = lines.filter({ hasText: 'Pesquisou' })
      const failed = lines.filter({ hasText: 'A pesquisa falhou' })
      await done.waitFor()
      for (const line of [running, done, failed]) {
        const { height, text } = await line.evaluate((el) => ({
          height: el.getBoundingClientRect().height,
          text: Number.parseFloat(getComputedStyle(el).lineHeight),
        }))
        assert.ok(height <= text + 1, `the row is ${height}px high at ${viewport.width}`)
      }
      await done.click()
      await page.getByText('Matriz teve').waitFor()
      await failed.waitFor()
      const sideways = await page.evaluate(
        () => (document.scrollingElement?.scrollWidth ?? 0) - window.innerWidth,
      )
      assert.ok(sideways <= 0, `the page scrolls ${sideways}px sideways`)
      await page.waitForTimeout(400)
      mkdirSync(CAPTURES, { recursive: true })
      await page.screenshot({ path: join(CAPTURES, `ajudante-${viewport.width}-${scheme}.png`) })
      assert.deepEqual(page.problems, [])
      await page.close()
    })
