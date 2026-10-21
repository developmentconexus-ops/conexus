import type { CompanyId, ModelAccountId } from '@conexus/hub-api'
import { CompanyId as CompanyIdSchema } from '@conexus/hub-api'
import { and, eq, isNull, sql } from 'drizzle-orm'
import type { Database, ReadTx, Scope } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure, logFailure } from '../../platform/failure.ts'
import type { SealKeys } from '../../platform/seal.ts'
import { AccountRow, columns, credentialOf } from './accounts.ts'
import { subscriptionAccess } from './claude/store.ts'
import type { GoogleCalls } from './google/port.ts'

import { hasReader, keepServed } from './served.ts'
import { modelAccount } from './tables.ts'

export type ReadingDeps = {
  database: Database
  sealKeys: SealKeys
  googleCalls: GoogleCalls
  log: FailureLog
}

async function readThrowing(
  deps: ReadingDeps,
  scope: Scope,
  companyId: CompanyId,
  accountId: ModelAccountId,
  before?: (tx: ReadTx) => Promise<unknown>,
): Promise<void> {
  const found = await deps.database.read(scope, async (tx) => {
    await before?.(tx)
    const [row] = await tx
      .select(columns)
      .from(modelAccount)
      .where(and(eq(modelAccount.id, accountId), eq(modelAccount.companyId, companyId)))
    if (row === undefined) return undefined
    const account = AccountRow.parse(row)
    return { account, credential: await credentialOf(deps, tx, { ...account, companyId }) }
  })
  if (found === undefined || !hasReader(found.account)) return
  const { account, credential } = found
  const target = { id: account.id, kind: account.kind, provider: account.provider, companyId }
  if (account.kind === 'google_cliproxy') {
    const { url, apiKey, hold } = await deps.googleCalls(
      { ...account, companyId, credential },
      scope,
    )
    const release = hold()
    try {
      await keepServed(deps, scope, target, apiKey, url)
    } finally {
      release()
    }
    return
  }
  const secret =
    account.kind === 'claude_subscription'
      ? await subscriptionAccess({ ...deps, scope }, { ...account, companyId, credential })
      : credential.reveal()
  await keepServed(deps, scope, target, secret)
}

/**
 * Reads one account's list now with its own credential, whatever its kind, and keeps it (card
 * 12.3). `before` runs in the transaction that reads the row, for the caller's admission. A kind
 * with no reader, or an account gone, is left as it is, and a read that fails is logged and leaves
 * the list as it was: it never fails what the caller is doing.
 */
export async function readServedOf(
  deps: ReadingDeps,
  scope: Scope,
  companyId: CompanyId,
  accountId: ModelAccountId,
  before?: (tx: ReadTx) => Promise<unknown>,
): Promise<void> {
  try {
    await readThrowing(deps, scope, companyId, accountId, before)
  } catch (error) {
    const failure =
      error instanceof Failure ? error : new Failure('INTERNAL_UNEXPECTED', { cause: error })
    logFailure(deps.log, failure, { companyId, accountId })
  }
}

/**
 * The accounts of every company whose list was never read, which are the ones linked before the
 * list was read at link, read now one by one, outside any transaction. A read that fails leaves
 * the account unread, as before, and the next start tries it again.
 */
export async function readUnserved(deps: ReadingDeps): Promise<number> {
  const companies = await deps.database.installationRead((tx) =>
    tx.execute(sql`select company_id from builder.companies_with_seals()`),
  )
  let tried = 0
  for (const found of companies.rows) {
    const companyId = CompanyIdSchema.parse(Object(found).company_id)
    const scope = { kind: 'COMPANY', companyId, personId: null } as const
    const unread = await deps.database.read(scope, (tx) =>
      tx
        .select(columns)
        .from(modelAccount)
        .where(and(eq(modelAccount.companyId, companyId), isNull(modelAccount.servedModels))),
    )
    for (const row of unread.map((each) => AccountRow.parse(each)).filter(hasReader)) {
      await readServedOf(deps, scope, companyId, row.id)
      tried += 1
    }
  }
  return tried
}
