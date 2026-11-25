import type { ConnectionId } from '@conexus/hub-api'
import { LakeRunId } from '@conexus/hub-api'
import { and, eq, isNull, sql } from 'drizzle-orm'
import type { AwsAnswer, CopyTasks, Where } from '../../platform/aws.ts'
import { TaskArn } from '../../platform/aws.ts'
import type { Database, ReadTx } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import type { CompanyScope, RunEnd } from './lake-close.ts'
import { closeLakeRun, deleteParameter, lastClosedOf, RESULT_GRACE_MS } from './lake-close.ts'
import { lakeRun } from './tables.ts'

const LOST: RunEnd = { kind: 'ERROR', code: 'COPY_TASK_LOST', table: null, system: null }

export type SweepDeps = {
  database: Database
  tasks: CopyTasks
  log: FailureLog
  /** The clock the grace is counted on; the machine's by default. */
  clock?: Readonly<{ now(): number }>
}

type Sweeping = Readonly<{
  at: CompanyScope
  connection: ConnectionId
  where: Where | null
  starting: ReadonlySet<string>
  staleSeconds: number
}>

function openOf(tx: ReadTx, a: Sweeping) {
  return tx
    .select({
      id: lakeRun.id,
      taskArn: lakeRun.taskArn,
      stale: sql<boolean>`${lakeRun.startedAt} < statement_timestamp() - make_interval(secs => ${a.staleSeconds})`,
    })
    .from(lakeRun)
    .where(and(eq(lakeRun.connectionId, a.connection), isNull(lakeRun.endedAt)))
}

/**
 * The parameter of the connection's last closed round, deleted again before a new round opens: a
 * close whose delete AWS did not answer, from the start, the sweep or a queue whose redeliveries
 * ran out, left it holding the source's credential.
 */
async function leftParameter(deps: SweepDeps, a: Sweeping, last: { id: string } | undefined) {
  if (last === undefined || a.where === null) return
  const fields = { companyId: a.at.companyId, connectionId: a.connection }
  await deleteParameter(deps, a.where, { ...fields, runId: LakeRunId.parse(last.id) })
}

/**
 * Closes the connection's open round as lost when its task is unknown to AWS (found by its
 * `startedBy` when the Hub fell before keeping the ARN), stopped longer ago than the result's
 * grace, or open longer than `staleSeconds`. A round still in this Hub's line, or one AWS does
 * not answer about, is left alone; the line and the row are read again after AWS answers, since a
 * start may have entered the line or kept its task meanwhile. Two sweeps close a round once.
 */
export async function sweep(deps: SweepDeps, a: Sweeping): Promise<void> {
  const { at, connection, where } = a
  const { open, last } = await deps.database.read(at, async (tx) => ({
    open: (await openOf(tx, a))[0],
    last: (await lastClosedOf(tx, connection))[0],
  }))
  await leftParameter(deps, a, last)
  if (open === undefined || a.starting.has(open.id)) return
  const run = LakeRunId.parse(open.id)
  const { taskArn } = open
  async function unchanged(): Promise<boolean> {
    if (a.starting.has(run)) return false
    const [now] = await deps.database.read(at, (tx) => openOf(tx, a))
    return now?.id === run && now.taskArn === taskArn
  }
  async function swept(reason: string) {
    if (!(await unchanged())) return
    const closed = await closeLakeRun(deps, at, { run, end: LOST, tables: [], cause: 'SWEEP' })
    if (closed.kind === 'CLOSED')
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
