import { APP_CALL_LIMITS } from '@conexus/app-contract'
import { Failure } from '../../platform/failure.ts'
import type { AppDataPort } from '../app-data/public.ts'
import type { InProject } from '../tools/public.ts'

export type TableWithColumnNames = { name: string; columns: string[] }

/**
 * The tables of a Projeto's app, names and columns, never a row (step 24.3, U4): the list the Dados
 * page shows, through the apps' door (capacity 1). No app is `null`; a read that fails is a failure
 * the Construtor's turn shows, never an empty list that says the app has no tables. The app's
 * database not answering in time is the database's, not a defect of ours.
 */
export function tablesWithColumnNamesOf(appData: AppDataPort) {
  return async (scope: InProject): Promise<TableWithColumnNames[] | null> => {
    const { projectId } = scope
    const read = await appData.tables({
      scope: { companyId: scope.companyId, personId: scope.personId },
      projectId,
      signal: AbortSignal.timeout(APP_CALL_LIMITS.callDeadlineMs),
    })
    switch (read.kind) {
      case 'NO_APP':
        return null
      case 'FAILED':
        throw new Failure(
          read.code === 'APP_DATA_TOO_LARGE' ? 'INTERNAL_UNEXPECTED' : 'DATABASE_UNAVAILABLE',
          { details: { reason: 'APP_TABLES_UNREADABLE', answer: read.code } },
        )
      case 'TABLES':
        return read.tables.map(({ name, columns }) => ({
          name,
          columns: columns.map((column) => column.name),
        }))
      default:
        return read satisfies never
    }
  }
}
