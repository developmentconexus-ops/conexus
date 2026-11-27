import { TreatmentRunId } from '@conexus/hub-api'
import { isNull, sql } from 'drizzle-orm'
import type { AwsAnswer, CopyTasks } from '../../platform/aws.ts'
import { TaskArn } from '../../platform/aws.ts'
import type { Database, ReadTx } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import type { CompanyScope } from '../copies/public.ts'
import { lakeOf, RESULT_GRACE_MS } from '../copies/public.ts'
import { treatmentRun } from './tables.ts'

export type TreatmentSweepDeps = Readonly<{
  database: Database
  tasks: Pick<CopyTasks, 'find' | 'state'>
  log: FailureLog
  /** The runs still in this Hub's start, which the sweep leaves alone. */
  starting: ReadonlySet<string>
  staleSeconds: number
  close(
    at: CompanyScope,
    run: TreatmentRunId,
    end: Readonly<{ kind: 'LOST'; cause: 'SWEEP' }>,
  ): Promise<'CLOSED' | 'ALREADY_CLOSED'>
  /** The clock the grace is counted on; the machine's by default. */
  clock?: Readonly<{ now(): number }>
}>

function openOf(tx: ReadTx, staleSeconds: number) {
  return tx
    .select({
      id: treatmentRun.id,
      task: treatmentRun.task,
      stale: sql<boolean>`${treatmentRun.startedAt} < now() - make_interval(secs => ${staleSeconds})`,
    })
    .from(treatmentRun)
    .where(isNull(treatmentRun.endedAt))
}

/**
 * The copy's sweep (`lake-sweep.ts`) for the company's open treatment run: closed as its task
 * stopped when AWS does not know the task, stopped it longer ago than the result's grace, or the run
 * is open past `staleSeconds`. A run in this Hub's start, or one AWS does not answer about, stays;
 * the row is read again after AWS answers. The close decides `STOPPED` when a person asked.
 */
export async function sweepTreatment(deps: TreatmentSweepDeps, at: CompanyScope): Promise<void> {
  const { open, lake } = await deps.database.read(at, async (tx) => ({
    open: (await openOf(tx, deps.staleSeconds))[0],
    lake: await lakeOf(tx, at.companyId),
  }))
  if (open === undefined || deps.starting.has(open.id)) return
  const run = TreatmentRunId.parse(open.id)
  async function swept(reason: string) {
    if (deps.starting.has(run)) return
    const [now] = await deps.database.read(at, (tx) => openOf(tx, deps.staleSeconds))
    if (now?.id !== run || now.task !== open?.task) return
    const closed = await deps.close(at, run, { kind: 'LOST', cause: 'SWEEP' })
    if (closed === 'CLOSED')
      deps.log.info({ companyId: at.companyId, runId: run, reason }, 'TREATMENT_RUN_SWEPT')
  }
  if (open.stale) return swept('STALE')
  if (lake === null) return
  const task: AwsAnswer<TaskArn | null> =
    open.task === null
      ? await deps.tasks.find(lake.where, run)
      : { kind: 'DONE', value: TaskArn.parse(open.task) }
  if (task.kind !== 'DONE') return
  if (task.value === null) return swept('NO_TASK')
  const state = await deps.tasks.state(lake.where, task.value)
  if (state.kind !== 'DONE') return
  if (state.value.kind === 'MISSING') return swept('MISSING')
  if (state.value.kind === 'STOPPED' && state.value.stoppedAt !== null) {
    const now = (deps.clock ?? Date).now()
    if (state.value.stoppedAt.getTime() + RESULT_GRACE_MS <= now) return swept('STOPPED')
  }
}
