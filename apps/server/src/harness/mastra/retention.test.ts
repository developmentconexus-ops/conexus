import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { Mastra } from '@mastra/core/mastra'
import { createTestDatabase } from '../../platform/test-database.ts'
import { createMastraStorage } from '../memory/public.ts'
import { retentionOf } from './public.ts'

const DAY_MS = 86_400_000
const TABLE = 'mastra.mastra_span_events'

function dayOf(daysAgo: number): { suffix: string; start: string; end: string } {
  const start = new Date(Math.floor((Date.now() - daysAgo * DAY_MS) / DAY_MS) * DAY_MS)
  const end = new Date(start.getTime() + DAY_MS)
  return {
    suffix: start.toISOString().slice(0, 10).replaceAll('-', ''),
    start: start.toISOString(),
    end: end.toISOString(),
  }
}

test('a limpeza tira os dias vencidos', { timeout: 60_000 }, async (t) => {
  const { mastraPool: pool } = await createTestDatabase(t)
  const storage = createMastraStorage(pool)
  t.after(() => storage.close())
  await storage.init()

  // Spans 16 days old only exist on a live installation; the test attaches that day's partition
  // the way the store's own window does for the days it pre-creates.
  const old = dayOf(16)
  await pool.query(
    `CREATE TABLE mastra."mastra_span_events_p${old.suffix}" (LIKE ${TABLE} INCLUDING ALL)`,
  )
  await pool.query(
    `ALTER TABLE ${TABLE} ATTACH PARTITION mastra."mastra_span_events_p${old.suffix}" FOR VALUES FROM ('${old.start}') TO ('${old.end}')`,
  )

  function insert(traceId: string, at: string) {
    return pool.query(
      `INSERT INTO ${TABLE} ("traceId", "spanId", "startedAt", "endedAt", "name", "spanType")
       VALUES ($1, $2, $3::timestamptz, $3::timestamptz, 'span', 'agent_run')`,
      [traceId, randomUUID(), at],
    )
  }
  const expired = randomUUID()
  const kept = randomUUID()
  await insert(expired, new Date(Date.parse(old.start) + 3_600_000).toISOString())
  await insert(kept, new Date().toISOString())

  const results = await storage.prune({ maxRows: 50_000 })
  const spans = results.find((each) => each.table === 'mastra_span_events')
  assert.ok(spans !== undefined && spans.deleted > 0, 'the expired day is dropped')

  const left = await pool.query<{ traceId: string }>(
    `SELECT "traceId" FROM ${TABLE} WHERE "traceId" = ANY($1::text[])`,
    [[expired, kept]],
  )
  assert.deepEqual(
    left.rows.map((row) => row.traceId),
    [kept],
  )
})

test('a poda que parou no limite de linhas deixa uma linha com o nome do passo e mais nada', {
  timeout: 60_000,
}, async (t) => {
  const { mastraPool: pool } = await createTestDatabase(t)
  const storage = createMastraStorage(pool)
  t.after(() => storage.close())
  await storage.init()
  for (const daysAgo of [16, 17]) {
    const old = dayOf(daysAgo)
    await pool.query(
      `CREATE TABLE mastra."mastra_span_events_p${old.suffix}" (LIKE ${TABLE} INCLUDING ALL)`,
    )
    await pool.query(
      `ALTER TABLE ${TABLE} ATTACH PARTITION mastra."mastra_span_events_p${old.suffix}" FOR VALUES FROM ('${old.start}') TO ('${old.end}')`,
    )
    await pool.query(
      `INSERT INTO ${TABLE} ("traceId", "spanId", "startedAt", "endedAt", "name", "spanType")
       VALUES ($1, $2, $3::timestamptz, $3::timestamptz, 'span', 'agent_run')`,
      [randomUUID(), randomUUID(), new Date(Date.parse(old.start) + 3_600_000).toISOString()],
    )
  }
  const lines: { fields: Record<string, unknown>; message: string }[] = []
  const log = {
    info: (fields: Record<string, unknown>, message: string) =>
      void lines.push({ fields, message }),
    error: () => undefined,
  }
  const retention = retentionOf({ log, maxRows: 1 })
  const mastra = new Mastra({ storage, workflows: { [retention.id]: retention } })
  const run = await mastra.getWorkflow(retention.id).createRun()

  const stopped = await run.start({ inputData: {} })
  assert.equal(stopped.status, 'success')
  assert.deepEqual(Object(stopped).result, { done: false })
  assert.deepEqual(lines, [{ fields: { step: 'prune' }, message: 'RETENTION_STILL_DRAINING' }])
})
