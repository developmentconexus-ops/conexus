import type { CompanyId, Person } from '@conexus/hub-api'
import type { IdentityPorts } from '../../hub/identity/public.ts'
import type { Database, ReadTx } from '../../platform/database.ts'
import type { Owner } from './kinds.ts'

/**
 * The person may ask the Assistant, and the agents, now; else `NOT_FOUND` (security S10). The one
 * `askAssistant` admission of `builder/`.
 */
export function admitAsker(identity: IdentityPorts, tx: ReadTx, owner: Owner) {
  const { companyId, personId } = owner
  return identity.admitMember({ tx, companyId, personId, action: 'askAssistant' })
}

/** `admit` of a part whose conversations need `manageAgents` now: the agents' part and the Construtor's. */
export function agentManagerAdmission(deps: { database: Database; identity: IdentityPorts }) {
  return async (input: { person: Person; companyId: CompanyId }): Promise<void> => {
    const owner = { companyId: input.companyId, personId: input.person.id }
    await deps.database.command({ kind: 'COMPANY', ...owner }, async (tx) => {
      await deps.identity.admitMember({ tx, ...owner, action: 'manageAgents' })
    })
  }
}
