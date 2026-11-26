import type { CompanyId, ConnectionId } from '@conexus/hub-api'
import { ConnectionId as ConnectionIdSchema, LakeRunId } from '@conexus/hub-api'
import { eq } from 'drizzle-orm'
import type { TaskArn, Where } from '../../platform/aws.ts'
import type { ReadTx } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import type { CompanyScope } from './lake-close.ts'
import { companyScope, deleteParameter, lakeOf, lastClosedOf, openRoundOf } from './lake-close.ts'
import type { LakeCopyDeps } from './lake-copy.ts'
import { awsDown, dropTables } from './lake-copy.ts'
import { MACHINE_CLOCK } from './lake-run.ts'
import { requestTaskStop, silenceWriter } from './lake-stop.ts'
import { lakeCopy, lakeTable } from './tables.ts'

type Of = Readonly<{ companyId: CompanyId; connectionId: ConnectionId }>
type Open = NonNullable<Awaited<ReturnType<typeof openRoundOf>>>

/**
 * How long a leave waits for its task to stop, read every `STOP_POLL_MS`. The task definition sets
 * no `stopTimeout` (`infra/aws/lib/copy.ts`), so ECS kills the container 30 s after the SIGTERM of
 * `StopTask`; the rest covers its STOPPING until ECS says STOPPED, and the whole stays inside the
 * request's socket deadline (`CONNECTION_TIMEOUT_MS`, 110 s). Past it the leave answers 503 and a
 * repeat goes on from where it stopped.
 */
const STOP_WAIT_MS = 60_000
const STOP_POLL_MS = 3_000

async function stoppedIn(deps: LakeCopyDeps, at: Of, where: Where, task: TaskArn) {
  const clock = deps.stopWait ?? MACHINE_CLOCK
  const until = clock.now() + STOP_WAIT_MS
  for (;;) {
    const state = await deps.tasks.state(where, task)
    if (state.kind !== 'DONE') return awsDown(deps.log, at, 'DescribeTasks', state)
    if (state.value.kind !== 'RUNNING') return true
    if (clock.now() + STOP_POLL_MS > until) return false
    await clock.sleep(STOP_POLL_MS)
  }
}

/**
 * The connection's open round ended in AWS before any table is dropped (issue #1356): the writer
 * silenced, then the task stopped and waited for until ECS says STOPPED, since a batch begun before
 * the SIGTERM may still close; then the round closes `INTERRUPTED`. A task AWS does not have counts
 * as stopped.
 */
async function stopRun(
  deps: LakeCopyDeps,
  at: Of,
  scope: CompanyScope,
  where: Where | null,
  open: Open,
) {
  const run = LakeRunId.parse(open.id)
  if (where !== null) {
    await silenceWriter(deps, at, where, run)
    const task = await requestTaskStop(deps, at, where, run, open.taskArn)
    if (task !== null && !(await stoppedIn(deps, at, where, task))) {
      deps.log.error(
        { companyId: at.companyId, connectionId: at.connectionId, runId: run },
        'COPY_TASK_STOP_SLOW',
      )
      throw new Failure('COPY_AWS_UNAVAILABLE')
    }
  }
  await deps.runs.closeLakeRun(scope, {
    run,
    end: { kind: 'INTERRUPTED' },
    tables: [],
    cause: 'LEAVE',
  })
}

type Rounds = Readonly<{ open: Open | undefined; last: { id: string } | undefined }>

async function roundsOf(tx: ReadTx, connection: ConnectionId): Promise<Rounds> {
  const open = await openRoundOf(tx, connection)
  const [last] = await lastClosedOf(tx, connection)
  return { open, last }
}

/**
 * The connection's rounds ended in AWS before its tables or rows go: the open one stopped, and the
 * parameter of the one closed last deleted again, since its close may have left it; with AWS out,
 * 503 and nothing more.
 */
async function endRounds(deps: LakeCopyDeps, at: Of, where: Where | null, rounds: Rounds) {
  const scope = companyScope(at.companyId)
  if (rounds.open !== undefined) await stopRun(deps, at, scope, where, rounds.open)
  if (rounds.last === undefined || where === null) return
  const runId = LakeRunId.parse(rounds.last.id)
  const left = await deleteParameter(deps, where, { ...at, runId })
  if (left === 'LEFT') throw new Failure('COPY_AWS_UNAVAILABLE')
}

/**
 * What a copy owes before its connection's row goes: its rounds ended in AWS, the tables dropped
 * in both areas, the clock taken, each AWS first and the row after, so with AWS out the call
 * answers 503 and the row stays; a connection with no copy never calls AWS. The row's key takes
 * `lake_copy` with it.
 */
export function createLakeLeave(deps: LakeCopyDeps) {
  return {
    async leave(at: Of): Promise<void> {
      const scope = companyScope(at.companyId)
      const found = await deps.database.read(scope, async (tx) => {
        const [copy] = await tx
          .select({ connectionId: lakeCopy.connectionId })
          .from(lakeCopy)
          .where(eq(lakeCopy.connectionId, at.connectionId))
        if (copy === undefined) return undefined
        const tables = await tx
          .select({ name: lakeTable.name })
          .from(lakeTable)
          .where(eq(lakeTable.connectionId, at.connectionId))
        const rounds = await roundsOf(tx, at.connectionId)
        return { tables, rounds, lake: await lakeOf(tx, at.companyId) }
      })
      if (found === undefined) return
      const { lake } = found
      await endRounds(deps, at, lake?.where ?? null, found.rounds)
      if (lake !== null) await dropTables(deps, at, lake, found.tables)
      await deps.clock.remove(at.connectionId)
      deps.log.info(
        { companyId: at.companyId, connectionId: at.connectionId, tables: found.tables.length },
        'LAKE_COPY_LEFT',
      )
    },

    /**
     * The company's lake leaving, after its tables are dropped: each connection's rounds ended in
     * AWS as a leave ends them, its clock taken, then the copies' rows, which carry the tables and
     * the rounds.
     */
    async erase(companyId: CompanyId): Promise<void> {
      const scope = companyScope(companyId)
      const found = await deps.database.read(scope, async (tx) => {
        const copies = await tx.select({ connectionId: lakeCopy.connectionId }).from(lakeCopy)
        const each = []
        for (const copy of copies) {
          const connectionId = ConnectionIdSchema.parse(copy.connectionId)
          each.push({ connectionId, rounds: await roundsOf(tx, connectionId) })
        }
        return { each, lake: await lakeOf(tx, companyId) }
      })
      for (const { connectionId, rounds } of found.each) {
        await endRounds(deps, { companyId, connectionId }, found.lake?.where ?? null, rounds)
        await deps.clock.remove(connectionId)
      }
      await deps.database.command(scope, (tx) =>
        tx.delete(lakeCopy).where(eq(lakeCopy.companyId, companyId)),
      )
    },
  }
}
