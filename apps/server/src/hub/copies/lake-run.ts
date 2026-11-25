import { randomUUID } from 'node:crypto'
import type { CompanyId, ConnectionId, LakeInterval } from '@conexus/hub-api'
import { ConnectionId as ConnectionIdSchema, LakeRunId } from '@conexus/hub-api'
import { and, eq, isNull, sql } from 'drizzle-orm'
import type { AwsAnswer, CopyQueue, CopyTasks, TaskArn, Where } from '../../platform/aws.ts'
import { bucketName, RunParameter, runParameterName, writerRoleArn } from '../../platform/aws.ts'
import type { AwsConfig } from '../../platform/config-aws.ts'
import type { Database } from '../../platform/database.ts'
import { databaseFailure, violatedConstraint } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { logFailure } from '../../platform/failure.ts'
import type { CopySource } from '../connectors/public.ts'
import type { CompanyScope, RunEnd, RunFields } from './lake-close.ts'
import { closeLakeRun, companyScope, deleteParameter } from './lake-close.ts'
import { createLakeQueue } from './lake-queue.ts'
import type { Started } from './lake-spec.ts'
import { readCopy, specOf, writeColumns } from './lake-spec.ts'
import { sweep } from './lake-sweep.ts'
import { lakeCopy, lakeRun } from './tables.ts'

const RUN_STALE_MS = 48 * 60 * 60 * 1_000
/** The Parameter Store's advanced tier, which `Intelligent-Tiering` picks past the standard 4 KB. */
const PARAMETER_MAX_BYTES = 8 * 1_024
/** Parameter Store's `PutParameter` quota for the account: the start line never passes it. */
const PARAMETER_WRITES_PER_SECOND = 3
/**
 * Fargate's sizes, in 1/1024 vCPU and MiB: 2 vCPU and 4 GB when a round carries a table's
 * first load, 1 vCPU and 2 GB otherwise, the task definition's own.
 */
const MACHINES = {
  FIRST_LOAD: { cpu: 2_048, memory: 4_096 },
  NEXT: { cpu: 1_024, memory: 2_048 },
} as const
const TRIES = 3
const RETRY_WAIT_MS = 1_000
const SECOND_MS = 1_000
const UNAVAILABLE: RunEnd = {
  kind: 'ERROR',
  code: 'COPY_LAKE_UNAVAILABLE',
  table: null,
  system: null,
}

/** The `RunTask` idempotency token of a round's attempt: the round and the attempt, at most 64 characters. */
function clientTokenOf(run: string, attempt: number): string {
  return `${run}-${attempt}`
}

export type StartAnswer =
  | Readonly<{ kind: 'QUEUED'; run: LakeRunId }>
  | Readonly<{ kind: 'ALREADY_RUNNING' }>
  | Readonly<{ kind: 'NO_COPY' }>

/** The start line's time: the machine's in production, a test's own in the tests. */
export type StartClock = Readonly<{ now(): number; sleep(ms: number): Promise<void> }>

export const MACHINE_CLOCK: StartClock = {
  now: () => Date.now(),
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
}

/** A connection's copy as the clock reads it at the Hub's start: when it was born and how often it runs. */
export type ScheduledCopy = Readonly<{
  companyId: CompanyId
  connectionId: ConnectionId
  interval: LakeInterval
  anchor: Date
}>

export type LakeRunDeps = {
  database: Database
  tasks: CopyTasks
  source: CopySource
  copy: AwsConfig['copy']
  log: FailureLog
  /** The companies with a connection, read by the Hub's own login, for the clocks at start. */
  companies: () => Promise<readonly CompanyId[]>
  clock?: StartClock
  /** Where the task's result and ECS's stop arrive: its consumer is the rounds' end. */
  queue: CopyQueue
}

type Line = ReturnType<typeof startLine>

async function afterTurn(turn: Promise<unknown>): Promise<void> {
  await Promise.allSettled([turn])
}

function startLine(clock: StartClock) {
  let tail: Promise<void> = Promise.resolve()
  let waiting = 0
  const written: number[] = []
  async function writeTurn(): Promise<void> {
    for (;;) {
      const oldest = written[0]
      if (written.length < PARAMETER_WRITES_PER_SECOND || oldest === undefined) break
      const wait = oldest + SECOND_MS - clock.now()
      if (wait <= 0) written.shift()
      else await clock.sleep(wait)
    }
    written.push(clock.now())
  }
  function inLine<T>(work: () => Promise<T>): Promise<T> {
    waiting += 1
    const turn = tail.then(work).finally(() => {
      waiting -= 1
    })
    tail = afterTurn(turn)
    return turn
  }
  return { inLine, writeTurn, waiting: () => waiting, clock }
}

