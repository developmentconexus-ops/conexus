import type { CompanyId, CopyMode, ProjectId } from '@conexus/hub-api'
import { Failure, logFailure } from '../../platform/failure.ts'
import type { CopyDefinition, CopyName } from '../connectors/public.ts'
import { projectCopyRows } from './list.ts'
import { copyModeOf } from './mode.ts'
import type { CopiesDeps } from './store.ts'
import { companyScope } from './store.ts'

/** What a Projeto may read of the company's copies: the released ones with their columns, the others by name. */
export type ProjectCopiesView =
  | {
      kind: 'COPIES'
      released: {
        name: CopyName
        columns: { name: string; type: CopyDefinition['columns'][number]['type'] }[]
        mode: CopyMode
      }[]
      unreleased: CopyName[]
    }
  /** The Hub's database did not answer. */
  | { kind: 'FAILED' }

/**
 * The copies of the company as the Builder's turn sees them, from the same reading that serves the
 * Projeto's list of copies. It admits nobody: the turn admitted the person, and the view holds only
 * names and columns, which everyone who converses with the Builder may see. The columns are the
 * stored definition's, the owner of the table's columns, never the company's database.
 */
export async function projectView(
  deps: CopiesDeps,
  input: { companyId: CompanyId; projectId: ProjectId },
): Promise<ProjectCopiesView> {
  const { companyId, projectId } = input
  let rows: Awaited<ReturnType<typeof projectCopyRows>>
  try {
    rows = await deps.database.read(companyScope(companyId), (tx) => projectCopyRows(tx, input))
  } catch (error) {
    if (!(error instanceof Failure) || error.code !== 'DATABASE_UNAVAILABLE') throw error
    logFailure(deps.log, error, { companyId, projectId }, 'COPY_VIEW_FAILED')
    return { kind: 'FAILED' }
  }
  const released = rows.filter(({ granted }) => granted)
  return {
    kind: 'COPIES',
    released: released.map(({ copy }) => ({
      name: copy.name,
      columns: copy.definition.columns.map(({ name, type }) => ({ name, type })),
      mode: copyModeOf(copy.definition),
    })),
    unreleased: rows.filter(({ granted }) => !granted).map(({ copy }) => copy.name),
  }
}
