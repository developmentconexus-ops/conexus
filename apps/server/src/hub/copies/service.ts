import type { CompanyId, CopyId, PersonId, ProjectId } from '@conexus/hub-api'
import type { SqlAnswer } from '../../platform/company-postgres.ts'
import { accessTables } from './access-source.ts'
import { tableRowsByName } from './catalog-view.ts'
import type { OfRelease } from './grants.ts'
import { applyGrants, grantCopy, revokeAllOf, revokeCopy } from './grants.ts'
import { listed, ofProject, runs } from './list.ts'
import { projectView } from './project-view.ts'
import { copiesReadBy, listedReaders, readAs, readerOf } from './readers.ts'
import { setRoleCopies } from './role-copies.ts'
import { sampleOf } from './sample.ts'
import type { CopiesDeps, InCompany } from './store.ts'

type Of = InCompany & { copyId: CopyId }

/** The copies' acts, each bound to its dependencies; the routes and the Hub's own passes call these. */
export function createCopyService(deps: CopiesDeps) {
  return Object.freeze({
    list: (input: InCompany) => listed(deps, input),
    runs: (input: Of & { page: string | undefined }) => runs(deps, input),
    ofProject: (input: InCompany & { projectId: ProjectId }) => ofProject(deps, input),
    /** The first rows of a copy's table, read as the member's role. */
    sample: (input: Of & { signal: AbortSignal }) => sampleOf(deps, input),
    /** What the Builder's turn sees of the company's copies for a Projeto, the unreleased only those the person's role reads. */
    projectView: (input: { companyId: CompanyId; personId: PersonId; projectId: ProjectId }) =>
      projectView(deps, input),
    /** The copies a place reads, for the access door. */
    access: Object.freeze({ tables: accessTables(deps) }),
    /** What the data contract reads; admits nobody, the caller did: one page of a table by its name, and who reads what. */
    data: Object.freeze({
      tableRows: (input: Parameters<typeof tableRowsByName>[1]) => tableRowsByName(deps, input),
      readers: Object.freeze({
        copiesReadBy,
        readerOf,
        readAs: (input: Parameters<typeof readAs>[1]) => readAs(deps, input),
      }),
    }),
    /** Who reads each copy, admitting `seeData`, and the copies a role reads, admitting `manageRoles`. */
    readers: Object.freeze({
      list: (input: InCompany) => listedReaders(deps, input),
      set: (input: Parameters<typeof setRoleCopies>[1]) => setRoleCopies(deps, input),
    }),
    /** Liberar and Tirar a copy to a Projeto. */
    grant: (input: OfRelease) => grantCopy(deps, input),
    revoke: (input: OfRelease) => revokeCopy(deps, input),
    /** Before an app's logins are dropped: every release of the Projeto revoked. */
    revokeAllOf: (input: { companyId: CompanyId; projectId: ProjectId }): Promise<SqlAnswer> =>
      revokeAllOf(deps, input),
    /** After an app's logins are made: every release of the Projeto granted again (repair only). */
    applyGrants: (input: { companyId: CompanyId; projectId: ProjectId }): Promise<SqlAnswer> =>
      applyGrants(deps, input),
  })
}
export type CopyService = ReturnType<typeof createCopyService>
