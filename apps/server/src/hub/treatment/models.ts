import type { CompanyId, LakeTableName, TreatedTables, TreatmentModelId } from '@conexus/hub-api'
import {
  ModelRunView,
  PAGE_SIZE,
  RunView,
  TableRef,
  TreatmentModel,
  VersionView,
} from '@conexus/hub-api'
import { and, asc, desc, eq, getTableColumns, inArray, ne } from 'drizzle-orm'
import type { LakeId } from '../../platform/aws.ts'
import type { CommandTx, ReadTx } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import type { CopySource } from '../connectors/public.ts'
import { lakeOf, markedTablesOf } from '../copies/public.ts'
import { personNameColumn } from '../identity/public.ts'
import { treatmentModel, treatmentModelRun, treatmentRun, treatmentVersion } from './tables.ts'
import { modelNameOf, TreatModel } from './treat-task.ts'

export type TreatmentReads = Readonly<{
  source: CopySource
  /** The recipes whose lakes have the treatment's areas (card F15). */
  treatable: ReadonlySet<string>
}>

const VERSION_COLUMNS = {
  ...getTableColumns(treatmentVersion),
  proposedByName: personNameColumn(treatmentVersion.proposedBy),
  approvedByName: personNameColumn(treatmentVersion.approvedBy),
}

type VersionRow = typeof treatmentVersion.$inferSelect &
  Readonly<{ proposedByName: string | null; approvedByName: string | null }>

function versionViewOf(row: VersionRow): VersionView {
  return VersionView.parse({
    ...row,
    proposedBy: row.proposedByName,
    proposedAt: row.proposedAt.toISOString(),
    approvedBy: row.approvedByName,
    approvedAt: row.approvedAt?.toISOString() ?? null,
  })
}

async function businessModelsOf(tx: ReadTx) {
  const models = await tx.select().from(treatmentModel).orderBy(asc(treatmentModel.name))
  const rows = await tx
    .select(VERSION_COLUMNS)
    .from(treatmentVersion)
    .orderBy(desc(treatmentVersion.number))
  return models.map((model) => {
    const versions = rows.filter((row) => row.modelId === model.id).map(versionViewOf)
    const [newest] = versions
    return {
      ...TreatmentModel.pick({ id: true, name: true, description: true }).parse(model),
      versions,
      active: versions.find((version) => version.approvedAt !== null) ?? null,
      proposal: newest !== undefined && newest.approvedAt === null ? newest : null,
    }
  })
}

export async function businessModelOf(tx: ReadTx, modelId: TreatmentModelId) {
  const model = (await businessModelsOf(tx)).find((each) => each.id === modelId)
  if (model === undefined) throw new Failure('NOT_FOUND', { details: { reason: 'MODEL' } })
  return model
}

export async function versionOf(tx: ReadTx, modelId: TreatmentModelId, number: number) {
  const model = await businessModelOf(tx, modelId)
  const version = model.versions.find((each) => each.number === number)
  if (version === undefined) throw new Failure('NOT_FOUND', { details: { reason: 'MODEL' } })
  return version
}

async function markedAndTemplatesOf(reads: TreatmentReads, tx: ReadTx, companyId: CompanyId) {
  const marked = await markedTablesOf(tx)
  const treatedOf = await reads.source.treatedLookup(tx, companyId)
  const templates = marked
    .toSorted((a, b) => a.name.localeCompare(b.name))
    .flatMap((table) => {
      const treated = treatedOf(table)
      return treated === null ? [] : [{ ...table, treated }]
    })
  return { marked, templates }
}

function refOf(layer: TableRef['layer'], table: LakeTableName) {
  return `${layer}.${table}`
}

