import type { CompanyId, ConversationId } from '@conexus/hub-api'
import type { NetworkStore } from '../network/public.ts'
import type { ConversationMachines } from './conversation.ts'

/** Domains first: a kill that then fails leaves the machine for the next delete to find again. */
export function deletionOf(
  machines: Pick<ConversationMachines, 'kill'>,
  lists: Pick<NetworkStore, 'forget'>,
  companyId: CompanyId,
) {
  return async (conversationId: ConversationId) => {
    await lists.forget({ companyId, conversationId })
    await machines.kill(conversationId)
  }
}

/**
 * What an agent's part of the Hub's `Mastra` takes from its conversation machines: the phases its
 * turn's end tells, the stop after the runs `drain` stopped, and what a release does to each
 * conversation of a company it deletes. A domain removed closes in the running machines.
 */
export function machinePart(
  machines: ConversationMachines,
  lists: Pick<NetworkStore, 'onRemoved' | 'forget'>,
) {
  lists.onRemoved((companyId) => void machines.narrow(companyId))
  return {
    ends: { onPhase: machines.onPhase.bind(machines) },
    close: () => machines.stopAll(),
    each: (companyId: CompanyId) => deletionOf(machines, lists, companyId),
  }
}
