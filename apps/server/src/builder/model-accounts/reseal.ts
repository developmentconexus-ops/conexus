import { CompanyId, ModelAccountId, PersonId } from '@conexus/hub-api'
import { eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { CommandTx, Database } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import type { SealKeys } from '../../platform/seal.ts'
import { open, seal } from '../../platform/seal.ts'
import { sealContext, sealedOf } from './accounts.ts'
import { modelAccount } from './tables.ts'

/**
 * Moves every account sealed with a key that only opens to the key that seals (security S32), one
 * company at a time, in its scope with no person, so it reaches its people's own accounts too. A
 * sign-in lives minutes and is left to end on its key. A blob that no longer opens stays as it
 * is, counted: it opened under no key before either. When none opens, the key file is wrong, and the
 * command fails rather than hide it.
 */
const Row = z.object({
  id: ModelAccountId,
  personId: PersonId.nullable(),
  kind: z.string(),
  provider: z.string(),
})
type Row = z.infer<typeof Row>

/** One account: opened, and sealed again only when its key is not the one that seals. */
async function resealRow(
  deps: { sealKeys: SealKeys },
  tx: CommandTx,
  companyId: CompanyId,
  row: Row,
): Promise<'moved' | 'kept' | 'refused'> {
  const context = sealContext({ ...row, companyId })
  const held = await sealedOf(tx, row.id)
  try {
    const plain = open(deps.sealKeys, context, held)
    if (held.keyId === deps.sealKeys.sealingId) return 'kept'
    const sealed = seal(deps.sealKeys, context, plain)
    await tx
      .update(modelAccount)
      .set({ sealed: Buffer.from(sealed.blob), keyId: sealed.keyId })
      .where(eq(modelAccount.id, row.id))
    return 'moved'
  } catch (error) {
    if (!(error instanceof Failure && error.code === 'SEAL_REFUSED')) throw error
    return 'refused'
  }
}

export async function reseal(deps: { database: Database; sealKeys: SealKeys }) {
  const companies = await deps.database.installationRead((tx) =>
    tx.execute(sql`select company_id from builder.companies_with_seals()`),
  )
  const counts = { moved: 0, kept: 0, refused: 0 }
  for (const found of companies.rows) {
    const companyId = CompanyId.parse(Object(found).company_id)
    const scope = { kind: 'COMPANY', companyId, personId: null } as const
    await deps.database.command(scope, async (tx) => {
      const rows = await tx
        .select({
          id: modelAccount.id,
          personId: modelAccount.personId,
          kind: modelAccount.kind,
          provider: modelAccount.provider,
        })
        .from(modelAccount)
        .where(eq(modelAccount.companyId, companyId))
        .for('update')
      for (const row of rows) counts[await resealRow(deps, tx, companyId, Row.parse(row))] += 1
    })
  }
  if (counts.refused > 0 && counts.moved + counts.kept === 0)
    throw new Failure('SEAL_REFUSED', { details: { refused: counts.refused } })
  return { moved: counts.moved, refused: counts.refused }
}
