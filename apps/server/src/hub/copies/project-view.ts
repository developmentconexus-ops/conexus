import type {
  CompanyId,
  ConnectorId,
  CopyId,
  CopyMode,
  CopyOrigin,
  CopyShown,
  PersonId,
  ProjectId,
} from '@conexus/hub-api'
import { ConnectorId as ConnectorIdSchema } from '@conexus/hub-api'
import { and, eq, inArray, isNotNull } from 'drizzle-orm'
import type { ReadTx } from '../../platform/database.ts'
import { Failure, logFailure } from '../../platform/failure.ts'
import type { CopyName } from '../connectors/public.ts'
import { projectCopyRows, seenBy } from './list.ts'
import { copyModeOf } from './mode.ts'
import type { CopiesDeps } from './store.ts'
import { personScope, shownOf } from './store.ts'
import { copySource } from './tables.ts'

/** What a Projeto may read of the company's copies: the released ones with their columns, the others by name, only those of the role of whoever converses. */
export type ProjectCopiesView =
  | {
      kind: 'COPIES'
      released: {
        name: CopyName
        connector: ConnectorId
        source: CopyOrigin
        description: string | null
        columns: CopyShown['columns']
        mode: CopyMode
        /** The copy's sources have an account: its table holds `_account` and `_account_name`. */
        accounts: boolean
      }[]
      unreleased: CopyName[]
    }
  /** The Hub's database did not answer. */
  | { kind: 'FAILED' }

/** The copies, of those named, that have a source with an account. */
async function withAccounts(tx: ReadTx, companyId: CompanyId, ids: readonly CopyId[]) {
  if (ids.length === 0) return new Set<string>()
  const rows = await tx
    .selectDistinct({ copyId: copySource.copyId })
    .from(copySource)
    .where(
      and(
        eq(copySource.companyId, companyId),
        inArray(copySource.copyId, [...ids]),
        isNotNull(copySource.accountRef),
      ),
    )
  return new Set(rows.map((row) => row.copyId))
}

/**
 * The copies of the company as the Builder's turn sees them, from the same reading that serves the
 * Projeto's list of copies. The released copies are the Projeto's, whoever converses; the others are
 * named only when the person's role reads them (`copiesReadBy`, the one owner of that rule). The view
 * holds only the definitions (where each reads, its descriptions and columns) and whether its sources
 * have an account. The columns are the stored definition's, the owner of the table's columns, never
 * the company's database.
 */
export async function projectView(
  deps: CopiesDeps,
  input: { companyId: CompanyId; personId: PersonId; projectId: ProjectId },
): Promise<ProjectCopiesView> {
  const { companyId, projectId } = input
  let read: {
    rows: Awaited<ReturnType<typeof projectCopyRows>>
    reads: Awaited<ReturnType<typeof seenBy>>
    accounts: Set<string>
  }
  try {
    read = await deps.database.read(personScope(input), async (tx) => {
      const reads = await seenBy(deps, tx, input)
      const rows = await projectCopyRows(tx, input)
      const granted = rows.filter((row) => row.granted).map((row) => row.copy.id)
      const accounts = await withAccounts(tx, companyId, granted)
      return { rows, reads, accounts }
    })
  } catch (error) {
    if (!(error instanceof Failure) || error.code !== 'DATABASE_UNAVAILABLE') throw error
    logFailure(deps.log, error, { companyId, projectId }, 'COPY_VIEW_FAILED')
    return { kind: 'FAILED' }
  }
  const { rows, reads, accounts } = read
  const released = rows.filter(({ granted }) => granted)
  return {
    kind: 'COPIES',
    released: released.map(({ copy }) => {
      const shown = shownOf(copy.connectorId, copy.definition, copy.columnState)
      return {
        ...{ name: copy.name, connector: ConnectorIdSchema.parse(copy.connectorId) },
        ...{ source: shown.source, description: shown.description, columns: shown.columns },
        ...{ mode: copyModeOf(copy.definition), accounts: accounts.has(copy.id) },
      }
    }),
    unreleased: rows
      .filter(({ granted, copy }) => !granted && (reads === 'ALL' || reads.includes(copy.id)))
      .map(({ copy }) => copy.name),
  }
}
