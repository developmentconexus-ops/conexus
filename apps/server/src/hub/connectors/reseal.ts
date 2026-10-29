import { connectorOf } from '@conexus/connectors'
import type { CompanyId } from '@conexus/hub-api'
import { ConnectionId } from '@conexus/hub-api'
import { eq, sql } from 'drizzle-orm'
import type { CommandTx, Database } from '../../platform/database.ts'
import type { Resealed } from '../../platform/reseal.ts'
import { resealCompanies, resealOne } from '../../platform/reseal.ts'
import type { Sealed, SealKeys } from '../../platform/seal.ts'
import { sealContext, sealedOf } from './rows.ts'
import { connection } from './tables.ts'

/** One company's connections; one of a connector the kit no longer has cannot rebuild its context. */
async function resealCompany(
  keys: SealKeys,
  tx: CommandTx,
  companyId: CompanyId,
): Promise<Resealed[]> {
  const rows = await tx
    .select({ id: connection.id, connectorId: connection.connectorId })
    .from(connection)
    .where(eq(connection.companyId, companyId))
    .for('update')
  const outcomes: Resealed[] = []
  for (const row of rows) {
    const id = ConnectionId.parse(row.id)
    const connector = connectorOf(row.connectorId)
    if (connector === undefined) {
      outcomes.push('refused')
      continue
    }
    const context = sealContext({ id, companyId, connector })
    async function write(sealed: Sealed) {
      await tx
        .update(connection)
        .set({ sealed: Buffer.from(sealed.blob), keyId: sealed.keyId })
        .where(eq(connection.id, id))
    }
    outcomes.push(await resealOne(keys, context, await sealedOf(tx, id), write))
  }
  return outcomes
}

/** Every connection on the key that seals, as the model accounts' `reseal` does (S32). */
export function reseal(deps: { database: Database; sealKeys: SealKeys }) {
  return resealCompanies(
    deps.database,
    sql`select company_id from connectors.companies_with_seals()`,
    (tx, companyId) => resealCompany(deps.sealKeys, tx, companyId),
  )
}
