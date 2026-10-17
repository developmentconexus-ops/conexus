import type { CompanyId, PersonId } from '@conexus/hub-api'
import { sql } from 'drizzle-orm'
import type { Database } from './database.ts'

// Never called: `npm run typecheck` fails if a transaction opens without a scope, or if a scope
// takes an id that no parse produced, such as a string from a request body (T9, decision 0039).
async function work() {
  return undefined
}

export function unscoped(database: Database, companyId: CompanyId, personId: PersonId) {
  // @ts-expect-error: a read names its scope.
  const read = database.read(work)
  // @ts-expect-error: a command names its scope.
  const command = database.command(work)
  // @ts-expect-error: the library's command names its scope.
  const library = database.libraryCommand({}, work)
  // @ts-expect-error: a company's id is a parsed CompanyId, never a plain string.
  const fromBody = database.read({ kind: 'COMPANY', companyId: 'company', personId }, work)
  // @ts-expect-error: a company scope has the person its session names.
  const anonymous = database.read({ kind: 'COMPANY', companyId }, work)
  // @ts-expect-error: the operator's scope is for a person too.
  const nobody = database.read({ kind: 'OPERATOR', companyId: null }, work)
  const scoped = database.read({ kind: 'COMPANY', companyId, personId }, (tx) =>
    tx.execute(sql`select 1`),
  )
  return [read, command, library, fromBody, anonymous, nobody, scoped]
}
