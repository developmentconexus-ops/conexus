import type { Connector } from '@conexus/connectors'
import { connectorOf } from '@conexus/connectors'
import { CompanyId, ConnectionId } from '@conexus/hub-api'
import { eq, sql } from 'drizzle-orm'
import type { CommandTx, Database } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import type { SealKeys } from '../../platform/seal.ts'
import { open, seal } from '../../platform/seal.ts'
import { sealContext, sealedOf } from './connections.ts'
import { connection } from './tables.ts'

/**
 * One connection: opened, and sealed again only when its key is not the one that seals. One of a
 * connector the kit no longer has cannot rebuild its context, so it counts refused.
 */
async function resealRow(
  deps: { sealKeys: SealKeys },
  tx: CommandTx,
  companyId: CompanyId,
  row: { id: ConnectionId; connector: Connector | undefined },
): Promise<'moved' | 'kept' | 'refused'> {
  const { id, connector } = row
  if (connector === undefined) return 'refused'
  const context = sealContext({ id, companyId, connector })
  const held = await sealedOf(tx, row.id)
  try {
    const plain = open(deps.sealKeys, context, held)
    if (held.keyId === deps.sealKeys.sealingId) return 'kept'
    const sealed = seal(deps.sealKeys, context, plain)
    await tx
      .update(connection)
      .set({ sealed: Buffer.from(sealed.blob), keyId: sealed.keyId })
      .where(eq(connection.id, row.id))
    return 'moved'
  } catch (error) {
    if (!(error instanceof Failure && error.code === 'SEAL_REFUSED')) throw error
    return 'refused'
  }
}

/**
 * Moves every connection sealed with a key that only opens to the key that seals (security S32),
 * one company at a time, as the model accounts' `reseal` does. When none opens, the key file is
 * wrong, and the command fails rather than hide it.
 */
export async function reseal(deps: { database: Database; sealKeys: SealKeys }) {
  const companies = await deps.database.installationRead((tx) =>
    tx.execute(sql`select company_id from connectors.companies_with_seals()`),
  )
  const counts = { moved: 0, kept: 0, refused: 0 }
  for (const found of companies.rows) {
    const companyId = CompanyId.parse(Object(found).company_id)
    const scope = { kind: 'COMPANY', companyId, personId: null } as const
    await deps.database.command(scope, async (tx) => {
      const rows = await tx
        .select({ id: connection.id, connectorId: connection.connectorId })
        .from(connection)
        .where(eq(connection.companyId, companyId))
        .for('update')
      for (const row of rows) {
        const id = ConnectionId.parse(row.id)
        const connector = connectorOf(row.connectorId)
        counts[await resealRow(deps, tx, companyId, { id, connector })] += 1
      }
    })
  }
  if (counts.refused > 0 && counts.moved + counts.kept === 0)
    throw new Failure('SEAL_REFUSED', { details: { refused: counts.refused } })
  return { moved: counts.moved, refused: counts.refused }
}
