import { CompanyId } from '@conexus/hub-api'
import type { SQL } from 'drizzle-orm'
import type { CommandTx, Database } from './database.ts'
import { Failure } from './failure.ts'
import type { SealContext, Sealed, SealKeys } from './seal.ts'
import { open, seal } from './seal.ts'

export type Resealed = 'moved' | 'kept' | 'refused'

/**
 * One sealed value: opened under its context, and sealed again and written only when its key is
 * not the one that seals. A blob that no longer opens stays as it is, counted: it opened under no
 * key before either.
 */
export async function resealOne(
  keys: SealKeys,
  context: SealContext,
  held: Sealed,
  write: (sealed: Sealed) => Promise<void>,
): Promise<Resealed> {
  try {
    const plain = open(keys, context, held)
    if (held.keyId === keys.sealingId) return 'kept'
    await write(seal(keys, context, plain))
    return 'moved'
  } catch (error) {
    if (!(error instanceof Failure && error.code === 'SEAL_REFUSED')) throw error
    return 'refused'
  }
}

/**
 * Moves a subject's sealed values to the key that seals (security S32), one company at a time, in
 * its scope with no person: `companies` names them before any company is known, and `work` reseals
 * one company's rows. When none opens, the key file is wrong, and this fails rather than hide it.
 */
export async function resealCompanies(
  database: Database,
  companies: SQL,
  work: (tx: CommandTx, companyId: CompanyId) => Promise<Resealed[]>,
) {
  const found = await database.installationRead((tx) => tx.execute(companies))
  const counts = { moved: 0, kept: 0, refused: 0 }
  for (const row of found.rows) {
    const companyId = CompanyId.parse(Object(row).company_id)
    const scope = { kind: 'COMPANY', companyId, personId: null } as const
    const each = await database.command(scope, (tx) => work(tx, companyId))
    for (const outcome of each) counts[outcome] += 1
  }
  if (counts.refused > 0 && counts.moved + counts.kept === 0)
    throw new Failure('SEAL_REFUSED', { details: { refused: counts.refused } })
  return { moved: counts.moved, refused: counts.refused }
}
