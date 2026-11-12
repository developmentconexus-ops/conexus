import type {
  CompanyId,
  ConnectorId,
  CopyId,
  CopyMode,
  CopyOrigin,
  CopyShown,
  ProjectId,
} from '@conexus/hub-api'
import { ConnectorId as ConnectorIdSchema } from '@conexus/hub-api'
import { and, eq, inArray, isNotNull } from 'drizzle-orm'
import type { ReadTx } from '../../platform/database.ts'
import { Failure, logFailure } from '../../platform/failure.ts'
import { CopyName } from '../connectors/public.ts'
import { projectCopyRows } from './list.ts'
import { copyModeOf } from './mode.ts'
import type { CopiesDeps } from './store.ts'
import { companyScope, shownOf } from './store.ts'
import { copyProposal, copySource } from './tables.ts'

/** What a Projeto may read of the company's copies: the released ones with their columns, the others by name. */
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
 * Projeto's list of copies. It admits nobody: the turn admitted the person, and the view holds only
 * the definitions (where each reads, its descriptions and columns) and whether its sources have an
 * account, which everyone who converses with the Builder may see. The columns are the stored
 * definition's, the owner of the table's columns, never the company's database.
 */
export async function projectView(
  deps: CopiesDeps,
  input: { companyId: CompanyId; projectId: ProjectId },
): Promise<ProjectCopiesView> {
  const { companyId, projectId } = input
  let read: {
    rows: Awaited<ReturnType<typeof projectCopyRows>>
    accounts: Set<string>
    proposed: Awaited<ReturnType<typeof proposalsOf>>
  }
  try {
    read = await deps.database.read(companyScope(companyId), async (tx) => {
      const rows = await projectCopyRows(tx, input)
      const granted = rows.filter((row) => row.granted).map((row) => row.copy.id)
      const accounts = await withAccounts(tx, companyId, granted)
      return { rows, accounts, proposed: await proposalsOf(tx, input) }
    })
  } catch (error) {
    if (!(error instanceof Failure) || error.code !== 'DATABASE_UNAVAILABLE') throw error
    logFailure(deps.log, error, { companyId, projectId }, 'COPY_VIEW_FAILED')
    return { kind: 'FAILED' }
  }
  const { rows, accounts, proposed } = read
  const released = rows.filter(({ granted }) => granted)
  return {
    kind: 'COPIES',
    released: released.map(({ copy }) => {
      const shown = shownOf(copy.connectorId, copy.definition)
      return {
        ...{ name: copy.name, connector: ConnectorIdSchema.parse(copy.connectorId) },
        ...{ source: shown.source, description: shown.description, columns: shown.columns },
        ...{ mode: copyModeOf(copy.definition), accounts: accounts.has(copy.id) },
        proposedHere: proposed.accepted.has(copy.id),
      }
    }),
    unreleased: rows.filter(({ granted }) => !granted).map(({ copy }) => copy.name),
    proposals: proposed.open.map(({ name, label }) => ({ name: CopyName.parse(name), label })),
  }
}