async function tried<T>(
  clock: StartClock,
  call: () => Promise<AwsAnswer<T>>,
  before?: () => Promise<void>,
): Promise<AwsAnswer<T>> {
  let answer: AwsAnswer<T> = { kind: 'NO_ANSWER' }
  for (let attempt = 1; attempt <= TRIES; attempt += 1) {
    if (attempt > 1) await clock.sleep(RETRY_WAIT_MS * 2 ** (attempt - 2))
    await before?.()
    answer = await call()
    if (answer.kind !== 'NO_ANSWER') return answer
  }
  return answer
}

type Launch = Readonly<{ where: Where; writer: string; spec: string }>

async function launch(deps: LakeRunDeps, line: Line, started: Started, a: Launch) {
  const { at, connection, copy } = started
  const run = LakeRunId.parse(started.run)
  const fields = { companyId: at.companyId, connectionId: connection, runId: run }
  async function failed(call: string, answer: AwsAnswer<unknown>) {
    const said = { ...fields, call, answer: answer.kind }
    const named = answer.kind === 'REFUSED' ? { ...said, code: answer.code } : said
    deps.log.error(named, 'COPY_LAKE_START_FAILED')
    await closeLakeRun(deps, at, { run, end: UNAVAILABLE, tables: [], cause: 'START' })
  }
  const parameter = RunParameter.parse(runParameterName(at.companyId, run))
  const spec = { name: parameter, spec: a.spec }
  const put = await tried(line.clock, () => deps.tasks.putRun(a.where, spec), line.writeTurn)
  if (put.kind !== 'DONE') return failed('PutParameter', put)
  const first = copy.tables.some((table) => table.firstLoad)
  const machine = first ? MACHINES.FIRST_LOAD : MACHINES.NEXT
  const token = clientTokenOf(run, 1)
  const asked = { token, startedBy: run, writer: a.writer, parameter, machine }
  const task = await tried(line.clock, () => deps.tasks.start(a.where, asked))
  if (task.kind !== 'DONE') return failed('RunTask', task)
  if ((await kept(deps, started, task.value)) === 'CLOSED')
    await undone(deps, line, { where: a.where, fields, task: task.value })
}

/** The task's ARN kept on its round, unless the round closed while the start was in the line. */
async function kept(deps: LakeRunDeps, started: Started, task: TaskArn) {
  const run = LakeRunId.parse(started.run)
  try {
    const rows = await deps.database.command(started.at, (tx) =>
      tx
        .update(lakeRun)
        .set({ taskArn: task })
        .where(and(eq(lakeRun.id, run), isNull(lakeRun.endedAt)))
        .returning({ id: lakeRun.id }),
    )
    return rows.length === 0 ? 'CLOSED' : 'KEPT'
  } catch (error) {
    const failure = databaseFailure(error)
    if (failure.code !== 'DATABASE_UNAVAILABLE') throw failure
    deps.log.error(
      { companyId: started.at.companyId, connectionId: started.connection, runId: run },
      'COPY_TASK_UNRECORDED',
    )
    return 'UNRECORDED'
  }
}

/**
 * A round closed during its start, by a leave or a sweep: the close found no task to stop and
 * deleted a parameter the start then wrote again, so the start stops its task and deletes it.
 */
async function undone(
  deps: LakeRunDeps,
  line: Line,
  a: Readonly<{ where: Where; fields: RunFields; task: TaskArn }>,
) {
  deps.log.info(a.fields, 'COPY_START_UNDONE')
  const stopped = await tried(line.clock, () => deps.tasks.stop(a.where, a.task))
  if (stopped.kind !== 'DONE')
    deps.log.error({ ...a.fields, answer: stopped.kind }, 'COPY_TASK_LEFT')
  await deleteParameter(deps, a.where, a.fields)
}

async function start(deps: LakeRunDeps, line: Line, started: Started) {
  const { at, copy } = started
  const run = LakeRunId.parse(started.run)
  function unavailable() {
    return closeLakeRun(deps, at, { run, end: UNAVAILABLE, tables: [], cause: 'START' })
  }
  if (copy.lake === null || !copy.lake.ready) return unavailable()
  const { where, lakeId } = copy.lake
  await writeColumns(deps, started)
  const spec = await specOf(deps, started, { where, bucket: bucketName(lakeId) })
  if (spec === null) return
  const bytes = Buffer.byteLength(spec)
  if (bytes > PARAMETER_MAX_BYTES) {
    deps.log.error({ companyId: at.companyId, runId: run, bytes }, 'COPY_LAKE_START_FAILED')
    return unavailable()
  }
  const writer = writerRoleArn(where.account, lakeId)
  await line.inLine(() => launch(deps, line, started, { where, writer, spec }))
}

