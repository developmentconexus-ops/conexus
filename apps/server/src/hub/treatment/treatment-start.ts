import type { CompanyId, TreatmentRunId } from '@conexus/hub-api'
import { and, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'
import type { CopyTasks, TaskArn, Where } from '../../platform/aws.ts'
import { bucketName, treaterRoleArn, treatSpecKey } from '../../platform/aws.ts'
import type { AwsConfig } from '../../platform/config-aws.ts'
import type { Database } from '../../platform/database.ts'
import { databaseFailure } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import type { CompanyScope, StartClock } from '../copies/public.ts'
import { lakeOf, tried } from '../copies/public.ts'
import type { TreatmentReads } from './models.ts'
import { treatModelsOf } from './models.ts'
import { treatmentRun } from './tables.ts'
import { TreatTaskSpec } from './treat-task.ts'
import type { TreatmentEnd } from './treatment-rows.ts'

export type TreatmentRunDeps = TreatmentReads &
  Readonly<{
    database: Database
    tasks: CopyTasks
    log: FailureLog
    copy: AwsConfig['copy']
    /** The copies' queue consumer, which reads the queue while a run is open (data D27). */
    watch: () => Readonly<{
      opened(companyId: CompanyId, run: string, kind: 'TREATMENT'): void
      ended(run: string): void
    }>
    clock?: StartClock
  }>

/** The task definition's own machine: dbt sends the SQL to Athena, which does the work. */
const MACHINE = { cpu: 1_024, memory: 2_048 } as const

/** What a start needs: the runs' ports, their clock, and the close a failed start ends with. */
export type StartLine = Readonly<{
  deps: TreatmentRunDeps
  clock: StartClock
  close(at: CompanyScope, run: TreatmentRunId, end: TreatmentEnd): Promise<unknown>
}>

function fieldsOf(at: CompanyScope, run: TreatmentRunId) {
  return { companyId: at.companyId, runId: run }
}

async function startFailed(
  line: StartLine,
  at: CompanyScope,
  run: TreatmentRunId,
  call: string,
  kind: string,
) {
  line.deps.log.error({ ...fieldsOf(at, run), call, answer: kind }, 'TREAT_START_FAILED')
  await line.close(at, run, { kind: 'START_FAILED' })
}

async function specOf(deps: TreatmentRunDeps, at: CompanyScope, run: TreatmentRunId) {
  return deps.database.read(at, async (tx) => {
    const [row] = await tx
      .select({ select: treatmentRun.select, attempt: treatmentRun.attempt })
      .from(treatmentRun)
      .where(and(eq(treatmentRun.id, run), isNull(treatmentRun.endedAt)))
    if (row === undefined) return 'CLOSED'
    const lake = await lakeOf(tx, at.companyId)
    if (lake === null) return null
    const models = await treatModelsOf(deps, tx, at.companyId)
    const names = new Set<string>(models.map((model) => model.name))
    const select = z.array(z.string()).parse(row.select)
    const { region, account } = lake.where
    const spec = TreatTaskSpec.safeParse({
      ...{ version: 1, runId: run, attempt: row.attempt, companyId: at.companyId },
      lake: {
        bucketArn: `arn:aws:s3tables:${region}:${account}:bucket/${bucketName(lake.lakeId)}`,
        region,
      },
      queueUrl: deps.copy.queueUrl,
      models,
      select: select.filter((name) => names.has(name)),
    })
    return { spec, attempt: row.attempt, where: lake.where, lakeId: lake.lakeId }
  })
}

async function kept(deps: TreatmentRunDeps, at: CompanyScope, run: TreatmentRunId, task: TaskArn) {
  try {
    const rows = await deps.database.command(at, (tx) =>
      tx
        .update(treatmentRun)
        .set({ task, state: 'RUNNING' })
        .where(and(eq(treatmentRun.id, run), isNull(treatmentRun.endedAt)))
        .returning({ id: treatmentRun.id }),
    )
    return rows.length === 0 ? 'CLOSED' : 'KEPT'
  } catch (error) {
    const failure = databaseFailure(error)
    if (failure.code !== 'DATABASE_UNAVAILABLE') throw failure
    deps.log.error(fieldsOf(at, run), 'TREAT_TASK_UNRECORDED')
    return 'UNRECORDED'
  }
}

/** A run closed during its start, by a stop or a sweep that found no task: the start stops its own. */
async function undone(
  line: StartLine,
  at: CompanyScope,
  run: TreatmentRunId,
  where: Where,
  task: TaskArn,
) {
  line.deps.log.info(fieldsOf(at, run), 'TREAT_START_UNDONE')
  const stopped = await tried(line.clock, () => line.deps.tasks.stop(where, task))
  if (stopped.kind !== 'DONE')
    line.deps.log.error({ ...fieldsOf(at, run), answer: stopped.kind }, 'TREAT_TASK_LEFT')
}

/** The start of an open run: its specification in the state bucket, then the copy's task with the treater's role. */
export async function startRun(
  line: StartLine,
  at: CompanyScope,
  run: TreatmentRunId,
): Promise<void> {
  const { deps, clock } = line
  const asked = await specOf(deps, at, run)
  if (asked === 'CLOSED') return
  if (asked === null) return startFailed(line, at, run, 'Spec', 'NO_LAKE')
  if (!asked.spec.success) return startFailed(line, at, run, 'Spec', 'NOTHING_SELECTED')
  const { where, attempt } = asked
  const key = treatSpecKey(at.companyId, run, attempt)
  const text = JSON.stringify(asked.spec.data)
  const put = await tried(clock, () => deps.tasks.putTreat(where, { key, spec: text }))
  if (put.kind !== 'DONE') return startFailed(line, at, run, 'PutObject', put.kind)
  deps.log.info({ ...fieldsOf(at, run), key }, 'TREATMENT_SPEC_WRITTEN')
  const role = treaterRoleArn(where.account, asked.lakeId)
  const token = `${run}-${attempt}`
  const task = await tried(clock, () =>
    deps.tasks.treat(where, { token, startedBy: run, role, object: { key }, machine: MACHINE }),
  )
  if (task.kind !== 'DONE') return startFailed(line, at, run, 'RunTask', task.kind)
  if ((await kept(deps, at, run, task.value)) === 'CLOSED')
    await undone(line, at, run, where, task.value)
}
