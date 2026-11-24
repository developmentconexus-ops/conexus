import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { listConnections } from '@conexus/hub-api'
import { z } from 'zod'
import { createHarness, DESKTOP, LAPTOP, ok, PHONE } from './layout-harness.ts'
import { messageOf } from './src/builder/conversation/messages.ts'
import { recordedRun } from './src/builder/conversation/test-recorded.ts'
import { MERCADO_LIVRE, SANKHYA } from './src/hub/connectors/fixtures.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import { ASSISTANT_PATH, cardReplies } from './sweep-assistant-states.ts'
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

const ASKED = recordedRun('reads')
  .read.map(messageOf)
  .findLast((message) => message?.role === 'builder')

const READ_AT = '2026-11-14T11:45:00.000Z'

type Read = { connection?: string; operation?: string }

const Stored = z.looseObject({})

/** The recorded live read, its call changed by `read`, and one more call for each of `extra`. */
function askedWith(read: Read, extra: Read[] = []) {
  const message = structuredClone(ASKED)
  if (message === undefined) return undefined
  const parts = message.parts.flatMap((part) => {
    if (part.type !== 'tool-invocation' || part.toolInvocation.state !== 'result') return [part]
    const call = part.toolInvocation
    return [read, ...extra].map((change, at) => ({
      ...part,
      toolInvocation: {
        ...call,
        toolCallId: `${call.toolCallId}-${at}`,
        args: { ...call.args, ...change },
        result: { ...Stored.parse(call.result), at: READ_AT },
      },
    }))
  })
  return { ...message, parts }
}

const WORST = {
  connection: 'Loja oficial do Mercado Livre',
  operation: 'mercado-livre.mercado_livre_pedidos_da_loja_oficial',
}

const CASES = [
  ['a leitura ao vivo', {}],
  ['a pior linha: nomes longos', WORST],
] as const

for (const [name, read] of CASES) {
  test(`a fonte do dado: ${name}`, async () => {
    const message = askedWith(read)
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

test('a fonte do dado a 1280px: a logo, o nome, a pastilha e o carimbo numa linha só, o carimbo na ponta direita; duas fontes, duas linhas de 32px com a linha fina entre elas', async () => {
  const message = askedWith({}, [{ operation: 'sankhya.estoque' }])
  const replies = {
    ...cardReplies(null, message ? [message] : []),
    [`GET /api/companies/${COMPANY.id}/connections`]: ok(listConnections, {
      connectors: [SANKHYA],
      connections: [],
      mayManage: true,
    }),
  }
  for (const scheme of ['light', 'dark'] as const) {
    const page = await harness.open(ASSISTANT_PATH, { viewport: LAPTOP, replies, scheme })
    const sources = page.getByRole('region', { name: 'Fontes' })
    await sources.waitFor()
    const lines = await sources.getByRole('listitem').evaluateAll((rows) =>
      rows.map((row) => {
        const shown = Array.from(row.querySelectorAll(':scope > span')).filter(
          (one) => (one.textContent ?? '') !== '',
        )
        const stamp = shown.at(-1)?.getBoundingClientRect()
        const table = shown.at(-2)?.getBoundingClientRect()
        const name = shown[0]?.getBoundingClientRect()
        return {
          height: row.getBoundingClientRect().height,
          border: getComputedStyle(row).borderTopWidth,
          sameLine:
            (table?.top ?? 0) < (name?.bottom ?? 0) && (stamp?.top ?? 0) < (name?.bottom ?? 0),
          stampAtEnd: Math.abs((stamp?.right ?? 0) - row.getBoundingClientRect().right) < 1,
        }
      }),
    )
    assert.equal(lines.length, 2, `${scheme}: two sources, two lines`)
    for (const line of lines) {
      assert.ok(line.height >= 32, `${scheme}: a line of ${line.height}px`)
      assert.ok(line.sameLine, `${scheme}: the table or the stamp fell below the name`)
      assert.ok(line.stampAtEnd, `${scheme}: the stamp is not at the right end`)
    }
    assert.equal(lines[0]?.border, '0px', `${scheme}: a hairline above the first source`)
    assert.equal(lines[1]?.border, '1px', `${scheme}: no hairline between the two sources`)
    assert.deepEqual(page.problems, [])
    await page.close()
  }
})