export async function treatModelsOf(
  reads: TreatmentReads,
  tx: ReadTx,
  companyId: CompanyId,
): Promise<(TreatModel & Readonly<{ inputs: readonly TableRef[] }>)[]> {
  const { templates } = await markedAndTemplatesOf(reads, tx, companyId)
  const business = await businessModelsOf(tx)
  const defined = [
    ...templates.map(({ name, treated }) => ({
      layer: 'tratado' as const,
      table: name,
      sql: treated.select(name),
      inputs: [TableRef.parse({ layer: 'current', table: name })],
    })),
    ...business.flatMap(({ name, active }) =>
      active === null
        ? []
        : [{ layer: 'negocio' as const, table: name, sql: active.sql, inputs: active.inputs }],
    ),
  ]
  const built = new Set(defined.map(({ layer, table }) => modelNameOf(layer, table)))
  return defined.map(({ inputs, ...model }) => ({
    ...TreatModel.parse({
      ...model,
      name: modelNameOf(model.layer, model.table),
      after: inputs
        .map(({ layer, table }) => modelNameOf(layer, table))
        .filter((name) => built.has(name)),
    }),
    inputs,
  }))
}

function readsItself(name: LakeTableName, reads: ReadonlyMap<string, readonly TableRef[]>) {
  const seen = new Set<string>()
  const next = [...(reads.get(name) ?? [])]
  for (let input = next.pop(); input !== undefined; input = next.pop()) {
    if (input.layer !== 'negocio') continue
    if (input.table === name) return true
    if (seen.has(input.table)) continue
    seen.add(input.table)
    next.push(...(reads.get(input.table) ?? []))
  }
  return false
}

export async function checkInputs(
  reads: TreatmentReads,
  tx: ReadTx,
  companyId: CompanyId,
  { name, inputs }: Readonly<{ name: LakeTableName; inputs: readonly TableRef[] }>,
): Promise<void> {
  const { marked, templates } = await markedAndTemplatesOf(reads, tx, companyId)
  const business = await businessModelsOf(tx)
  const known = new Set([
    ...marked.map((table) => refOf('current', table.name)),
    ...templates.map((table) => refOf('tratado', table.name)),
    ...business.map((model) => refOf('negocio', model.name)),
    refOf('negocio', name),
  ])
  const unknown = inputs.find(({ layer, table }) => !known.has(refOf(layer, table)))
  if (unknown !== undefined) {
    const table = refOf(unknown.layer, unknown.table)
    throw new Failure('TREATMENT_INPUT_UNKNOWN', { named: { table } })
  }
  const graph = new Map(
    business.map((model) => {
      const versions = [model.active, model.proposal]
      return [model.name, versions.flatMap((version) => version?.inputs ?? [])]
    }),
  )
  graph.set(name, [...(graph.get(name) ?? []), ...inputs])
  if (readsItself(name, graph)) {
    const table = refOf('negocio', name)
    throw new Failure('TREATMENT_INPUT_CYCLE', { named: { table } })
  }
}

export async function treatmentLakeOf(
  reads: TreatmentReads,
  tx: ReadTx,
  companyId: CompanyId,
): Promise<Readonly<{ state: TreatedTables['lake']; lakeId: LakeId | null }>> {
  const lake = await lakeOf(tx, companyId)
  if (lake === null) return { state: 'NONE', lakeId: null }
  if (!reads.treatable.has(lake.template)) return { state: 'OUTDATED', lakeId: lake.lakeId }
  return { state: lake.ready ? 'CURRENT' : 'NONE', lakeId: lake.lakeId }
}

const RUN_COLUMNS = { ...getTableColumns(treatmentModelRun), at: treatmentRun.endedAt }

/** The last run of each of the models in the lake that wrote or failed: a skipped model keeps its table, and the rows of its last good run. */
async function lastModelRunsOf(tx: ReadTx, lakeId: LakeId | null, names: readonly string[]) {
  if (lakeId === null || names.length === 0) return []
  return tx
    .selectDistinctOn([treatmentModelRun.name], RUN_COLUMNS)
    .from(treatmentModelRun)
    .innerJoin(treatmentRun, eq(treatmentRun.id, treatmentModelRun.runId))
    .where(
      and(
        eq(treatmentRun.lakeId, lakeId),
        inArray(treatmentModelRun.name, [...names]),
        ne(treatmentModelRun.status, 'SKIPPED'),
      ),
    )
    .orderBy(treatmentModelRun.name, desc(treatmentRun.startedAt))
}

