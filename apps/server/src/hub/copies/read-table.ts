import type { CompanyId } from '@conexus/hub-api'
import { quoted } from '../../platform/company-postgres.ts'
import type { SyncRead } from '../../platform/copy-reader.ts'
import type { CopiesDeps, StoredCopy } from './store.ts'
import { companyOwner, companyScope } from './store.ts'

export type TableRead =
  | { kind: 'ROWS'; columns: string[]; rows: unknown[][]; complete: boolean }
  | { kind: 'NO_TABLE' }
  | { kind: 'UNAVAILABLE'; reason: string }

/** SQLSTATE of a table that is not there: a copy before its first run. */
const UNDEFINED_TABLE = '42P01'

type Reading = { companyId: CompanyId; stored: StoredCopy; limit: number; signal: AbortSignal }

function unavailable(reason: string): TableRead {
  return { kind: 'UNAVAILABLE', reason }
}

/**
 * The read login made again, as the owner, for a company that had none, and the read asked once
 * more. What stops the making is an `UNAVAILABLE` read with its cause.
 */
async function readAfterLogin(
  deps: CopiesDeps,
  input: Reading,
  ask: () => Promise<SyncRead>,
): Promise<SyncRead> {
  const { companyId, stored } = input
  const owner = await companyOwner(deps, { companyId, personId: stored.createdBy })
  if (owner === undefined) return { kind: 'UNAVAILABLE', cause: 'NO_OWNER' }
  const made = await deps.companyPostgres.ensureReader(owner)
  if (made.kind !== 'DONE') {
    const code = made.kind === 'REFUSED' ? made.code : made.kind
    deps.log.error({ companyId, code }, 'COPY_DATABASE_FAILED')
    return { kind: 'UNAVAILABLE', cause: `READER_${code}` }
  }
  deps.log.info({ companyId }, 'COPY_READER_MADE')
  return ask()
}

/** What the read answered, as a table read: the rows of the first statement, or why there are none. */
function tableReadOf(answer: SyncRead, names: string[], limit: number): TableRead {
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
    case 'NO_LOGIN':
    case 'TOO_LARGE':
    case 'TIMEOUT':
      return unavailable(answer.kind)
    default:
      return answer satisfies never
  }
}

/** The first `limit` rows of a copy's table as the read login, its columns the definition's alone (data D31); admits nobody. */
export async function readCopyTable(deps: CopiesDeps, input: Reading): Promise<TableRead> {
  const { companyId, stored, limit, signal } = input
  const ready = await deps.database.read(companyScope(companyId), (tx) =>
    deps.projects.readyDatabaseOf(tx, companyId),
  )
  if (ready?.host == null) return unavailable('NO_COMPANY_DATABASE')
  const reader = await deps.companyPostgres.readerAddress(ready.host)
  const names = stored.definition.columns.map((column) => column.name)
  const statements = [
    {
      text: `SELECT ${names.map(quoted).join(', ')} FROM "sync".${quoted(stored.name)} LIMIT ${limit + 1}`,
    },
  ]
  function ask() {
    return deps.companyPostgres.readCopies(reader, statements, signal)
  }
  const first = await ask()
  const answer = first.kind === 'NO_LOGIN' ? await readAfterLogin(deps, input, ask) : first
  return tableReadOf(answer, names, limit)
}