async function opened(
  deps: LakeRunDeps,
  at: CompanyScope,
  row: Omit<typeof lakeRun.$inferInsert, 'startedAt'>,
) {
  try {
    await deps.database.command(at, (tx) =>
      tx.insert(lakeRun).values({ ...row, startedAt: sql`statement_timestamp()` }),
    )
    return true
  } catch (error) {
    if (violatedConstraint(error) === 'lake_run_open_key') return false
    throw error
  }
}

async function scheduled(deps: LakeRunDeps): Promise<ScheduledCopy[]> {
  const copies: ScheduledCopy[] = []
  for (const companyId of await deps.companies()) {
    const rows = await deps.database.read(companyScope(companyId), (tx) =>
      tx
        .select({
          connectionId: lakeCopy.connectionId,
          interval: lakeCopy.interval,
          anchor: lakeCopy.createdAt,
        })
        .from(lakeCopy),
    )
    for (const row of rows)
      copies.push({ ...row, companyId, connectionId: ConnectionIdSchema.parse(row.connectionId) })
  }
  return copies
}

/**
 * The one start of a connection's round, for its clock and for Rodar agora (Relógio): the sweep of
 * its open round, the round opened (the open-round index refuses a second), then the start in the
 * line, with the company's writer role and the round's token, and the task's ARN kept. It answers
 * when the start is in the line, never waiting for the copy.
 */
export function createLakeRuns(input: LakeRunDeps) {
  const consumer = createLakeQueue(input)
  const deps = { ...input, watch: consumer.watch }
  const line = startLine(deps.clock ?? MACHINE_CLOCK)
  const starting = new Set<string>()
  const pending = new Set<Promise<void>>()

  async function iniciarRodada(
    at: CompanyScope,
    connection: ConnectionId,
    cause: 'CLOCK' | 'NOW',
    whole = false,
  ): Promise<StartAnswer> {
    const fields = { companyId: at.companyId, connectionId: connection, cause }
    const copy = await readCopy(deps.database, at, connection)
    if (copy === null || copy.tables.length === 0) {
      deps.log.info({ ...fields, reason: 'NO_COPY' }, 'COPY_RUN_SKIPPED')
      return { kind: 'NO_COPY' }
    }
    const where = copy.lake?.where ?? null
    await sweep(deps, { at, connection, where, starting, staleSeconds: RUN_STALE_MS / 1_000 })
    const run = LakeRunId.parse(randomUUID())
    const row = { id: run, companyId: at.companyId, connectionId: connection, whole, attempt: 1 }
    if (!(await opened(deps, at, row))) {
      deps.log.info({ ...fields, reason: 'ALREADY_RUNNING' }, 'COPY_RUN_SKIPPED')
      return { kind: 'ALREADY_RUNNING' }
    }
    deps.watch.opened(at.companyId, run)
    starting.add(run)
    const job: Promise<void> = start(deps, line, { at, connection, run, whole, copy })
      .then(() => undefined)
      .catch((error: unknown) => logFailure(deps.log, databaseFailure(error)))
      .finally(() => {
        starting.delete(run)
        pending.delete(job)
      })
    pending.add(job)
    deps.log.info({ ...fields, runId: run, whole, waiting: line.waiting() }, 'COPY_RUN_QUEUED')
    return { kind: 'QUEUED', run }
  }

  return Object.freeze({
    iniciarRodada,
    /** The one close, for the queue's consumer (`lake-queue.ts`) and the sweep. */
    closeLakeRun: (at: CompanyScope, close: Parameters<typeof closeLakeRun>[2]) =>
      closeLakeRun(deps, at, close),
    /** Every copy of a connection, of every company with a connection, for the clocks at start. */
    scheduled: () => scheduled(deps),
    /** The rounds' end: `start` reads the open rounds once, then the queue while one is open (D27). */
    queue: { start: consumer.start, stop: consumer.stop, reading: consumer.reading },
    /** Resolves when every start in the line has ended: a test's wait, and the Hub's end. */
    async idle(): Promise<void> {
      while (pending.size > 0) await Promise.all(pending)
    },
  })
}

export type LakeRuns = ReturnType<typeof createLakeRuns>
