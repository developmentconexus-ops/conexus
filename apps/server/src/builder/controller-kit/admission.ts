import type { IdentityPorts } from '../../hub/identity/public.ts'
import type { ReadTx } from '../../platform/database.ts'
import type { Owner } from './kinds.ts'

/**
 * The person may ask the Assistant, and the agents, now; else `NOT_FOUND` (security S10). The one
 * `askAssistant` admission of `builder/`.
 */
export function admitAsker(identity: IdentityPorts, tx: ReadTx, owner: Owner) {
  const { companyId, personId } = owner
  return identity.admitMember({ tx, companyId, personId, action: 'askAssistant' })
}
