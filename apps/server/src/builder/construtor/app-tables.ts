import { APP_CALL_LIMITS } from '@conexus/app-contract'
import { Failure } from '../../platform/failure.ts'
import type { AppDataPort } from '../agents/public.ts'
import type { InProject } from '../tools/public.ts'

export type AppTable = { name: string; columns: string[] }

/** The names only, from the read login's own schema: `information_schema` lists what it may read, never the ledger. */
const TABLES_SQL = `select table_name, column_name from information_schema.columns
  where table_schema = current_schema() order by table_name, ordinal_position`

/** The app's database not answering in time is the database's, not a defect of ours. */
const SILENT = new Set<string>(['APP_DATA_UNAVAILABLE', 'APP_DATA_TIMEOUT'])

/**
 * The tables of a Projeto's app, names and columns, never a row (step 24.3, U4): read through the
 * same door the agents' `app_data_read` uses (U3). No app is `null`; a read that fails is a failure
 * the Construtor's turn shows, never an empty list that says the app has no tables.
 */
export function appTablesOf(appData: AppDataPort) {
  return async (scope: InProject): Promise<AppTable[] | null> => {
    const { projectId } = scope
    const owner = { companyId: scope.companyId, personId: scope.personId }
    if (!(await appData.hasApp({ scope: owner, projectId }))) return null
    const read = await appData.read({
      scope: owner,
      projectId,
      sql: TABLES_SQL,
      signal: AbortSignal.timeout(APP_CALL_LIMITS.callDeadlineMs),
    })
    if (read.kind === 'FAILED' && SILENT.has(read.code)) {
      throw new Failure('DATABASE_UNAVAILABLE', {
        details: { reason: 'APP_TABLES_UNREADABLE', answer: read.code },
      })
    }
    if (read.kind !== 'ROWS') {
      throw new Failure('INTERNAL_UNEXPECTED', {
        details: { reason: 'APP_TABLES_UNREADABLE', answer: read.kind },
      })
    }
    const tables = new Map<string, string[]>()
    for (const [table, column] of read.rows) {
      if (typeof table !== 'string' || typeof column !== 'string') {
        throw new Failure('INTERNAL_UNEXPECTED', {
          details: { reason: 'APP_TABLES_UNREADABLE', answer: 'SHAPE' },
        })
      }
      tables.set(table, [...(tables.get(table) ?? []), column])
    }
    return [...tables].map(([name, columns]) => ({ name, columns }))
  }
}
