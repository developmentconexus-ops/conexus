import type { CompanyId } from '@conexus/hub-api'
import { ModelAccountId, PersonId } from '@conexus/hub-api'
import { eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { CommandTx, Database } from '../../platform/database.ts'
import type { Resealed } from '../../platform/reseal.ts'
import { resealCompanies, resealOne } from '../../platform/reseal.ts'
import type { Sealed, SealKeys } from '../../platform/seal.ts'
import { sealContext, sealedOf } from './accounts.ts'
import { modelAccount } from './tables.ts'

const Row = z.object({
  id: ModelAccountId,
  personId: PersonId.nullable(),
  kind: z.string(),
  provider: z.string(),
})

/** One company's accounts, its people's own too. A sign-in lives minutes and is left to end on its key. */
async function resealCompany(
  keys: SealKeys,
  tx: CommandTx,
  companyId: CompanyId,
): Promise<Resealed[]> {
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
  const outcomes: Resealed[] = []
  for (const found of rows) {
    const row = Row.parse(found)
    async function write(sealed: Sealed) {
      await tx
        .update(modelAccount)
        .set({ sealed: Buffer.from(sealed.blob), keyId: sealed.keyId })
        .where(eq(modelAccount.id, row.id))
    }
    const context = sealContext({ ...row, companyId })
    outcomes.push(await resealOne(keys, context, await sealedOf(tx, row.id), write))
  }
  return outcomes
}

/** Moves every account sealed with a key that only opens to the key that seals (security S32). */
export function reseal(deps: { database: Database; sealKeys: SealKeys }) {
  return resealCompanies(
    deps.database,
    sql`select company_id from builder.companies_with_seals()`,
    (tx, companyId) => resealCompany(deps.sealKeys, tx, companyId),
  )
}
