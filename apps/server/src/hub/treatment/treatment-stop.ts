import type { PersonId, StopTreatmentRunAnswer } from '@conexus/hub-api'
import { TreatmentRunId } from '@conexus/hub-api'
import { and, eq, isNull, sql } from 'drizzle-orm'
import type { CopyTasks } from '../../platform/aws.ts'
import type { Database } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import type { CompanyScope } from '../copies/public.ts'
import { lakeOf, requestTaskStop } from '../copies/public.ts'
import { treatmentRun } from './tables.ts'
import type { TreatmentRuns } from './treatment-run.ts'

export type TreatmentStopDeps = Readonly<{
  database: Database
  tasks: Pick<CopyTasks, 'find' | 'stop'>
  log: FailureLog
  runs: Pick<TreatmentRuns, 'close'>
}>

/**
 * The copy's stop (`lake-stop.ts`) for the company's open treatment run: who asks first stays in
 * `stopped_by`, the task is asked to stop and the answer does not wait for it. With no task to
 * stop, the run ends here, and a start still on its way undoes its own task (decision F14).
 */
export async function stopTreatment(
  deps: TreatmentStopDeps,
  at: CompanyScope,
  by: PersonId,
): Promise<StopTreatmentRunAnswer> {
  const [asked] = await deps.database.command(at, (tx) =>
    tx
      .update(treatmentRun)
      .set({ stoppedBy: sql`coalesce(${treatmentRun.stoppedBy}, ${by})` })
      .where(and(eq(treatmentRun.companyId, at.companyId), isNull(treatmentRun.endedAt)))
      .returning({ id: treatmentRun.id, task: treatmentRun.task }),
  )
  if (asked === undefined) return { stopping: false }
  const run = TreatmentRunId.parse(asked.id)
  deps.log.info({ by, companyId: at.companyId, runId: run }, 'TREATMENT_STOP_ASKED')
  const lake = await deps.database.read(at, (tx) => lakeOf(tx, at.companyId))
  const task =
    lake === null
      ? null
      : await requestTaskStop(deps, { companyId: at.companyId }, lake.where, run, asked.task)
  if (task === null) await deps.runs.close(at, run, { kind: 'PERSON' })
  return { stopping: true }
}
