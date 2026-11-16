import { quoted } from '../../platform/company-postgres.ts'
import type { SyncRead } from '../../platform/copy-reader.ts'
import type { ReaderLogin } from './readers.ts'
import { readAs } from './readers.ts'
import type { CopiesDeps, InCompany, StoredCopy } from './store.ts'
import { companyScope } from './store.ts'

export type TableRead =
  | { kind: 'ROWS'; columns: string[]; rows: unknown[][]; complete: boolean }
  | { kind: 'NO_TABLE' }
  | { kind: 'UNAVAILABLE'; reason: string }
  | { kind: 'NOT_IN_ROLE' }

/** SQLSTATE of a table that is not there: a copy before its first run. */
const UNDEFINED_TABLE = '42P01'

type Reading = InCompany & {
  stored: StoredCopy
  limit: number
  signal: AbortSignal
  reader: ReaderLogin
}

function unavailable(reason: string): TableRead {
  return { kind: 'UNAVAILABLE', reason }
}

/** What the read answered, as a table read: the rows of the first statement, or why there are none. */
function tableReadOf(
  answer: SyncRead | { kind: 'NOT_IN_ROLE' },
  names: string[],
  limit: number,
): TableRead {
  switch (answer.kind) {
    case 'ROWS': {
      const [first] = answer.results
      if (first === undefined) return unavailable('NO_RESULT')
      return {
        kind: 'ROWS',
        columns: names,
        rows: first.rows.slice(0, limit),
        complete: first.rows.length <= limit,
      }
    }
    case 'REFUSED':
      return answer.sqlstate === UNDEFINED_TABLE
        ? { kind: 'NO_TABLE' }
        : unavailable(`REFUSED_${answer.sqlstate}`)
    case 'UNAVAILABLE':
      return unavailable(answer.cause ?? answer.kind)
    case 'NOT_IN_ROLE':
      return answer
    case 'NO_LOGIN':
    case 'TOO_LARGE':
    case 'TIMEOUT':
      return unavailable(answer.kind)
    default:
      return answer satisfies never
  }
}

/** The first `limit` rows of a copy's table as the login of whoever asks, its columns the definition's alone (data D31); admits nobody. */
export async function readCopyTable(deps: CopiesDeps, input: Reading): Promise<TableRead> {
  const { companyId, stored, limit, signal } = input
  const ready = await deps.database.read(companyScope(companyId), (tx) =>
    deps.projects.readyDatabaseOf(tx, companyId),
  )
  if (ready?.host == null) return unavailable('NO_COMPANY_DATABASE')
  const names = stored.definition.columns.map((column) => column.name)
  const statements = [
    {
      text: `SELECT ${names.map(quoted).join(', ')} FROM "sync".${quoted(stored.name)} LIMIT ${limit + 1}`,
    },
  ]
  const answer = await readAs(deps, { ...input, host: ready.host, statements, signal })
  return tableReadOf(answer, names, limit)
}
