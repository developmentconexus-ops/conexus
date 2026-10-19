import { CompanyId } from '@conexus/hub-api'
import { and, eq, ne, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { Database } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import type { SealKeys } from '../../platform/seal.ts'
import { open, seal } from '../../platform/seal.ts'
import { sealContext } from './accounts.ts'
import { modelAccount } from './tables.ts'

const Held = z.object({ sealed: z.instanceof(Buffer), key_id: z.string() })

/**
 * Moves every account sealed with a key that only opens to the key that seals (security S32), one
 * company at a time, in its scope with no person, so it reaches its people's own accounts too. A
 * sign-in lives ten minutes and is left to end on its key. A blob that no longer opens stays as it
 * is, counted: it opened under no key before either.
 */
export async function reseal(deps: { database: Database; sealKeys: SealKeys }) {
  const companies = await deps.database.installationRead((tx) =>
    tx.execute(sql`select company_id from builder.companies_with_seals()`),
  )
  const counts = { moved: 0, refused: 0 }
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
        .where(
          and(
            eq(modelAccount.companyId, companyId),
            ne(modelAccount.keyId, deps.sealKeys.sealingId),
          ),
        )
        .for('update')
      for (const row of rows) {
        const context = sealContext({ ...row, companyId })
        const result = await tx.execute(
          sql`select sealed, key_id from builder.sealed_of(${row.id})`,
        )
        const held = Held.parse(result.rows[0])
        try {
          const plain = open(deps.sealKeys, context, { keyId: held.key_id, blob: held.sealed })
          const sealed = seal(deps.sealKeys, context, plain)
          await tx
            .update(modelAccount)
            .set({ sealed: Buffer.from(sealed.blob), keyId: sealed.keyId })
            .where(eq(modelAccount.id, row.id))
          counts.moved += 1
        } catch (error) {
          if (!(error instanceof Failure && error.code === 'SEAL_REFUSED')) throw error
          counts.refused += 1
        }
      }
    })
  }
  return counts
}
