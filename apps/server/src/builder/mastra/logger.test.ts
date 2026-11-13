import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Sent } from '../../platform/test-anthropic.ts'
import { asked, conversing, title } from '../conversation/test-conversation.ts'

test('o erro do Mastra num turno vai ao rastro com o texto, e o log do contêiner fica com escalares e os ids do rastro', async (t) => {
  const on = await conversing(t, (each: Sent) => title(each) ?? { kind: 'refuse', status: 400 })
  const { hub, ana, conversations } = on
  const { url } = await asked(t, { hub, person: ana, conversations })
  await hub.close()

  const id = url.slice(url.lastIndexOf('/') + 1)
  const [turn] = (
    await hub.test.mastraPool.query<{ traceId: string }>(
      `SELECT DISTINCT "traceId" FROM mastra.mastra_span_events WHERE "threadId" = $1`,
      [id],
    )
  ).rows
  assert.ok(turn !== undefined, 'the turn has its trace')

  const stored = await hub.test.mastraPool.query<{ level: string; message: string }>(
    `SELECT "level", "message" FROM mastra.mastra_log_events WHERE "traceId" = $1`,
    [turn.traceId],
  )
  assert.ok(stored.rows.length > 0, "Mastra's log of the turn is in Mastra's database")

  const container = hub.lines.filter(
    (line) => line.message === 'MASTRA_ERROR' || line.message === 'MASTRA_WARNING',
  )
  assert.ok(
    container.some((line) => line.fields.trace_id === turn.traceId),
    "the container line carries the turn's trace id",
  )
  for (const line of container) {
    for (const value of Object.values(line.fields)) {
      assert.ok(['string', 'number', 'boolean'].includes(typeof value))
    }
  }
  assert.doesNotMatch(JSON.stringify(container), /SECRET-PLANTED-TEXT/)
})
