import type { CompanyId, ConnectionId } from '@conexus/hub-api'
import { ConnectionId as ConnectionIdSchema, LakeRunId } from '@conexus/hub-api'
import { and, eq, isNull } from 'drizzle-orm'
import type { AwsAnswer, Where } from '../../platform/aws.ts'
import { RunParameter, runParameterName, TaskArn } from '../../platform/aws.ts'
import { Failure } from '../../platform/failure.ts'
import type { CompanyScope } from './lake-close.ts'
import { companyScope, lakeOf } from './lake-close.ts'
import type { LakeCopyDeps } from './lake-copy.ts'
import { awsDown, dropTables } from './lake-copy.ts'
import { MACHINE_CLOCK } from './lake-run.ts'
import { lakeCopy, lakeRun, lakeTable } from './tables.ts'

type Of = Readonly<{ companyId: CompanyId; connectionId: ConnectionId }>
type Open = Readonly<{ id: string; taskArn: string | null }>

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
 * The connection's open round ended in AWS before any table is dropped (issue #1356): its parameter
 * deleted first, so the writer, which reads it before each batch, writes no more; then the task
 * stopped and waited for until ECS says STOPPED, since a batch begun before the SIGTERM may still
 * close; then the round closes `INTERRUPTED`. A task AWS does not have counts as stopped.
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
    const parameter = RunParameter.parse(runParameterName(at.companyId, run))
    const deleted = await deps.tasks.deleteRun(where, parameter)
    if (deleted.kind !== 'DONE') return awsDown(deps.log, at, 'DeleteParameter', deleted)
    const task: AwsAnswer<TaskArn | null> =
      open.taskArn === null
        ? await deps.tasks.find(where, run)
        : { kind: 'DONE', value: TaskArn.parse(open.taskArn) }
    if (task.kind !== 'DONE') return awsDown(deps.log, at, 'ListTasks', task)
    if (task.value !== null) {
      const stopped = await deps.tasks.stop(where, task.value)
      if (stopped.kind !== 'DONE') return awsDown(deps.log, at, 'StopTask', stopped)
      if (!(await stoppedIn(deps, at, where, task.value))) {
        deps.log.error(
          { companyId: at.companyId, connectionId: at.connectionId, runId: run },
          'COPY_TASK_STOP_SLOW',
        )
        throw new Failure('COPY_AWS_UNAVAILABLE')
      }
    }
  }
  await deps.runs.closeLakeRun(scope, {
    run,
    end: { kind: 'INTERRUPTED' },
    tables: [],
    cause: 'LEAVE',
  })
}

/**
 * What a copy owes before its connection's row goes (criterion 47): the open round's task stopped,
 * the tables dropped in both areas, the clock taken, each AWS first and the row after, so with AWS
 * out the call answers 503 and the row stays; a connection with no copy never calls AWS. The row's
 * key takes `lake_copy` with it.
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
        const [open] = await tx
          .select({ id: lakeRun.id, taskArn: lakeRun.taskArn })
          .from(lakeRun)
          .where(and(eq(lakeRun.connectionId, at.connectionId), isNull(lakeRun.endedAt)))
        return { tables, open, lake: await lakeOf(tx, at.companyId) }
      })
      if (found === undefined) return
      const { lake, open } = found
      if (open !== undefined) await stopRun(deps, at, scope, lake?.where ?? null, open)
      if (lake !== null) await dropTables(deps, at, lake, found.tables)
      await deps.clock.remove(at.connectionId)
      deps.log.info(
        { companyId: at.companyId, connectionId: at.connectionId, tables: found.tables.length },
        'LAKE_COPY_LEFT',
      )
    },

    /**
     * The company's lake leaving, after its tables are dropped: the clocks of the company's
     * connections, then the copies' rows, which carry the tables and the rounds (criterion 48).
     */
    async erase(companyId: CompanyId): Promise<void> {
      const scope = companyScope(companyId)
      const copies = await deps.database.read(scope, (tx) =>
        tx.select({ connectionId: lakeCopy.connectionId }).from(lakeCopy),
      )
      for (const { connectionId } of copies)
        await deps.clock.remove(ConnectionIdSchema.parse(connectionId))
      await deps.database.command(scope, (tx) =>
        tx.delete(lakeCopy).where(eq(lakeCopy.companyId, companyId)),
      )
    },
  }
}
