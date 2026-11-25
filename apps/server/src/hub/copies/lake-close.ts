import type {
  CompanyId,
  ConnectionId,
  LakeRunFailureCode,
  LakeRunId,
  LakeRunMachine,
  LakeTableName,
  SystemMessage,
} from '@conexus/hub-api'
import { ConnectionId as ConnectionIdSchema } from '@conexus/hub-api'
import { and, desc, eq, isNotNull, isNull, notInArray, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { CopyTasks, Where } from '../../platform/aws.ts'
import { LakeId, RunParameter, runParameterName } from '../../platform/aws.ts'
import { AwsAccount, AwsRegion } from '../../platform/config-aws.ts'
import type { Database, ReadTx, Scope } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { lakeRun, lakeTable, lakeTableRun } from './tables.ts'

/** The Hub's own work on one company: its login, no person (data D20). */
export type CompanyScope = Extract<Scope, { kind: 'COMPANY' }>

export function companyScope(companyId: CompanyId): CompanyScope {
  return { kind: 'COMPANY', companyId, personId: null }
}

const RUNS_KEPT = 100

/**
 * How long a round whose task exited waits for its result before it is lost: exit 0 comes only
 * after the result was sent, but a standard queue may hand the stop first. It covers the result's
 * own redeliveries (three at the queue's 30 s visibility, `infra/aws/lib/copy.ts`) and the 64 s
 * delay the end-on-AWS study measured, with room. The consumer counts it from the stop it reads;
 * the sweep, from ECS's `stoppedAt`.
 */
export const RESULT_GRACE_MS = 5 * 60_000

export type RunEnd =
  | Readonly<{ kind: 'COMPLETE' }>
  | Readonly<{
      kind: 'ERROR'
      code: LakeRunFailureCode
      table: LakeTableName | null
      system: SystemMessage | null
    }>
  | Readonly<{ kind: 'INTERRUPTED' }>

/** One table's counts in a round, as the task's result carries them. */
export type RunTableCounts = Readonly<{
  name: LakeTableName
  read: number
  written: number
  rows: number | null
  whole: boolean
}>

/** Who closes, for the log: the task's result, the ECS stop, the sweep, the start, or the connection leaving. */
export type CloseCause = 'RESULT' | 'ECS_STOPPED' | 'SWEEP' | 'START' | 'LEAVE'

const LakeRow = z.object({
  lake_id: LakeId,
  state: z.string(),
  account: AwsAccount,
  region: AwsRegion,
})

/** The company's lake as the company's login reads it (decision H): where to reach AWS, and whether it is ready. */
export async function lakeOf(tx: ReadTx, companyId: CompanyId) {
  const found = await tx.execute(
    sql`select lake_id, state, account, region from lake.company_lake where company_id = ${companyId}`,
  )
  const [row] = found.rows
  if (row === undefined) return null
  const lake = LakeRow.parse(row)
  const where: Where = { company: companyId, account: lake.account, region: lake.region }
  return { where, lakeId: lake.lake_id, ready: lake.state === 'ready' }
}

function machineColumns(machine: LakeRunMachine | null) {
  return {
    cpuAllocated: machine?.allocated.vcpu ?? null,
    memoryAllocatedMib: machine?.allocated.memoryMib ?? null,
    cpuPeak: machine?.peak.vcpu ?? null,
    memoryPeakMib: machine?.peak.memoryMib ?? null,
    machineSamples:
      machine === null ? null : { everySeconds: machine.everySeconds, samples: machine.samples },
  }
}

function columnsOf(end: RunEnd) {
  if (end.kind !== 'ERROR') return { outcome: end.kind, code: null }
  return {
    outcome: end.kind,
    code: end.code,
    failedTable: end.table,
    systemStatus: end.system?.status ?? null,
    systemCode: end.system?.code ?? null,
    systemMessage: end.system?.message ?? null,
  }
}

export type CloseDeps = {
  database: Database
  tasks: CopyTasks
  log: FailureLog
  /** The queue's consumer, told of each round closed (`lake-queue.ts`). */
  watch?: Readonly<{ ended(run: LakeRunId): void }>
}

/**
 * The one close of a round, for the queue, the sweep and a start that failed: the `UPDATE ... WHERE
 * ended_at IS NULL RETURNING` decides who closes, and only who gets the row writes the counts,
 * keeps the 100 newest rounds, deletes the round's parameter and logs `COPY_RUN_ENDED`. A second
 * close changes nothing.
 */
export async function closeLakeRun(
  deps: CloseDeps,
  at: CompanyScope,
  close: Readonly<{
    run: LakeRunId
    end: RunEnd
    tables: readonly RunTableCounts[]
    cause: CloseCause
    /** What the task measured of its machine, from its result; written by the close that wins. */
    machine?: LakeRunMachine | null
  }>,
): Promise<'CLOSED' | 'ALREADY_CLOSED'> {
  const closed = await deps.database.command(at, async (tx) => {
    const [row] = await tx
      .update(lakeRun)
      .set({
        endedAt: sql`statement_timestamp()`,
        ...columnsOf(close.end),
        ...machineColumns(close.machine ?? null),
      })
      .where(and(eq(lakeRun.id, close.run), isNull(lakeRun.endedAt)))
      .returning({ connectionId: lakeRun.connectionId })
    if (row === undefined) return null
    const connectionId = ConnectionIdSchema.parse(row.connectionId)
    for (const counts of close.tables) {
      const [table] = await tx
        .update(lakeTable)
        .set({
          rows: sql`coalesce(${counts.rows}::bigint, ${lakeTable.rows})`,
          lastRunId: close.run,
        })
        .where(and(eq(lakeTable.connectionId, connectionId), eq(lakeTable.name, counts.name)))
        .returning({ id: lakeTable.id, rows: lakeTable.rows })
      if (table === undefined) continue
      await tx.insert(lakeTableRun).values({
        runId: close.run,
        tableId: table.id,
        companyId: at.companyId,
        read: counts.read,
        written: counts.written,
        rows: table.rows ?? 0,
        whole: counts.whole,
      })
    }
    const kept = tx
      .select({ id: lakeRun.id })
      .from(lakeRun)
      .where(eq(lakeRun.connectionId, connectionId))
      .orderBy(desc(lakeRun.startedAt))
      .limit(RUNS_KEPT)
    await tx
      .delete(lakeRun)
      .where(
        and(
          eq(lakeRun.connectionId, connectionId),
          isNotNull(lakeRun.endedAt),
          notInArray(lakeRun.id, kept),
        ),
      )
    return { connectionId, lake: await lakeOf(tx, at.companyId) }
  })
  if (closed === null) return 'ALREADY_CLOSED'
  deps.watch?.ended(close.run)
  const { connectionId } = closed
  const fields = { companyId: at.companyId, connectionId, runId: close.run, cause: close.cause }
  if (closed.lake !== null) await deleteParameter(deps, closed.lake.where, fields)
  deps.log.info(
    {
      ...fields,
      outcome: close.end.kind,
      ...(close.end.kind === 'ERROR' ? { code: close.end.code } : {}),
      tables: close.tables.length,
      read: close.tables.reduce((sum, table) => sum + table.read, 0),
      written: close.tables.reduce((sum, table) => sum + table.written, 0),
    },
    'COPY_RUN_ENDED',
  )
  return 'CLOSED'
}

async function deleteParameter(
  deps: CloseDeps,
  where: Where,
  fields: { companyId: CompanyId; connectionId: ConnectionId; runId: LakeRunId },
) {
  const name = RunParameter.parse(runParameterName(fields.companyId, fields.runId))
  const deleted = await deps.tasks.deleteRun(where, name)
  if (deleted.kind === 'DONE') return
  deps.log.error(
    {
      ...fields,
      answer: deleted.kind,
      ...(deleted.kind === 'REFUSED' ? { code: deleted.code } : {}),
    },
    'COPY_PARAMETER_LEFT',
  )
}
