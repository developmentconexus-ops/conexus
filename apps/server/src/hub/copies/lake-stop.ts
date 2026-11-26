import type { CompanyId, ConnectionId, PersonId, StopLakeCopyRunAnswer } from '@conexus/hub-api'
import { LakeRunId } from '@conexus/hub-api'
import { and, eq, isNull, sql } from 'drizzle-orm'
import type { AwsAnswer, Where } from '../../platform/aws.ts'
import { RunParameter, runParameterName, TaskArn } from '../../platform/aws.ts'
import { companyScope, lakeOf, openRoundOf } from './lake-close.ts'
import type { LakeCopyDeps } from './lake-copy.ts'
import { awsDown } from './lake-copy.ts'
import { lakeRun } from './tables.ts'

type Of = Readonly<{ companyId: CompanyId; connectionId: ConnectionId }>

/** The round's parameter deleted, so its writer, which reads it before each batch, writes no more. */
export async function silenceWriter(deps: LakeCopyDeps, at: Of, where: Where, run: LakeRunId) {
  const parameter = RunParameter.parse(runParameterName(at.companyId, run))
  const deleted = await deps.tasks.deleteRun(where, parameter)
  if (deleted.kind !== 'DONE') return awsDown(deps.log, at, 'DeleteParameter', deleted)
}

export async function requestTaskStop(
  deps: LakeCopyDeps,
  at: Of,
  where: Where,
  run: LakeRunId,
  taskArn: string | null,
): Promise<TaskArn | null> {
  const task: AwsAnswer<TaskArn | null> =
    taskArn === null
      ? await deps.tasks.find(where, run)
      : { kind: 'DONE', value: TaskArn.parse(taskArn) }
  if (task.kind !== 'DONE') return awsDown(deps.log, at, 'ListTasks', task)
  if (task.value === null) return null
  const stopped = await deps.tasks.stop(where, task.value)
  if (stopped.kind !== 'DONE') return awsDown(deps.log, at, 'StopTask', stopped)
  return task.value
}

/** With no task to stop, the round ends here, and a start still on its way undoes its own task. */
export function createLakeStop(deps: LakeCopyDeps) {
  return async function stop(at: Of, by: PersonId): Promise<StopLakeCopyRunAnswer> {
    const scope = companyScope(at.companyId)
    const { open, lake } = await deps.database.read(scope, async (tx) => ({
      open: await openRoundOf(tx, at.connectionId),
      lake: await lakeOf(tx, at.companyId),
    }))
    if (open === undefined) return { stopping: false }
    const run = LakeRunId.parse(open.id)
    if (lake !== null) await silenceWriter(deps, at, lake.where, run)
    const [asked] = await deps.database.command(scope, (tx) =>
      tx
        .update(lakeRun)
        .set({ stoppedBy: sql`coalesce(${lakeRun.stoppedBy}, ${by})` })
        .where(and(eq(lakeRun.id, run), isNull(lakeRun.endedAt)))
        .returning({ taskArn: lakeRun.taskArn }),
    )
    if (asked === undefined) return { stopping: false }
    deps.log.info({ by, ...at, runId: run }, 'LAKE_COPY_STOP_ASKED')
    const task =
      lake === null ? null : await requestTaskStop(deps, at, lake.where, run, asked.taskArn)
    if (task === null)
      await deps.runs.closeLakeRun(scope, {
        run,
        end: { kind: 'INTERRUPTED' },
        tables: [],
        cause: 'PERSON',
      })
    return { stopping: true }
  }
}
