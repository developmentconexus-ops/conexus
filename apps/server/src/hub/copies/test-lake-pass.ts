import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { LakeRunId, LakeTableName } from '@conexus/hub-api'
import type { LakeCopyOn } from './test-lake-copy.ts'
import { finished, lakeCopyOn, NOTAS, PARCEIROS, runsOf, wholeOf } from './test-lake-copy.ts'

export const BOTH = [NOTAS.name, PARCEIROS.name]
export const NONE_WHOLE = { sankhya_notas: false, sankhya_parceiros: false }
export const ALL_WHOLE = { sankhya_notas: true, sankhya_parceiros: true }

export async function loadedOn(
  t: TestContext,
  fullPass: 'DAILY' | 'OFF',
  tables = [NOTAS, PARCEIROS],
) {
  const on = await lakeCopyOn(t)
  const connection = await on.linked()
  async function put(change: object) {
    const marks = { tables, interval: '24h', startDate: null }
    const answered = await on.put(connection, { ...marks, ...change })
    assert.equal(answered.statusCode, 200, answered.body)
  }
  await put({ fullPass })
  await finished(
    on,
    connection,
    tables.map(({ name }) => name),
  )
  return { on, connection, put }
}

export async function runNow(on: LakeCopyOn, connection: string) {
  assert.equal((await on.run(connection)).statusCode, 202)
  await on.hub.lakeRuns.idle()
}

export async function rowOf(on: LakeCopyOn, connection: string, pass: 'ROUND' | 'FULL') {
  const id = `schedule_${connection}${pass === 'FULL' ? '-full' : ''}`
  const row = await on.hub.mastra.schedules.get(id)
  assert.ok(row !== null && 'inputData' in row, id)
  return row
}

/** Fires a clock's row as the scheduler would: its own workflow, with its own input. */
export async function fired(on: LakeCopyOn, row: Awaited<ReturnType<typeof rowOf>>) {
  const run = await on.hub.mastra.getWorkflow(row.workflowId).createRun()
  const ended = await run.start({ inputData: row.inputData })
  await on.hub.lakeRuns.idle()
  assert.ok(ended.status === 'success', ended.status)
  return ended.result
}

export async function fire(on: LakeCopyOn, connection: string, pass: 'ROUND' | 'FULL') {
  return fired(on, await rowOf(on, connection, pass))
}

export async function closed(
  on: LakeCopyOn,
  connection: string,
  tables: readonly Readonly<{ name: string; whole: boolean; rows: number | null }>[],
) {
  const run = (await runsOf(on, connection)).at(-1)
  const failed = tables.some(({ rows }) => rows === null)
  await on.hub.lakeRuns.closeLakeRun(on.at, {
    run: LakeRunId.parse(run?.id),
    end: failed
      ? { kind: 'ERROR', code: 'COPY_LAKE_WRITE_FAILED', table: null, system: null }
      : { kind: 'COMPLETE' },
    tables: tables.map((table) => ({
      ...table,
      name: LakeTableName.parse(table.name),
      read: 3,
      written: 3,
      rounded: 0,
    })),
    cause: 'RESULT',
  })
  await on.hub.treatment.idle()
}

export async function dueOf(on: LakeCopyOn, connection: string) {
  const rows = await on.rows(
    `select name from copies.lake_table where connection_id = $1 and full_due_at is not null
     order by name`,
    [connection],
  )
  return rows.map((row) => row.name)
}

export async function lastWhole(on: LakeCopyOn, connection: string) {
  return wholeOf(on, (await runsOf(on, connection)).at(-1)?.id)
}
