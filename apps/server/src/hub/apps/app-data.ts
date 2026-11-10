import { APP_CALL_LIMITS } from '@conexus/app-contract'
import type {
  AppRows,
  AppTableName,
  AppTableSummary,
  AppTables,
  CompanyId,
  Person,
  ProjectId,
} from '@conexus/hub-api'
import { Failure } from '../../platform/failure.ts'
import { appRowsOf } from './app-rows.ts'
import type { AppReadInput, AppTable, TableSchema } from './app-tables.ts'
import { appTablesOf, copyTablesOf, rowCountsOf } from './app-tables.ts'
import type { SendDeps } from './send.ts'
import { admitDataReader } from './send.ts'

export type AppDataDeps = SendDeps & {
  /** The tests' deadline for one look at the app's database; the apps' call limit by default. */
  appDataDeadlineMs?: number
}

type OfProject = { person: Person; companyId: CompanyId; projectId: ProjectId }

/** The app's tables, then the copies released to the Projeto, each with its rows counted in one read. */
async function summariesOf(deps: AppDataDeps, read: AppReadInput, app: readonly AppTable[]) {
  const copies = await copyTablesOf(deps, read)
  if (copies.kind === 'FAILED')
    throw new Failure('APP_DATABASE_UNAVAILABLE', { details: { answer: copies.code } })
  const listed = [
    ...app.map((table) => ({ ...table, of: 'APP' as const })),
    ...(copies.kind === 'TABLES' ? copies.tables : []).map((table) => ({
      ...table,
      of: 'COPY' as const,
    })),
  ]
  const counts = await rowCountsOf(deps, { ...read, tables: listed })
  return listed.map(
    ({ of, name }, at): AppTableSummary => ({
      schema: of,
      name,
      rows: counts[at] ?? { kind: 'UNKNOWN' },
    }),
  )
}

/**
 * A Projeto's app tables and rows, for who builds (capacity 1): the Hub admits the person and the
 * live Projeto in a read-only transaction first, and only then asks the app's database. A table that
 * is not in the catalog, or a Projeto with no app, is not found; the database silent is the failure
 * the screen retries, and a page past the cap is too wide to show.
 */
export function createAppData(deps: AppDataDeps) {
  async function admit(input: OfProject & { signal: AbortSignal }) {
    const { person, companyId, projectId } = input
    await deps.database.read({ kind: 'COMPANY', companyId, personId: person.id }, (tx) =>
      admitDataReader(deps, tx, input),
    )
    return {
      scope: { companyId, personId: person.id },
      projectId,
      signal: AbortSignal.any([
        input.signal,
        AbortSignal.timeout(deps.appDataDeadlineMs ?? APP_CALL_LIMITS.callDeadlineMs),
      ]),
    }
  }
  return Object.freeze({
    tables: async (input: OfProject & { signal: AbortSignal }): Promise<AppTables> => {
      const read = await admit(input)
      const found = await appTablesOf(deps, read)
      switch (found.kind) {
        case 'NO_APP':
          return { kind: 'NO_APP' }
        case 'FAILED':
          throw new Failure('APP_DATABASE_UNAVAILABLE', { details: { answer: found.code } })
        case 'TABLES':
          return { kind: 'TABLES', tables: await summariesOf(deps, read, found.tables) }
        default:
          return found satisfies never
      }
    },
    rows: async (
      input: OfProject & {
        signal: AbortSignal
        schema: TableSchema
        table: AppTableName
        page: string | undefined
      },
    ): Promise<AppRows> => {
      const read = await admit(input)
      const rows = await appRowsOf(deps, {
        ...read,
        schema: input.schema,
        name: input.table,
        page: input.page,
      })
      switch (rows.kind) {
        case 'NONE':
          throw new Failure('NOT_FOUND', { details: { reason: 'NO_TABLE' } })
        case 'FAILED':
          throw new Failure(
            rows.code === 'APP_DATA_TOO_LARGE' ? 'APP_TABLE_TOO_WIDE' : 'APP_DATABASE_UNAVAILABLE',
            { details: { answer: rows.code } },
          )
        case 'ROWS':
          return { columns: rows.columns, rows: rows.rows, next: rows.next }
        default:
          return rows satisfies never
      }
    },
  })
}
export type AppData = ReturnType<typeof createAppData>
