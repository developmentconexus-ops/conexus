import type { CompanyId, PersonId, ProjectId } from '@conexus/hub-api'
import type { AppRead, SqlStatement } from '../../platform/company-postgres.ts'
import { Failure } from '../../platform/failure.ts'
import type { AppCheck } from './app-check.ts'
import { checkAppRead } from './app-check.ts'
import { readAppData } from './app-database.ts'
import type { SendDeps } from './send.ts'
import { admitConversant } from './send.ts'

type Ids = { companyId: CompanyId; projectId: ProjectId; personId: PersonId }

/** Whether the person converses with the Builder in the Projeto: an outsider and an absent Projeto are the same (security S10). */
type BuilderDataAccess = { kind: 'ADMITTED' } | { kind: 'NOT_FOUND' }

type NotFound = { kind: 'REFUSED'; code: 'NOT_FOUND' }

/** What the Builder asks of a Projeto's app data, each call admitted again before the app's database is touched. */
export type BuilderData = {
  access(ids: Ids): Promise<BuilderDataAccess>
  read(ids: Ids, statement: SqlStatement, signal: AbortSignal): Promise<AppRead | NotFound>
  check(ids: Ids, statement: SqlStatement, signal: AbortSignal): Promise<AppCheck | NotFound>
}

/**
 * The Builder's door to the data of the Projeto's app (Capacidade 3, U1): whoever the company let
 * converse with the Builder there, a member included, reads rows and counts them as the Builder
 * does. Admission is `useConversations`, read in the Hub before each call (S7, S8, data D22); the
 * Dados page and its routes keep `viewAppData`, which the Builder's door does not use.
 */
export function createBuilderData(deps: SendDeps): BuilderData {
  async function access(ids: Ids): Promise<BuilderDataAccess> {
    const { companyId, personId } = ids
    try {
      await deps.database.read({ kind: 'COMPANY', companyId, personId }, (tx) =>
        admitConversant(deps, tx, ids),
      )
      return { kind: 'ADMITTED' }
    } catch (error) {
      if (error instanceof Failure && error.code === 'NOT_FOUND') return { kind: 'NOT_FOUND' }
      throw error
    }
  }
  const notFound: NotFound = { kind: 'REFUSED', code: 'NOT_FOUND' }
  return Object.freeze({
    access,
    async read(ids, statement, signal) {
      if ((await access(ids)).kind === 'NOT_FOUND') return notFound
      const { companyId, personId, projectId } = ids
      return readAppData(deps, { scope: { companyId, personId }, projectId, statement, signal })
    },
    async check(ids, statement, signal) {
      if ((await access(ids)).kind === 'NOT_FOUND') return notFound
      const { companyId, personId, projectId } = ids
      return checkAppRead(deps, { scope: { companyId, personId }, projectId, statement, signal })
    },
  })
}
