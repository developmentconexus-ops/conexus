import type { CompanyId, CopyId, ProjectId } from '@conexus/hub-api'
import type { SqlAnswer } from '../../platform/company-postgres.ts'
import type { Enabling } from './enable.ts'
import { enableCopy } from './enable.ts'
import type { OfRelease } from './grants.ts'
import { applyGrants, grantCopy, revokeAllOf, revokeCopy } from './grants.ts'
import { RUN_DEFAULTS, runCopy } from './run.ts'
import type { CopiesDeps, CopyTuning } from './store.ts'

export type { CopyClock, CopyTuning } from './store.ts'

/**
 * The company's copies (Capacidade 2): what each reads, its runs and its releases to Projetos. The
 * rows it reads live in the company's database, reached only through `CompanyPostgres`; the source,
 * only through the connectors' port.
 */
export function createCopies(
  deps: Omit<CopiesDeps, 'tuning'> & { tuning?: CopyTuning | undefined },
) {
  const full: CopiesDeps = { ...deps, tuning: { ...RUN_DEFAULTS, ...deps.tuning } }
  return Object.freeze({
    /** Ligar: the row, the company's table and the clock. */
    enable: (input: Enabling) => enableCopy(full, input),
    /** One run of one copy; the clock's workflow calls it. */
    run: (input: { companyId: CompanyId; copyId: CopyId }, signal: AbortSignal) =>
      runCopy(full, input, signal),
    /** Liberar and Tirar a copy to a Projeto. */
    grant: (input: OfRelease) => grantCopy(full, input),
    revoke: (input: OfRelease) => revokeCopy(full, input),
    /** Before an app's logins are dropped: every release of the Projeto revoked. */
    revokeAllOf: (input: { companyId: CompanyId; projectId: ProjectId }): Promise<SqlAnswer> =>
      revokeAllOf(full, input),
    /** After an app's logins are made: every release of the Projeto granted again (repair only). */
    applyGrants: (input: { companyId: CompanyId; projectId: ProjectId }): Promise<SqlAnswer> =>
      applyGrants(full, input),
  })
}
