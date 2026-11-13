import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ErrorCategory, ErrorDomain, MastraError } from '@mastra/core/error'
import type { Sent } from '../../platform/test-anthropic.ts'
import { asked, conversing, title } from '../conversation/test-conversation.ts'
import { BuilderLogger } from './public.ts'

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

/** A logger attached to a fake observability: what its sink received and what the container saw. */
function attached() {
  const lines: { fields: Record<string, unknown>; message: string }[] = []
  const exported: { level: string; message: string; data: Record<string, unknown> | undefined }[] =
    []
  const logger = new BuilderLogger({
    info: (fields, message) => lines.push({ fields, message }),
    error: (fields, message) => lines.push({ fields, message }),
  })
  function sink(level: string) {
    return (message: string, data?: Record<string, unknown>) =>
      exported.push({ level, message, data })
  }
  logger.__attachObservability({
    options: { correlation: true, export: true },
    resolveTraceFields: () => ({ trace_id: 'a'.repeat(32), span_id: 'b'.repeat(16) }),
    getLogSink: () => ({
      debug: sink('debug'),
      info: sink('info'),
      warn: sink('warn'),
      error: sink('error'),
    }),
  })
  return { logger, lines, exported }
}

test('um aviso do Mastra vai ao rastro com o texto, e ao contêiner só com escalares e os ids do rastro', () => {
  const { logger, lines, exported } = attached()

  logger.warn('planted warning SECRET-PLANTED-TEXT', { step: 'planted' })

  assert.deepEqual(exported, [
    {
      level: 'warn',
      message: 'planted warning SECRET-PLANTED-TEXT',
      data: { step: 'planted' },
    },
  ])
  assert.deepEqual(lines, [
    {
      message: 'MASTRA_WARNING',
      fields: { source: 'mastra', trace_id: 'a'.repeat(32), span_id: 'b'.repeat(16) },
    },
  ])
})

test('uma exceção rastreada leva ao rastro o id, o domínio, a categoria e os detalhes do erro do Mastra, e ao contêiner só escalares', () => {
  const { logger, lines, exported } = attached()

  logger.trackException(
    new MastraError(
      {
        id: 'PLANTED_ERROR_ID',
        domain: ErrorDomain.AGENT,
        category: ErrorCategory.USER,
        details: { statusCode: 400, planted: 'SECRET-PLANTED-TEXT' },
        text: 'planted message SECRET-PLANTED-TEXT',
      },
      new Error('planted cause'),
    ),
  )

  assert.deepEqual(exported, [
    {
      level: 'error',
      message: 'planted message SECRET-PLANTED-TEXT',
      data: {
        errorId: 'PLANTED_ERROR_ID',
        domain: 'AGENT',
        category: 'USER',
        details: { statusCode: 400, planted: 'SECRET-PLANTED-TEXT' },
        cause: 'planted cause',
      },
    },
  ])
  assert.equal(lines.length, 1)
  assert.equal(lines[0]?.message, 'MASTRA_ERROR')
  assert.equal(lines[0]?.fields.trace_id, 'a'.repeat(32))
  assert.doesNotMatch(JSON.stringify(lines), /SECRET-PLANTED-TEXT/)
})
