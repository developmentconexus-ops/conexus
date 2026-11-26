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
import type { CommandTx, Database, ReadTx, Scope } from '../../platform/database.ts'
import type { FailureLog, Scalar } from '../../platform/failure.ts'
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
  rounded: number
  rows: number | null
  whole: boolean
}>

/**
 * Who closes, for the log: the task's result, the ECS stop, the sweep, the start or the connection
 * leaving; `PERSON` whichever of them ends `INTERRUPTED` a round a person asked to stop.
 */
export type CloseCause = 'RESULT' | 'ECS_STOPPED' | 'SWEEP' | 'START' | 'LEAVE' | 'PERSON'

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

/** The connection's open round, which a person's stop and the leave end. */
export async function openRoundOf(tx: ReadTx, connection: ConnectionId) {
  const [open] = await tx
    .select({ id: lakeRun.id, taskArn: lakeRun.taskArn })
    .from(lakeRun)
    .where(and(eq(lakeRun.connectionId, connection), isNull(lakeRun.endedAt)))
  return open
}

/** The connection's round closed last, whose parameter the sweep and the leave delete again. */
export function lastClosedOf(tx: ReadTx, connection: ConnectionId) {
  return tx
    .select({ id: lakeRun.id })
    .from(lakeRun)
    .where(and(eq(lakeRun.connectionId, connection), isNotNull(lakeRun.endedAt)))
    .orderBy(desc(lakeRun.endedAt))
    .limit(1)
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

/** The winning close's counts on each table, and the connection's 100 newest rounds kept. */
async function counted(
  tx: CommandTx,
  a: Readonly<{
    at: CompanyScope
    connectionId: ConnectionId
    run: LakeRunId
    tables: readonly RunTableCounts[]
  }>,
) {
  for (const counts of a.tables) {
    const [table] = await tx
      .update(lakeTable)
      .set({
        rows: sql`coalesce(${counts.rows}::bigint, ${lakeTable.rows})`,
        lastRunId: a.run,
      })
      .where(and(eq(lakeTable.connectionId, a.connectionId), eq(lakeTable.name, counts.name)))
      .returning({ id: lakeTable.id, rows: lakeTable.rows })
    if (table === undefined) continue
    await tx.insert(lakeTableRun).values({
      runId: a.run,
      tableId: table.id,
      companyId: a.at.companyId,
      read: counts.read,
      written: counts.written,
      rows: table.rows ?? 0,
      whole: counts.whole,
    })
  }
  const kept = tx
    .select({ id: lakeRun.id })
    .from(lakeRun)
    .where(eq(lakeRun.connectionId, a.connectionId))
    .orderBy(desc(lakeRun.startedAt))
    .limit(RUNS_KEPT)
  await tx
    .delete(lakeRun)
    .where(
      and(
        eq(lakeRun.connectionId, a.connectionId),
        isNotNull(lakeRun.endedAt),
        notInArray(lakeRun.id, kept),
      ),
    )
}

/**
 * Where the round's parameter, which holds the source's credential open, stands after a close:
 * `NO_LAKE` when the company's lake row is gone, so the Hub has no AWS to reach.
 */
type ParameterEnd = 'DELETED' | 'LEFT' | 'NO_LAKE'

export type CloseAnswer = Readonly<{ kind: 'CLOSED' | 'ALREADY_CLOSED'; parameter: ParameterEnd }>

type ParameterDeps = Readonly<{ tasks: Pick<CopyTasks, 'deleteRun'>; log: FailureLog }>

export type RunFields = Record<string, Scalar> & { companyId: CompanyId; runId: LakeRunId }

/**
 * A stop takes the round's parameter, so its task may leave by itself before ECS stops it: the task
 * without a result is then the stop's doing, not a lost task.
 */
function endOfAsked(asked: boolean, end: RunEnd): RunEnd {
  const lost = end.kind === 'ERROR' && end.code === 'COPY_TASK_LOST'
  return asked && lost ? { kind: 'INTERRUPTED' } : end
}

/**
 * The one close of a round, for the queue, the sweep, the start, the stop and the leave: who locks
 * the row while it is still open closes it, and only they write the counts, keep the 100 newest
 * rounds and log `COPY_RUN_ENDED`. Every close, the second too, deletes the round's parameter, so a
 * repeat ends a delete AWS did not answer.
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
): Promise<CloseAnswer> {
  const closed = await deps.database.command(at, async (tx) => {
    const [row] = await tx
      .select({ connectionId: lakeRun.connectionId, stoppedBy: lakeRun.stoppedBy })
      .from(lakeRun)
      .where(and(eq(lakeRun.id, close.run), isNull(lakeRun.endedAt)))
      .for('update')
    if (row === undefined) return { won: null, lake: await lakeOf(tx, at.companyId) }
    const by = row.stoppedBy
    const end = endOfAsked(by !== null, close.end)
    await tx
      .update(lakeRun)
      .set({
        endedAt: sql`statement_timestamp()`,
        ...columnsOf(end),
        ...machineColumns(close.machine ?? null),
      })
      .where(eq(lakeRun.id, close.run))
    const connectionId = ConnectionIdSchema.parse(row.connectionId)
    await counted(tx, { at, connectionId, run: close.run, tables: close.tables })
    return { won: { connectionId, end, by }, lake: await lakeOf(tx, at.companyId) }
  })
  const of = { companyId: at.companyId, runId: close.run }
  if (closed.won === null) {
    const parameter = await parameterGone(deps, closed.lake, of)
    return { kind: 'ALREADY_CLOSED', parameter }
  }
  deps.watch?.ended(close.run)
  const { connectionId, end, by } = closed.won
  const fields = { ...of, connectionId, cause: close.cause }
  const parameter = await parameterGone(deps, closed.lake, fields)
  deps.log.info(
    {
      ...fields,
      ...(by === null ? {} : { asked: true, by }),
      outcome: end.kind,
      ...(end.kind === 'ERROR' ? { code: end.code } : {}),
      tables: close.tables.length,
      read: close.tables.reduce((sum, table) => sum + table.read, 0),
      written: close.tables.reduce((sum, table) => sum + table.written, 0),
      rounded: close.tables.reduce((sum, table) => sum + table.rounded, 0),
    },
    'COPY_RUN_ENDED',
  )
  return { kind: 'CLOSED', parameter }
}

function parameterGone(
  deps: ParameterDeps,
  lake: Awaited<ReturnType<typeof lakeOf>>,
  fields: RunFields,
): Promise<ParameterEnd> {
  if (lake === null) return Promise.resolve('NO_LAKE')
  return deleteParameter(deps, lake.where, fields)
}

/** A round's parameter deleted; one AWS does not have counts as deleted (`aws-copy.ts`). */
export async function deleteParameter(
  deps: ParameterDeps,
  where: Where,
  fields: RunFields,
): Promise<'DELETED' | 'LEFT'> {
  const name = RunParameter.parse(runParameterName(fields.companyId, fields.runId))
  const deleted = await deps.tasks.deleteRun(where, name)
  if (deleted.kind === 'DONE') return 'DELETED'
  deps.log.error(
    {
      ...fields,
      answer: deleted.kind,
      ...(deleted.kind === 'REFUSED' ? { code: deleted.code } : {}),
    },
    'COPY_PARAMETER_LEFT',
  )
  return 'LEFT'
}
