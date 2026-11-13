import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import type { LoggerAdapterContext } from '@mastra/core/logger'
import { buildLogRecordData } from '@mastra/core/logger'
import type { Scalar } from '../../platform/failure.ts'
import type { Sent } from '../../platform/test-anthropic.ts'
import { asked, conversing, title } from '../conversation/test-conversation.ts'
import { BuilderLogger } from './logger.ts'

type LogLine = { fields: Record<string, Scalar>; message: string }
type SinkCall = { level: string; message: string; data: Record<string, unknown> | undefined }

function capturedSink() {
  const calls: SinkCall[] = []
  return {
    calls,
    sink: {
      debug: (m: string, d?: Record<string, unknown>) =>
        void calls.push({ level: 'debug', message: m, data: d }),
      info: (m: string, d?: Record<string, unknown>) =>
        void calls.push({ level: 'info', message: m, data: d }),
      warn: (m: string, d?: Record<string, unknown>) =>
        void calls.push({ level: 'warn', message: m, data: d }),
      error: (m: string, d?: Record<string, unknown>) =>
        void calls.push({ level: 'error', message: m, data: d }),
    },
  }
}

function mockCtx(opts: {
  export: boolean
  correlation: boolean
  traceId?: string
  spanId?: string
}): LoggerAdapterContext & { captured: ReturnType<typeof capturedSink> } {
  const captured = capturedSink()
  return {
    captured,
    resolveTraceFields: () =>
      opts.traceId
        ? { trace_id: opts.traceId, ...(opts.spanId ? { span_id: opts.spanId } : {}) }
        : undefined,
    getLogSink: () => (opts.export ? captured.sink : undefined),
    options: { export: opts.export, correlation: opts.correlation },
  }
}

function fresh() {
  const lines: LogLine[] = []
  const log = {
    info: (fields: Record<string, Scalar>, message: string) => lines.push({ fields, message }),
    error: (fields: Record<string, Scalar>, message: string) => lines.push({ fields, message }),
  }
  return { lines, logger: new BuilderLogger(log) }
}

test('o aviso vai ao rastro, o log do contêiner fica com escalares: warn rota trace_id e S41', () => {
  const { lines, logger } = fresh()
  const PLANTED = 'mensagem plantada que não deve aparecer no contêiner'
  const error = new Error('falha do provedor')
  const ctx = mockCtx({
    export: true,
    correlation: true,
    traceId: 'aabbcc00112233440000000000000001',
    spanId: 'aabbcc001122334400000001',
  })
  logger.__attachObservability(ctx)
  logger.warn(PLANTED, error)

  assert.equal(lines.length, 1)
  const line = lines[0]
  assert.ok(line !== undefined)
  assert.equal(line.message, 'MASTRA_WARNING')
  assert.equal(line.fields.trace_id, 'aabbcc00112233440000000000000001')
  assert.equal(line.fields.span_id, 'aabbcc001122334400000001')
  assert.ok(
    !JSON.stringify(line.fields).includes(PLANTED),
    'a mensagem plantada não deve aparecer nos campos do contêiner (S41)',
  )
  assert.equal(ctx.captured.calls.length, 1)
  const call = ctx.captured.calls[0]
  assert.ok(call !== undefined)
  assert.equal(call.level, 'warn')
  assert.equal(call.message, PLANTED)
  assert.deepEqual(call.data, buildLogRecordData([error]))
})

test('o aviso vai ao rastro, o log do contêiner fica com escalares: error', () => {
  const { lines, logger } = fresh()
  const PLANTED = 'erro plantado que não deve aparecer no contêiner'
  const ctx = mockCtx({
    export: true,
    correlation: true,
    traceId: 'aabbcc00112233440000000000000002',
    spanId: 'aabbcc001122334400000002',
  })
  logger.__attachObservability(ctx)
  logger.error(PLANTED)

  assert.equal(lines.length, 1)
  assert.equal(lines[0]?.message, 'MASTRA_ERROR')
  assert.equal(lines[0]?.fields.trace_id, 'aabbcc00112233440000000000000002')
  assert.ok(!JSON.stringify(lines[0]?.fields).includes(PLANTED))
  assert.equal(ctx.captured.calls[0]?.level, 'error')
  assert.equal(ctx.captured.calls[0]?.message, PLANTED)
})

