import type { CompanyId, LakeRun, LakeTableId, PersonId } from '@conexus/hub-api'
import { ConnectionId, LakeTableSummary, listLakeTableRuns, listLakeTables } from '@conexus/hub-api'
import { and, desc, eq, getTableColumns, inArray } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { Failure } from '../../platform/failure.ts'
import { answer, serve } from '../../platform/http.ts'
import type { LakeCopyDeps } from './lake-copy.ts'
import { runViewOf } from './lake-run-view.ts'
import { lakeCopy, lakeRun, lakeTable, lakeTableRun } from './tables.ts'

type Viewer = Readonly<{ person: PersonId; companyId: CompanyId }>
type Deps = Pick<LakeCopyDeps, 'database' | 'identity' | 'source' | 'clock' | 'log'>
type Found = Extract<Awaited<ReturnType<Deps['source']['connection']>>, { kind: 'FOUND' }>
type Tx = Parameters<Deps['identity']['admitMember']>[0]['tx']

function scopeOf(viewer: Viewer) {
  return { kind: 'COMPANY', companyId: viewer.companyId, personId: viewer.person } as const
}

function admit(deps: Deps, tx: Tx, viewer: Viewer) {
  return deps.identity.admitMember({
    tx,
    personId: viewer.person,
    companyId: viewer.companyId,
    action: 'readConnections',
  })
}

function storedOf(deps: Deps, viewer: Viewer) {
  return deps.database.read(scopeOf(viewer), async (tx) => {
    await admit(deps, tx, viewer)
    const marked = await tx
      .select({
        id: lakeTable.id,
        connectionId: lakeTable.connectionId,
        source: lakeTable.sourceTable,
        name: lakeTable.name,
        columns: lakeTable.columns,
        rows: lakeTable.rows,
        interval: lakeCopy.interval,
        startDate: lakeCopy.startDate,
      })
      .from(lakeTable)
      .innerJoin(
        lakeCopy,
        and(
          eq(lakeCopy.companyId, lakeTable.companyId),
          eq(lakeCopy.connectionId, lakeTable.connectionId),
        ),
      )
    const all = await tx.select().from(lakeRun).orderBy(desc(lakeRun.startedAt))
    const runs = [...new Map(all.reverse().map((run) => [run.connectionId, run])).values()]
    const carried =
      runs.length === 0
        ? []
        : await tx
            .select()
            .from(lakeTableRun)
            .where(
              inArray(
                lakeTableRun.runId,
                runs.map((run) => run.id),
              ),
            )
    return { marked, runs, carried }
  })
}

type Stored = Awaited<ReturnType<typeof storedOf>>

function summaryOf(stored: Stored, row: Stored['marked'][number], found: Found, next: Date | null) {
  const declaration = found.tables.find((each) => each.source === row.source)
  if (declaration === undefined) return undefined
  const run = stored.runs.find((each) => each.connectionId === row.connectionId)
  const own = stored.carried.find((each) => each.runId === run?.id && each.tableId === row.id)
  return LakeTableSummary.parse({
    id: row.id,
    connection: { id: row.connectionId, name: found.name, connector: found.connector },
    name: row.name,
    label: declaration.label,
    source: row.source,
    mode: declaration.mode,
    interval: row.interval,
    startDate: declaration.limited ? row.startDate : null,
    rows: row.rows,
    columns: row.columns,
    lastRun:
      run === undefined ? null : runViewOf(run, own ?? { read: 0, written: 0, whole: run.whole }),
    next: next === null ? null : next.toISOString(),
  })
}

function runsOf(deps: Deps, viewer: Viewer, tableId: LakeTableId) {
  return deps.database.read(scopeOf(viewer), async (tx) => {
    await admit(deps, tx, viewer)
    const [table] = await tx
      .select({ id: lakeTable.id })
      .from(lakeTable)
      .where(eq(lakeTable.id, tableId))
    if (table === undefined) throw new Failure('NOT_FOUND', { details: { reason: 'TABLE' } })
    const rows = await tx
      .select({ run: lakeRun, ...getTableColumns(lakeTableRun) })
      .from(lakeTableRun)
      .innerJoin(lakeRun, eq(lakeRun.id, lakeTableRun.runId))
      .where(eq(lakeTableRun.tableId, tableId))
      .orderBy(desc(lakeRun.startedAt))
    return rows.map(({ run, ...carried }): LakeRun => runViewOf(run, carried))
  })
}

type Known = Readonly<{ found: Found | null; next: Date | null }>

async function knownOf(deps: Deps, viewer: Viewer, connectionId: ConnectionId): Promise<Known> {
  const at = { companyId: viewer.companyId, connectionId }
  const found = await deps.source.connection(at)
  return {
    found: found.kind === 'FOUND' ? found : null,
    next: await deps.clock.next(at.connectionId),
  }
}

function byConnectionThenName(a: LakeTableSummary, b: LakeTableSummary): number {
  return (
    a.connection.name.localeCompare(b.connection.name) ||
    a.connection.id.localeCompare(b.connection.id) ||
    a.name.localeCompare(b.name)
  )
}

/**
 * The company's lake tables, for the page Dados: the copies of the connections the
 * viewer reads (every member reads them, as `readConnections` says), and the rounds of one table.
 */
export function createLakeList(deps: Deps) {
  async function tables(viewer: Viewer): Promise<LakeTableSummary[]> {
    const stored = await storedOf(deps, viewer)
    const summaries: LakeTableSummary[] = []
    const seen = new Map<string, Known>()
    for (const row of stored.marked) {
      const connectionId = ConnectionId.parse(row.connectionId)
      const known = seen.get(connectionId) ?? (await knownOf(deps, viewer, connectionId))
      seen.set(connectionId, known)
      if (known.found === null) continue
      const summary = summaryOf(stored, row, known.found, known.next)
      if (summary !== undefined) summaries.push(summary)
      else
        deps.log.error(
          { companyId: viewer.companyId, connectionId: row.connectionId, tableId: row.id },
          'COPY_TABLE_UNDECLARED',
        )
    }
    return summaries.sort(byConnectionThenName)
  }

  function routes(app: FastifyInstance) {
    serve(app, listLakeTables, async ({ person, params }) =>
      answer(await tables({ person: person.id, companyId: params.companyId })),
    )
    serve(app, listLakeTableRuns, async ({ person, params }) =>
      answer(
        await runsOf(deps, { person: person.id, companyId: params.companyId }, params.tableId),
      ),
    )
  }

  return Object.freeze({
    tables,
    runsOf: (viewer: Viewer, id: LakeTableId) => runsOf(deps, viewer, id),
    routes,
  })
}