/** One model's newest page of runs in the lake. */
async function modelRunsOf(tx: ReadTx, lakeId: LakeId | null, name: string) {
  if (lakeId === null) return []
  return tx
    .select(RUN_COLUMNS)
    .from(treatmentModelRun)
    .innerJoin(treatmentRun, eq(treatmentRun.id, treatmentModelRun.runId))
    .where(and(eq(treatmentRun.lakeId, lakeId), eq(treatmentModelRun.name, name)))
    .orderBy(desc(treatmentRun.startedAt))
    .limit(PAGE_SIZE)
}

type ModelRunRow = Awaited<ReturnType<typeof modelRunsOf>>[number]

function modelRunViewOf(row: ModelRunRow): ModelRunView {
  return ModelRunView.parse({ ...row, at: row.at?.toISOString() })
}

async function lastRunOf(tx: ReadTx, lakeId: LakeId | null): Promise<RunView | null> {
  if (lakeId === null) return null
  const [row] = await tx
    .select({
      ...getTableColumns(treatmentRun),
      stoppedByName: personNameColumn(treatmentRun.stoppedBy),
    })
    .from(treatmentRun)
    .where(eq(treatmentRun.lakeId, lakeId))
    .orderBy(desc(treatmentRun.startedAt))
    .limit(1)
  if (row === undefined) return null
  return RunView.parse({
    state: row.state,
    since: row.startedAt.toISOString(),
    stopping: row.stoppedBy !== null,
    at: row.endedAt?.toISOString(),
    failure: row.failure,
    stoppedBy: row.stoppedByName === null ? null : { name: row.stoppedByName },
  })
}

export async function treatedTablesOf(
  reads: TreatmentReads,
  tx: ReadTx,
  companyId: CompanyId,
): Promise<TreatedTables> {
  const lake = await treatmentLakeOf(reads, tx, companyId)
  const { templates } = await markedAndTemplatesOf(reads, tx, companyId)
  const business = await businessModelsOf(tx)
  const names = [
    ...templates.map((table) => modelNameOf('tratado', table.name)),
    ...business.map((model) => modelNameOf('negocio', model.name)),
  ]
  const runs = await lastModelRunsOf(tx, lake.lakeId, names)
  function standing(layer: 'tratado' | 'negocio', name: LakeTableName) {
    const readBy = business
      .filter((model) =>
        model.active?.inputs.some((input) => input.layer === layer && input.table === name),
      )
      .map((model) => ({ layer: 'negocio' as const, table: model.name }))
    const run = runs.find((each) => each.name === modelNameOf(layer, name))
    return { readBy, lastRun: run === undefined ? null : modelRunViewOf(run) }
  }
  return {
    lake: lake.state,
    lastRun: await lastRunOf(tx, lake.lakeId),
    tables: [
      ...templates.map(({ name, connectionId, columns, treated }) => ({
        layer: 'tratado' as const,
        name,
        connectionId,
        description: treated.description,
        columns: treated.columns.map(({ column, as }) => ({
          name: as,
          description: columns.find((each) => each.name === column)?.description ?? null,
        })),
        ...standing('tratado', name),
      })),
      ...business.map(({ id, name, description, active, proposal }) => ({
        layer: 'negocio' as const,
        ...{ id, name, description, active, proposal },
        ...standing('negocio', name),
      })),
    ],
  }
}

export async function treatmentModelViewOf(
  reads: TreatmentReads,
  tx: ReadTx,
  companyId: CompanyId,
  modelId: TreatmentModelId,
): Promise<TreatmentModel> {
  const model = await businessModelOf(tx, modelId)
  const { lakeId } = await treatmentLakeOf(reads, tx, companyId)
  const runs = await modelRunsOf(tx, lakeId, modelNameOf('negocio', model.name))
  const { id, name, description, versions } = model
  return { id, name, description, versions, runs: runs.map(modelRunViewOf) }
}

export async function deleteCompanyTreatments(tx: CommandTx, companyId: CompanyId): Promise<void> {
  await tx.delete(treatmentRun).where(eq(treatmentRun.companyId, companyId))
  await tx.delete(treatmentModel).where(eq(treatmentModel.companyId, companyId))
}
