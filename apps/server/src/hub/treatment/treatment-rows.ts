import { randomUUID } from 'node:crypto'
import type { CompanyId, TableRef } from '@conexus/hub-api'
import { LakeTableName, TreatmentRunId } from '@conexus/hub-api'
import { and, desc, eq, isNotNull, isNull, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { LakeId } from '../../platform/aws.ts'
import type { CommandTx, Database, ReadTx } from '../../platform/database.ts'
import { companiesWithConnections } from '../connectors/public.ts'
import { companyScope } from '../copies/public.ts'
import type { TreatmentReads } from './models.ts'
import { treatModelsOf, treatmentLakeOf } from './models.ts'
import type { LastStatus } from './select.ts'
import { selection } from './select.ts'
import { treatmentModel, treatmentModelRun, treatmentRun, treatmentVersion } from './tables.ts'
import type { TreatTaskResult } from './treat-task.ts'
import { ModelName, modelNameOf } from './treat-task.ts'

type AfterCopy = (
  companyId: CompanyId,
  copied: readonly LakeTableName[],
) => Promise<
  | Readonly<{ kind: 'OPENED'; run: TreatmentRunId }>
  | Readonly<{ kind: 'COALESCED'; run: TreatmentRunId }>
  | Readonly<{ kind: 'NOTHING_TO_TREAT' }>
  | Readonly<{ kind: 'LAKE_OUTDATED' }>
>

export type OpenAnswer =
  | Awaited<ReturnType<AfterCopy>>
  | Readonly<{ kind: 'ALREADY_RUNNING'; run: TreatmentRunId }>

/** How a run ends: its task's result, its task gone without one, its start failed, or a stop with no task. */
export type TreatmentEnd =
  | Readonly<{ kind: 'RESULT'; result: TreatTaskResult }>
  | Readonly<{ kind: 'LOST'; cause: 'ECS_STOPPED' | 'SWEEP' }>
  | Readonly<{ kind: 'START_FAILED' }>
  | Readonly<{ kind: 'PERSON' }>

type Closed = Readonly<{
  state: 'DONE' | 'FAILED' | 'STOPPED'
  failure: (typeof treatmentRun.$inferSelect)['failure']
}>

const Pending = z.array(z.object({ layer: z.literal('current'), table: LakeTableName }))

async function lastOf(tx: ReadTx, lakeId: LakeId): Promise<LastStatus> {
  const found = await tx.execute(sql`
    select distinct on (chosen.name) chosen.name, coalesce(model.status, 'FAILED') as status
    from ${treatmentRun} run
    cross join lateral jsonb_array_elements_text(run."select") as chosen(name)
    left join ${treatmentModelRun} model on model.run_id = run.id and model.name = chosen.name
    where run.lake_id = ${lakeId} and run.ended_at is not null
    order by chosen.name, run.started_at desc`)
  const Row = z.object({ name: ModelName, status: z.enum(['BUILT', 'FAILED', 'SKIPPED']) })
  return new Map(found.rows.map((row) => Row.parse(row)).map((row) => [row.name, row.status]))
}

/** What a run of the company asks for now: every model, or those `selection` takes for the changed tables. */
async function selectOf(
  deps: TreatmentReads,
  tx: ReadTx,
  companyId: CompanyId,
  changed: readonly TableRef[] | 'ALL',
) {
  const lake = await treatmentLakeOf(deps, tx, companyId)
  if (lake.state !== 'CURRENT' || lake.lakeId === null) return null
  const models = await treatModelsOf(deps, tx, companyId)
  const select =
    changed === 'ALL'
      ? models.map((model) => model.name)
      : selection(models, changed, await lastOf(tx, lake.lakeId))
  return { lakeId: lake.lakeId, select }
}

async function inserted(
  tx: CommandTx,
  row: Readonly<{ companyId: CompanyId; lakeId: LakeId; cause: 'COPY' | 'NOW'; select: unknown }>,
) {
  const run = TreatmentRunId.parse(randomUUID())
  const [opened] = await tx
    .insert(treatmentRun)
    .values({ ...row, id: run, state: 'STARTING', attempt: 1, startedAt: sql`now()` })
    .onConflictDoNothing({ target: treatmentRun.companyId, where: sql.raw('ended_at is null') })
    .returning({ id: treatmentRun.id })
  return opened === undefined ? null : run
}

/** The changed tables added to the open run's `pending`, once each; null when no run is open. */
async function coalesced(tx: CommandTx, companyId: CompanyId, changed: readonly TableRef[]) {
  const [open] = await tx
    .update(treatmentRun)
    .set({
      pending: sql`(select coalesce(jsonb_agg(distinct table_ref), '[]'::jsonb)
        from jsonb_array_elements(${treatmentRun.pending} || ${JSON.stringify(changed)}::jsonb) table_ref)`,
    })
    .where(and(eq(treatmentRun.companyId, companyId), isNull(treatmentRun.endedAt)))
    .returning({ id: treatmentRun.id })
  return open === undefined ? null : TreatmentRunId.parse(open.id)
}

function closedOf(end: TreatmentEnd, stoppedBy: string | null): Closed {
  if (end.kind === 'RESULT') {
    const { outcome } = end.result
    return outcome.kind === 'COMPLETE'
      ? { state: 'DONE', failure: null }
      : { state: 'FAILED', failure: outcome.code }
  }
  if (stoppedBy !== null || end.kind === 'PERSON') return { state: 'STOPPED', failure: null }
  if (end.kind === 'START_FAILED') return { state: 'FAILED', failure: 'TREAT_START_FAILED' }
  return { state: 'FAILED', failure: 'TREAT_TASK_STOPPED' }
}

/** Each business model's version the run built: the highest approved, as the spec read it. */
async function activeVersions(tx: ReadTx) {
  const rows = await tx
    .select({ name: treatmentModel.name, id: treatmentVersion.id })
    .from(treatmentVersion)
    .innerJoin(treatmentModel, eq(treatmentModel.id, treatmentVersion.modelId))
    .where(isNotNull(treatmentVersion.approvedAt))
    .orderBy(desc(treatmentVersion.number))
  const active = new Map<string, string>()
  for (const row of rows) {
    const name = modelNameOf('negocio', row.name)
    if (!active.has(name)) active.set(name, row.id)
  }
  return active
}

async function modelRunsWritten(
  tx: CommandTx,
  a: Readonly<{ companyId: CompanyId; run: TreatmentRunId; result: TreatTaskResult }>,
) {
  if (a.result.models.length === 0) return
  const versions = await activeVersions(tx)
  await tx.insert(treatmentModelRun).values(
    a.result.models.map((model) => ({
      runId: a.run,
      companyId: a.companyId,
      name: model.name,
      versionId: versions.get(model.name) ?? null,
      status: model.status,
      rows: model.status === 'BUILT' ? model.rows : null,
      failure: model.status === 'FAILED' ? model.failure : null,
      line: model.status === 'FAILED' ? model.line : null,
    })),
  )
}

export type OpenCause = 'COPY' | 'NOW'
export type OpenAsk =
  | Readonly<{ cause: 'COPY'; changed: readonly TableRef[] }>
  | Readonly<{ cause: 'NOW' }>

/** The run this ask joins when another is open: Tratar agora only names it; a copy adds its tables. */
async function joined(
  tx: CommandTx,
  companyId: CompanyId,
  ask: OpenAsk,
): Promise<OpenAnswer | null> {
  if (ask.cause === 'COPY') {
    const into = await coalesced(tx, companyId, ask.changed)
    return into === null ? null : { kind: 'COALESCED', run: into }
  }
  const [open] = await tx
    .select({ id: treatmentRun.id })
    .from(treatmentRun)
    .where(isNull(treatmentRun.endedAt))
  return open === undefined ? null : { kind: 'ALREADY_RUNNING', run: TreatmentRunId.parse(open.id) }
}

/** One try at opening: null when the open run closed between the insert and the join. */
export async function openIn(
  deps: TreatmentReads,
  tx: CommandTx,
  companyId: CompanyId,
  ask: OpenAsk,
): Promise<OpenAnswer | null> {
  const chosen = await selectOf(deps, tx, companyId, ask.cause === 'NOW' ? 'ALL' : ask.changed)
  if (chosen === null) return { kind: 'LAKE_OUTDATED' }
  if (chosen.select.length === 0) return { kind: 'NOTHING_TO_TREAT' }
  const row = { companyId, lakeId: chosen.lakeId, cause: ask.cause, select: chosen.select }
  const run = await inserted(tx, row)
  return run === null ? joined(tx, companyId, ask) : { kind: 'OPENED', run }
}

/** The run a close opens by the tables copied while it ran, in the close's transaction (F14). */
async function nextOf(
  deps: TreatmentReads,
  tx: CommandTx,
  companyId: CompanyId,
  pending: unknown,
): Promise<TreatmentRunId | null> {
  const changed = Pending.parse(pending)
  if (changed.length === 0) return null
  const chosen = await selectOf(deps, tx, companyId, changed)
  if (chosen === null || chosen.select.length === 0) return null
  return inserted(tx, { companyId, lakeId: chosen.lakeId, cause: 'COPY', select: chosen.select })
}

/**
 * The one close of a run: who locks the row while it is still open writes the end, each model's
 * status and the next run by `pending`, in one transaction; null when it was closed already. The
 * `UPDATE` repeats the open condition, so a lock that failed would still close the run once.
 */
export async function closedIn(
  deps: TreatmentReads,
  tx: CommandTx,
  a: Readonly<{ companyId: CompanyId; run: TreatmentRunId; end: TreatmentEnd }>,
) {
  const { companyId, run, end } = a
  const [row] = await tx
    .select({
      attempt: treatmentRun.attempt,
      stoppedBy: treatmentRun.stoppedBy,
      pending: treatmentRun.pending,
    })
    .from(treatmentRun)
    .where(and(eq(treatmentRun.id, run), isNull(treatmentRun.endedAt)))
    .for('update')
  if (row === undefined) return null
  if (end.kind === 'RESULT' && end.result.attempt !== row.attempt) return null
  const state = closedOf(end, row.stoppedBy)
  const ended = await tx
    .update(treatmentRun)
    .set({ ...state, endedAt: sql`now()` })
    .where(and(eq(treatmentRun.id, run), isNull(treatmentRun.endedAt)))
    .returning({ id: treatmentRun.id })
  if (ended.length === 0) return null
  if (end.kind === 'RESULT') await modelRunsWritten(tx, { companyId, run, result: end.result })
  const next = state.state === 'STOPPED' ? null : await nextOf(deps, tx, companyId, row.pending)
  return { state, next }
}

/** Every open run, by company: the queue consumer's round on the Hub's start. */
export async function openRunsOf(database: Database): Promise<ReadonlyMap<string, CompanyId>> {
  const found = new Map<string, CompanyId>()
  for (const companyId of await companiesWithConnections(database)) {
    const rows = await database.read(companyScope(companyId), (tx) =>
      tx.select({ id: treatmentRun.id }).from(treatmentRun).where(isNull(treatmentRun.endedAt)),
    )
    for (const row of rows) found.set(row.id, companyId)
  }
  return found
}

export async function companyOfRun(database: Database, run: string) {
  const parsed = TreatmentRunId.safeParse(run)
  if (!parsed.success) return undefined
  for (const companyId of await companiesWithConnections(database)) {
    const [row] = await database.read(companyScope(companyId), (tx) =>
      tx.select({ id: treatmentRun.id }).from(treatmentRun).where(eq(treatmentRun.id, parsed.data)),
    )
    if (row !== undefined) return companyId
  }
  return undefined
}
