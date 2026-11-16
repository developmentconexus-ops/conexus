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
import { CopyName } from '../connectors/public.ts'
import { projectCopyRows } from './list.ts'
import { copyModeOf } from './mode.ts'
import { copiesReadBy } from './readers.ts'
import type { CopiesDeps } from './store.ts'
import { personScope, shownOf } from './store.ts'
import { copyProposal, copySource } from './tables.ts'

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
        /** The copy is the turn on of a proposal the Builder made in this Projeto: it is on and released. */
        proposedHere: boolean
      }[]
      unreleased: CopyName[]
      /** The Builder's proposals of this Projeto still waiting for whoever turns copies on. */
      proposals: { name: CopyName; label: string }[]
    }
  /** The Hub's database did not answer. */
  | { kind: 'FAILED' }

/** This Projeto's proposals: the open ones, and the copies that came from an accepted one. */
async function proposalsOf(tx: ReadTx, input: { companyId: CompanyId; projectId: ProjectId }) {
  const rows = await tx
    .select({
      name: copyProposal.name,
      label: copyProposal.label,
      state: copyProposal.state,
      copyId: copyProposal.copyId,
    })
    .from(copyProposal)
    .where(
      and(
        eq(copyProposal.companyId, input.companyId),
        eq(copyProposal.projectId, input.projectId),
        inArray(copyProposal.state, ['OPEN', 'ACCEPTED']),
      ),
    )
    .orderBy(copyProposal.name)
  return {
    open: rows.filter(({ state }) => state === 'OPEN').map(({ name, label }) => ({ name, label })),
    accepted: new Set(rows.flatMap(({ copyId }) => (copyId === null ? [] : [copyId]))),
  }
}

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
    reads: Awaited<ReturnType<typeof copiesReadBy>>
    accounts: Set<string>
    proposed: Awaited<ReturnType<typeof proposalsOf>>
  }
  try {
    read = await deps.database.read(personScope(input), async (tx) => {
      const proof = await deps.identity.admitMember({ tx, ...input, action: 'seeData' })
      const reads = await copiesReadBy(deps, tx, { companyId, role: proof.role })
      const rows = await projectCopyRows(tx, input)
      const granted = rows.filter((row) => row.granted).map((row) => row.copy.id)
      const accounts = await withAccounts(tx, companyId, granted)
      return { rows, reads, accounts, proposed: await proposalsOf(tx, input) }
    })
  } catch (error) {
    if (!(error instanceof Failure) || error.code !== 'DATABASE_UNAVAILABLE') throw error
    logFailure(deps.log, error, { companyId, projectId }, 'COPY_VIEW_FAILED')
    return { kind: 'FAILED' }
  }
  const { rows, reads, accounts, proposed } = read
  const released = rows.filter(({ granted }) => granted)
  return {
    kind: 'COPIES',
    released: released.map(({ copy }) => {
      const shown = shownOf(copy.connectorId, copy.definition, copy.columnState)
      return {
        ...{ name: copy.name, connector: ConnectorIdSchema.parse(copy.connectorId) },
        ...{ source: shown.source, description: shown.description, columns: shown.columns },
        ...{ mode: copyModeOf(copy.definition), accounts: accounts.has(copy.id) },
        proposedHere: proposed.accepted.has(copy.id),
      }
    }),
    unreleased: rows
      .filter(({ granted, copy }) => !granted && (reads === 'ALL' || reads.includes(copy.id)))
      .map(({ copy }) => copy.name),
    proposals: proposed.open.map(({ name, label }) => ({ name: CopyName.parse(name), label })),
  }
}
