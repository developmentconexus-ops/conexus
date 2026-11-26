import type { CompanyId, ConversationId } from '@conexus/hub-api'
import type { ConversationMachines } from './conversation.ts'

/** Who tells of a domain a company's list lost, as the network's store does. */
type Removals = { onRemoved(listener: (companyId: CompanyId) => void): unknown }

/**
 * What an agent's part of the Hub's `Mastra` takes from its conversation machines: the phases its
 * turn's end tells, the stop after the runs `drain` stopped, and what a release does to each
 * conversation it deletes. With `removals`, a domain removed closes in the running machines.
 */
export function machinePart(machines: ConversationMachines, removals?: Removals) {
  removals?.onRemoved((companyId) => void machines.narrow(companyId))
  return {
    ends: { onPhase: machines.onPhase.bind(machines) },
    close: () => machines.stopAll(),
    each: (id: ConversationId) => machines.kill(id),
  }
}
