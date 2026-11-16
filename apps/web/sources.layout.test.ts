import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { DataResult, listConnections } from '@conexus/hub-api'
import { createHarness, DESKTOP, ok, PHONE } from './layout-harness.ts'
import { messageOf } from './src/builder/conversation/messages.ts'
import { recordedRun } from './src/builder/conversation/test-recorded.ts'
import { MERCADO_LIVRE, SANKHYA } from './src/hub/connectors/fixtures.ts'
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

const ASKED = recordedRun('data-query')
  .read.map(messageOf)
  .findLast((message) => message?.role === 'builder')

/** The recorded answer with its origin made the worst the line has to hold: long names, a refused connection, a date. */
function askedWith(origin: Record<string, unknown>) {
  const message = structuredClone(ASKED)
  for (const part of message?.parts ?? []) {
    const result = part.type === 'tool-invocation' ? part.toolInvocation.result : undefined
    if (!DataResult.safeParse(result).success) continue
    const held = DataResult.parse(result)
    if (held.kind === 'ROWS') held.origin = held.origin.map((each) => ({ ...each, ...origin }))
    if (part.type === 'tool-invocation') part.toolInvocation.result = held
  }
  return message
}

const WORST = {
  connector: 'mercado-livre',
  table: 'mercado_livre_pedidos_da_loja_oficial',
  systems: [{ kind: 'NAMED', name: 'Loja oficial do Mercado Livre', state: 'NEEDS_REAUTH' }],
  lastRun: 'PARTIAL',
  lastRunEndedAt: '2026-11-14T11:45:00.000Z',
}

const CASES = [
  ['a cópia em dia', {}],
  ['a pior linha: nomes longos, o selo e a rodada parcial', WORST],
] as const

for (const [name, origin] of CASES) {
  test(`a fonte do dado: ${name}`, async () => {
    const message = askedWith(origin)
    const replies = {
      ...WITH_CONVERSATIONS,
      ...sessionReplies(FIRST, { messages: message ? [message] : [] }),
      [`GET /api/companies/${COMPANY.id}/connections`]: ok(listConnections, {
        connectors: [SANKHYA, MERCADO_LIVRE],
        connections: [],
        mayManage: true,
      }),
    }
    for (const viewport of [DESKTOP, PHONE]) {
      for (const scheme of ['light', 'dark'] as const) {
        const path = `/companies/${COMPANY.id}/projects/${PROJECT_ID}/conversations/${FIRST}`
        const page = await harness.open(path, { viewport, replies, scheme })
        if (viewport === PHONE)
          await page.getByRole('button', { name: 'Conversa', exact: true }).click()
        const sources = page.getByRole('region', { name: 'Fontes' })
        await sources.waitFor()
        const line = sources.getByRole('listitem').first()
        await line.locator('img').waitFor()
        const boxes = await line.evaluate((row) => {
          const spans = Array.from(row.querySelectorAll(':scope > span'))
          const shown = spans.filter((one) => (one.textContent ?? '') !== '')
          function at(one: Element | undefined) {
            return one?.getBoundingClientRect()
          }
          const stamp = shown.at(-1)
          const table = shown.at(-2)
          return {
            name: at(shown[0]),
            table: at(table),
            stamp: at(stamp),
            right: Math.max(...shown.map((one) => at(one)?.right ?? 0)),
          }
        })
        const label = `${viewport.width}px, ${scheme}`
        assert.ok(boxes.name && boxes.table && boxes.stamp, `${label}: the line lacks a part`)
        assert.ok(boxes.right <= viewport.width, `${label}: the line passes the screen`)
        if (viewport === PHONE) {
          assert.ok(
            boxes.table.top >= boxes.name.bottom,
            `${label}: the table stays on the name's line`,
          )
          assert.ok(
            boxes.stamp.top >= boxes.name.bottom,
            `${label}: the stamp stays on the name's line`,
          )
        }
        const past = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        )
        assert.ok(past <= 0, `${label}: ${past}px past the screen`)
        assert.deepEqual(page.problems, [])
        await page.close()
      }
    }
  })
}
