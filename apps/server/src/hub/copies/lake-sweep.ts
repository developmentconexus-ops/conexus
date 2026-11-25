import type { ConnectionId } from '@conexus/hub-api'
import { LakeRunId } from '@conexus/hub-api'
import { and, eq, isNull, sql } from 'drizzle-orm'
import type { AwsAnswer, CopyTasks, Where } from '../../platform/aws.ts'
import { TaskArn } from '../../platform/aws.ts'
import type { Database } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import type { CompanyScope, RunEnd } from './lake-close.ts'
import { closeLakeRun, RESULT_GRACE_MS } from './lake-close.ts'
import { lakeRun } from './tables.ts'

const LOST: RunEnd = { kind: 'ERROR', code: 'COPY_TASK_LOST', table: null, system: null }

export type SweepDeps = {
  database: Database
  tasks: CopyTasks
  log: FailureLog
  /** The clock the grace is counted on; the machine's by default. */
  clock?: Readonly<{ now(): number }>
}

/**
 * Closes the connection's open round as lost when its task is unknown to AWS (found by its
 * `startedBy` when the Hub fell before keeping the ARN), stopped longer ago than the result's
 * grace, or open longer than `staleSeconds`. A round still in this Hub's line, or one AWS does
 * not answer about, is left alone. Two sweeps close a round once: the same close.
 */
export async function sweep(
  deps: SweepDeps,
  a: Readonly<{
    at: CompanyScope
    connection: ConnectionId
    where: Where | null
    starting: ReadonlySet<string>
    staleSeconds: number
  }>,
): Promise<void> {
  const { at, connection, where } = a
  const [open] = await deps.database.read(at, (tx) =>
    tx
      .select({
        id: lakeRun.id,
        taskArn: lakeRun.taskArn,
        stale: sql<boolean>`${lakeRun.startedAt} < statement_timestamp() - make_interval(secs => ${a.staleSeconds})`,
      })
      .from(lakeRun)
      .where(and(eq(lakeRun.connectionId, connection), isNull(lakeRun.endedAt))),
  )
  if (open === undefined || a.starting.has(open.id)) return
  const run = LakeRunId.parse(open.id)
  async function swept(reason: string) {
    const closed = await closeLakeRun(deps, at, { run, end: LOST, tables: [], cause: 'SWEEP' })
    if (closed === 'CLOSED')
      deps.log.info(
        { companyId: at.companyId, connectionId: connection, runId: run, reason },
        'COPY_RUN_SWEPT',
      )
  }
  if (open.stale) return swept('STALE')
  if (where === null) return
  const task: AwsAnswer<TaskArn | null> =
    open.taskArn === null
      ? await deps.tasks.find(where, run)
      : { kind: 'DONE', value: TaskArn.parse(open.taskArn) }
  if (task.kind !== 'DONE') return
  if (task.value === null) return swept('NO_TASK')
  const state = await deps.tasks.state(where, task.value)
  if (state.kind !== 'DONE') return
  const read = state.value
  if (read.kind === 'MISSING') return swept('MISSING')
  if (read.kind === 'STOPPED' && read.stoppedAt !== null) {
    const now = (deps.clock ?? Date).now()
    if (read.stoppedAt.getTime() + RESULT_GRACE_MS <= now) return swept('STOPPED')
  }
}
