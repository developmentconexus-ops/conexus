import { AppTableName } from '@conexus/hub-api'
import { idOrNotFound } from '../../platform/hub.ts'

export { AppRefused } from './app-refused.tsx'
export { DataPage } from './data.tsx'
export { DataRows, RowsFailure } from './data-rows.tsx'
export { Publish } from './publish.tsx'
export { appRowsQuery, appTablesQuery } from './queries.ts'
export { Versions } from './versions.tsx'

/** The `$table` of the Dados routes: a name the contract would never issue is the not-found page. */
export const tableParams = {
  parse: (raw: { table: string }) => ({ table: idOrNotFound(AppTableName, raw.table) }),
  stringify: (p: { table: AppTableName }) => p,
}
