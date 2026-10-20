import { ModelId } from '@conexus/hub-api'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import type { Database } from '../../platform/database.ts'
import { companyModelFallback } from './tables.ts'
import type { Turn } from './turn.ts'

/**
 * The models the company's automatic switch tries after `modelId` in this turn (founder, card
 * reading 1 A): those after it in the chain, or the whole chain when it is not in it; none when the
 * switch is off. The next turn starts again from the conversation's model.
 */
export async function nextModels(
  deps: { database: Database },
  turn: Turn,
  modelId: ModelId,
): Promise<ModelId[]> {
  const scope = { kind: 'COMPANY' as const, companyId: turn.companyId, personId: turn.personId }
  const [row] = await deps.database.read(scope, (tx) =>
    tx
      .select({ enabled: companyModelFallback.enabled, chain: companyModelFallback.chain })
      .from(companyModelFallback)
      .where(eq(companyModelFallback.companyId, turn.companyId)),
  )
  if (row === undefined || !row.enabled) return []
  const chain = z.array(ModelId).parse(row.chain)
  return chain.slice(chain.indexOf(modelId) + 1)
}
