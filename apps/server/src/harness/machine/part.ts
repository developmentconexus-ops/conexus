import type { ConversationId } from '@conexus/hub-api'
import type { ConversationMachines } from './conversation.ts'

/**
 * What an agent's part of the Hub's `Mastra` takes from its conversation machines: the phases its
 * turn's end tells, the stop after the runs `drain` stopped, and what a release does to each
 * conversation it deletes.
 */
export function machinePart(machines: ConversationMachines) {
  return {
    ends: { onPhase: machines.onPhase.bind(machines) },
    close: () => machines.stopAll(),
    each: (id: ConversationId) => machines.kill(id),
  }
}