test('o aviso vai ao rastro, o log do contêiner fica com escalares: trackException', () => {
  const { lines, logger } = fresh()
  const PLANTED = 'mensagem de exceção plantada'
  const error = Object.assign(new Error(PLANTED), { id: 'mastra-err-001' })
  const ctx = mockCtx({
    export: true,
    correlation: true,
    traceId: 'aabbcc00112233440000000000000003',
  })
  logger.__attachObservability(ctx)
  logger.trackException(error)

  assert.equal(lines[0]?.message, 'MASTRA_ERROR')
  assert.equal(lines[0]?.fields.trace_id, 'aabbcc00112233440000000000000003')
  assert.ok(!JSON.stringify(lines[0]?.fields).includes(PLANTED))
  assert.equal(ctx.captured.calls[0]?.message, PLANTED)
  assert.equal(ctx.captured.calls[0]?.level, 'error')
})

test('o aviso vai ao rastro, o log do contêiner fica com escalares: sem contexto sem trace_id', () => {
  const { lines, logger } = fresh()
  logger.warn('mensagem sem contexto')

  assert.equal(lines.length, 1)
  assert.equal(lines[0]?.message, 'MASTRA_WARNING')
  assert.ok(!('trace_id' in (lines[0]?.fields ?? {})))
})

test('o aviso vai ao rastro, o log do contêiner fica com escalares: export desligado', () => {
  const { lines, logger } = fresh()
  const ctx = mockCtx({
    export: false,
    correlation: true,
    traceId: 'aabbcc00112233440000000000000004',
  })
  logger.__attachObservability(ctx)
  logger.warn('aviso com export desligado')

  assert.equal(ctx.captured.calls.length, 0)
  assert.equal(lines[0]?.message, 'MASTRA_WARNING')
  assert.equal(lines[0]?.fields.trace_id, 'aabbcc00112233440000000000000004')
})

test('o aviso vai ao rastro, o log do contêiner fica com escalares: correlação desligada', () => {
  const { lines, logger } = fresh()
  const ctx = mockCtx({
    export: true,
    correlation: false,
    traceId: 'aabbcc00112233440000000000000005',
  })
  logger.__attachObservability(ctx)
  logger.warn('aviso com correlação desligada')

  assert.ok(!('trace_id' in (lines[0]?.fields ?? {})))
  assert.equal(ctx.captured.calls[0]?.level, 'warn')
})

test('o aviso vai ao rastro, o log do contêiner fica com escalares: debug e info descartados', () => {
  const { lines, logger } = fresh()
  const ctx = mockCtx({ export: true, correlation: true, traceId: 'aaaa0000' })
  logger.__attachObservability(ctx)
  logger.debug()
  logger.info()

  assert.equal(lines.length, 0)
  assert.equal(ctx.captured.calls.length, 0)
})

test('o aviso do Mastra fica no banco do Mastra com o texto, e o log do contêiner sem ele', async (t: TestContext) => {
  const on = await conversing(t, (each: Sent) => title(each) ?? { kind: 'text', text: 'ok' })
  const { hub, ana, conversations } = on
  await asked(t, { hub, person: ana, conversations })
  hub.mastra.getLogger().warn('MASTRA_LOGGER_TEST_WARN planted')
  await hub.close()

  const rows = await hub.test.mastraPool.query<{ message: string }>(
    `SELECT "message" FROM mastra.mastra_log_events WHERE "message" LIKE 'MASTRA_LOGGER_TEST_WARN%'`,
  )
  assert.deepEqual(
    rows.rows.map((row) => row.message),
    ['MASTRA_LOGGER_TEST_WARN planted'],
  )
})
