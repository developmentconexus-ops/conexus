import type {
  CompanyId,
  CopyId,
  CopyInterval,
  CopyModelSummary,
  CopyProposalId,
  CopyProposalSummary,
  CopyRun,
  CopySchedule,
  CopySummary,
  ProjectId,
} from '@conexus/hub-api'
import {
  ConnectorId as ConnectorIdSchema,
  CopyRunFailureCode,
  CopyRunId,
  ProjectId as ProjectIdSchema,
} from '@conexus/hub-api'
import { and, desc, eq, inArray, isNull, lt, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { ReadTx } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import { pageKey, pageOf } from '../../platform/pages.ts'
import { connectionNamesOf } from '../connectors/public.ts'
import { copyModeOf } from './mode.ts'
import type { CopiesDeps, CopyState, InCompany, StoredCopy } from './store.ts'
import { parsedCopy, personScope, proposalsOf, shownOf, storedCopy } from './store.ts'
import { copy, copyRun, projectCopy } from './tables.ts'

/** The runs of a copy a page holds. */
const RUNS_PAGE = 20

const Reason = z.enum(['CAP', 'STOPPED', 'WAIT'])

/** A run's row as the contract states it; the reason of each outcome parsed again (code C27). */
function runOf(row: typeof copyRun.$inferSelect): CopyRun {
  const base = {
    id: CopyRunId.parse(row.id),
    startedAt: row.startedAt.toISOString(),
    endedAt: row.endedAt?.toISOString() ?? null,
    read: row.read,
    written: row.written,
  }
  switch (row.outcome) {
    case null:
      return { ...base, outcome: { kind: 'RUNNING' } }
    case 'COMPLETE':
    case 'INTERRUPTED':
      return { ...base, outcome: { kind: row.outcome } }
    case 'PARTIAL':
      return { ...base, outcome: { kind: 'PARTIAL', reason: Reason.parse(row.reason) } }
    case 'ERROR':
      return { ...base, outcome: { kind: 'ERROR', code: CopyRunFailureCode.parse(row.reason) } }
    default:
      return row.outcome satisfies never
  }
}

/** The open run of each copy, else its last (the one it ended and points at). */
async function currentRuns(tx: ReadTx, copies: readonly Pick<StoredCopy, 'id' | 'lastRunId'>[]) {
  const runs = new Map<string, CopyRun>()
  if (copies.length === 0) return runs
  const last = copies.flatMap(({ lastRunId }) => (lastRunId === null ? [] : [lastRunId]))
  const ended =
    last.length === 0 ? [] : await tx.select().from(copyRun).where(inArray(copyRun.id, last))
  for (const row of ended) runs.set(row.copyId, runOf(row))
  const open = await tx
    .select()
    .from(copyRun)
    .where(
      and(
        inArray(
          copyRun.copyId,
          copies.map(({ id }) => id),
        ),
        isNull(copyRun.endedAt),
      ),
    )
  for (const row of open) runs.set(row.copyId, runOf(row))
  return runs
}

/** The live Projetos each copy is released to, by name. */
async function releasesOf(deps: CopiesDeps, tx: ReadTx, companyId: CompanyId, ids: CopyId[]) {
  const names = new Map<string, CopySummary['projects']>()
  if (ids.length === 0) return names
  const rows = await tx
    .select({ copyId: projectCopy.copyId, projectId: projectCopy.projectId })
    .from(projectCopy)
    .where(inArray(projectCopy.copyId, ids))
  const live = await deps.projects.liveProjectNamesOf(tx, {
    companyId,
    ids: rows.map((row) => ProjectIdSchema.parse(row.projectId)),
  })
  for (const row of rows) {
    const id = ProjectIdSchema.parse(row.projectId)
    const name = live.get(id)
    if (name === undefined) continue
    names.set(row.copyId, [...(names.get(row.copyId) ?? []), { id, name }])
  }
  for (const each of names.values()) each.sort((a, b) => a.name.localeCompare(b.name))
  return names
}

/** The company's copies (or the one) as the contract states them; the clock is asked outside the read. */
async function summaries(
  deps: CopiesDeps,
  input: InCompany,
  only?: CopyId,
): Promise<CopySummary[]> {
  const { companyId } = input
  const read = await deps.database.read(personScope(input), async (tx) => {
    await deps.identity.admitMember({ tx, ...input, action: 'readCopies' })
    const where = and(
      eq(copy.companyId, companyId),
      only === undefined ? undefined : eq(copy.id, only),
    )
    const stored = (await tx.select().from(copy).where(where).orderBy(copy.name)).map(parsedCopy)
    const ids = stored.map((row) => row.id)
    return {
      stored,
      runs: await currentRuns(tx, stored),
      released: await releasesOf(deps, tx, companyId, ids),
      names: await connectionNamesOf(tx, { companyId, ids: stored.map((row) => row.connectionId) }),
    }
  })
  if (only !== undefined && read.stored.length === 0) throw new Failure('COPY_NOT_FOUND')
  const states: ReadonlyMap<CopyId, CopyState> =
    read.stored.length === 0 ? new Map() : await deps.clock().states(companyId)
  return read.stored.map((row) => {
    const state = states.get(row.id)
    const schedule: CopySchedule = state?.schedule ?? { kind: 'MISSING' }
    const interval: CopyInterval | null = state?.interval ?? null
    const linked = read.names.get(row.connectionId)
    return {
      id: row.id,
      name: row.name,
      label: row.label,
      connection: {
        id: row.connectionId,
        name: linked?.name ?? '',
        connector: linked?.connector ?? ConnectorIdSchema.parse(row.connectorId),
      },
      interval,
      schedule,
      run: read.runs.get(row.id) ?? null,
      rows: row.rows,
      mode: copyModeOf(row.definition),
      projects: read.released.get(row.id) ?? [],
      shown: shownOf(row.definition),
    }
  })
}

/** The list's page: the company's copies, and its open proposals with those `named` whatever their state (Capacidade 3). */
async function listed(
  deps: CopiesDeps,
  input: InCompany & { named: readonly CopyProposalId[] },
): Promise<{ copies: CopySummary[]; proposals: CopyProposalSummary[] }> {
  const copies = await summaries(deps, input)
  const proposals = await deps.database.read(personScope(input), async (tx) => {
    await deps.identity.admitMember({ tx, ...input, action: 'readCopies' })
    return proposalsOf(deps, tx, input)
  })
  return { copies, proposals }
}

/** The copy models the connectors offer. */
async function models(deps: CopiesDeps, input: InCompany): Promise<CopyModelSummary[]> {
  await deps.database.read(personScope(input), (tx) =>
    deps.identity.admitMember({ tx, ...input, action: 'readCopies' }),
  )
  return deps
    .connectors()
    .catalog()
    .map(({ connector, model }) => ({ connector, id: model.id, label: model.label }))
}

/** The copy's runs, newest first, a page of 20 after the run the token names; with the copy's summary. */
async function runs(
  deps: CopiesDeps,
  input: InCompany & { copyId: CopyId; page: string | undefined },
) {
  const { companyId, copyId } = input
  const page = await deps.database.read(personScope(input), async (tx) => {
    await deps.identity.admitMember({ tx, ...input, action: 'readCopies' })
    if ((await storedCopy(tx, input)) === undefined) throw new Failure('COPY_NOT_FOUND')
    const key = pageKey(input.page, CopyRunId)
    const anchor =
      key === undefined
        ? undefined
        : lt(
            sql`(${copyRun.startedAt}, ${copyRun.id})`,
            tx
              .select({ startedAt: copyRun.startedAt, id: copyRun.id })
              .from(copyRun)
              .where(and(eq(copyRun.id, key), eq(copyRun.copyId, copyId))),
          )
    const rows = await tx
      .select()
      .from(copyRun)
      .where(and(eq(copyRun.copyId, copyId), eq(copyRun.companyId, companyId), anchor))
      .orderBy(desc(copyRun.startedAt), desc(copyRun.id))
      .limit(RUNS_PAGE + 1)
    return pageOf(rows, (row) => row.id, RUNS_PAGE)
  })
  const [summary] = await summaries(deps, input, copyId)
  if (summary === undefined) throw new Failure('COPY_NOT_FOUND')
  return { copy: summary, runs: page.rows.map(runOf), next: page.next }
}

/** Every copy of the company, each with its stored definition and whether the Projeto has it released; one reading for the page and for the Builder. */
async function projectCopyRows(tx: ReadTx, input: { companyId: CompanyId; projectId: ProjectId }) {
  const rows = await tx
    .select({
      row: copy,
      granted: sql<boolean>`${projectCopy.copyId} IS NOT NULL`,
    })
    .from(copy)
    .leftJoin(
      projectCopy,
      and(eq(projectCopy.copyId, copy.id), eq(projectCopy.projectId, input.projectId)),
    )
    .where(eq(copy.companyId, input.companyId))
    .orderBy(copy.name)
  return rows.map(({ row, granted }) => ({ copy: parsedCopy(row), granted }))
}

/** Every copy of the company and whether the Projeto has it released. */
async function ofProject(deps: CopiesDeps, input: InCompany & { projectId: ProjectId }) {
  return deps.database.read(personScope(input), async (tx) => {
    await deps.identity.admitMember({ tx, ...input, action: 'readCopies' })
    if ((await deps.projects.liveProjectOf(tx, input)) === undefined)
      throw new Failure('NOT_FOUND', { details: { reason: 'NO_PROJECT' } })
    return (await projectCopyRows(tx, input)).map(({ copy: stored, granted }) => ({
      copy: {
        id: stored.id,
        name: stored.name,
        label: stored.label,
        connector: ConnectorIdSchema.parse(stored.connectorId),
      },
      granted,
    }))
  })
}

export { listed, models, ofProject, projectCopyRows, runs, summaries }
