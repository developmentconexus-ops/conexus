import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import type { LakeRunId } from '@conexus/hub-api'
import { z } from 'zod'
import type { CopyQueue } from '../../platform/aws.ts'
import { RunParameter, TaskArn } from '../../platform/aws.ts'
import type { Database } from '../../platform/database.ts'
import { DatabaseUrl, openDatabase } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import { awsRecording } from '../../platform/test-aws.ts'
import { silent } from '../../platform/test-database.ts'
import { until } from '../../platform/test-until.ts'
import { createLakeQueue } from './lake-queue.ts'
import { CopyTaskProgress, CopyTaskResult } from './lake-task.ts'
import type { LakeRunOn } from './test-lake-run.ts'
import { queued } from './test-lake-run.ts'

export const NOTAS = { source: 'TGFCAB', name: 'sankhya_notas' }
export const PARCEIROS = { source: 'TGFPAR', name: 'sankhya_parceiros' }

const Batch = z.object({ Messages: z.array(z.object({ Body: z.string() })) })
const Stop = z.object({ detail: z.object({ taskArn: z.string(), startedBy: z.string() }) })

type StopCode = 'EssentialContainerExited' | 'UserInitiated'

/**
 * ECS's stop of a task whose container exited 0, after its result: the recorded stop of an exit 1
 * said of this task and round, with the exit code changed, and the stop code when asked (values
 * only, T29).
 */
export function finished(
  on: Pick<LakeRunOn, 'aws'>,
  task: { run: string; arn: string },
  stopCode: StopCode = 'EssentialContainerExited',
) {
  const [, exited] = Batch.parse(JSON.parse(awsRecording('receive-message-lote').body)).Messages
  assert.ok(exited !== undefined, 'the recording holds the exit 1')
  const { detail } = Stop.parse(JSON.parse(exited.Body))
  const body = exited.Body.replaceAll(detail.taskArn, task.arn)
    .replaceAll(detail.startedBy, task.run)
    .replace('"exitCode":1', '"exitCode":0')
    .replace('"stopCode":"EssentialContainerExited"', `"stopCode":"${stopCode}"`)
  assert.ok(body.includes('"exitCode":0'), 'the exit code changed')
  assert.ok(body.includes(`"stopCode":"${stopCode}"`), 'the stop code is the asked one')
  on.aws.enqueue(body)
}

/** The message the task sends at the end of its round, read by the contract before it is sent. */
export function result(
  run: LakeRunId,
  outcome: object = { kind: 'COMPLETE' },
  tables: object[] = [],
  machine?: object | null,
) {
  const sent = { type: 'RESULT', version: 1, runId: run, attempt: 1, outcome, tables, machine }
  return JSON.stringify(CopyTaskResult.parse(sent))
}

/** The scoreboard the task sends while it runs, read by the contract before it is sent. */
export function progress(run: string, seq: number, change: object = {}) {
  const sent = {
    ...{ type: 'PROGRESS', version: 1, runId: run, attempt: 1, seq, at: '2026-11-27T14:03:00Z' },
    phase: { kind: 'COPYING' },
    tables: [
      {
        ...{ name: NOTAS.name, read: seq * 1000, written: seq * 1000 },
        ...{ startedAt: '2026-11-27T14:02:30Z', endedAt: null, failed: false },
      },
    ],
    ...change,
  }
  return JSON.stringify(CopyTaskProgress.parse(sent))
}

/** A round open on a connection of these tables, its task started in the double. */
export async function running(on: LakeRunOn, tables = [NOTAS], name = 'Matriz') {
  const connection = await on.copied(tables, { name })
  const run = queued(await on.runs.iniciarRodada(on.at, connection, 'NOW'))
  await on.runs.idle()
  const task = on.aws.tasks().find(({ startedBy }) => startedBy === run)
  assert.ok(task !== undefined, 'the round has its task')
  return { connection, run, arn: task.arn }
}

/** A round's end as its row holds it. */
export async function roundOf(on: LakeRunOn, run: string) {
  const [row] = await on.rows(
    `select outcome, code, failed_table, ended_at is not null as ended from copies.lake_run where id = $1`,
    [run],
  )
  return row
}

/** Every message the consumer read left the queue. */
export async function drained(on: Pick<LakeRunOn, 'aws'>) {
  await until(() => on.aws.queued() === 0, 'the queue emptied')
}

/** The round's `COPY_RUN_ENDED` lines. */
export function endedLines(on: LakeRunOn, run: string) {
  return on.lines.filter(
    ({ message, fields }) => message === 'COPY_RUN_ENDED' && fields.runId === run,
  )
}

export { RESULT_GRACE_MS } from './lake-close.ts'
export type { CopyQueue }

function whereOf(on: LakeRunOn) {
  const { account, region } = on.config.aws
  return { company: on.companyId, account, region }
}

/** The Hub's StopTask of a round's task, as the leave and the stop ask it. */
export function stopTaskOf(on: LakeRunOn, arn: string) {
  return on.ports.tasks.stop(whereOf(on), TaskArn.parse(arn))
}

/** A round's parameter deleted outside the close, as a repeat finds it. */
export function deleteParameterOf(on: LakeRunOn, run: string) {
  return on.ports.tasks.deleteRun(
    whereOf(on),
    RunParameter.parse(`/conexus/copia/${on.companyId}/${run}`),
  )
}

/**
 * The next `DeleteParameter` call goes unanswered and deletes nothing: the SDK repeats the request
 * once inside the call's deadline, so both requests are silent.
 */
export function silenceDelete(on: Pick<LakeRunOn, 'aws'>) {
  on.aws.start.script('DeleteParameter', 'SILENT')
  on.aws.start.script('DeleteParameter', 'SILENT')
}

/** A consumer of its own, on another database or queue than the Hub's. */
export function consumerOn(
  on: LakeRunOn,
  ports: { database?: Database; queue?: CopyQueue; log?: FailureLog } = {},
) {
  return createLakeQueue({
    database: ports.database ?? on.hub.test.database,
    tasks: on.ports.tasks,
    queue: ports.queue ?? on.ports.queue,
    log: ports.log ?? silent,
    companies: on.companies,
  })
}

/** The Hub's database whose first `left` commands meet the database out. */
export function flakyDatabase(on: LakeRunOn, refusals: { left: number }): Database {
  const database = on.hub.test.database
  return {
    ...database,
    command(scope, work) {
      if (refusals.left > 0) {
        refusals.left -= 1
        return Promise.reject(new Failure('DATABASE_UNAVAILABLE'))
      }
      return database.command(scope, work)
    },
  }
}

/** A pool of its own on the Hub's database, its connections named `app` in pg_stat_activity, closed with the test. */
export function namedDatabase(t: TestContext, on: LakeRunOn, app: string): Database {
  const url = new URL(on.hub.test.runtimeUrl.reveal())
  url.searchParams.set('application_name', app)
  const database = openDatabase({
    url: DatabaseUrl.parse(url.href),
    log: silent,
    timings: { idleTimeoutMillis: 200, readDeadlineMs: 5_000 },
  })
  t.after(() => database.close())
  return database
}
