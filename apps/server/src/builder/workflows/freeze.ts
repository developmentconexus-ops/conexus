import type { ConnectionId, OperationId } from '@conexus/hub-api'
import type { FrozenWorkflow, ReadyDraft } from './frozen.ts'
import { spotsOf } from './problem-walk.ts'
import type { Seen } from './problem-world-rules.ts'

/** What a ready draft fixes when it is published: each agent at its active version, each other workflow as that version froze it, each read with the kit's `many`, and what it declares. */
export function freezeOf(seen: Seen, ready: ReadyDraft): FrozenWorkflow {
  const agents: Array<FrozenWorkflow['agents'][number]> = []
  const uses: Array<FrozenWorkflow['uses'][number]> = []
  const reads: Array<FrozenWorkflow['reads'][number]> = []
  const declared = new Map<string, { connectionId: ConnectionId; operation: OperationId }>()
  function declare(connectionId: ConnectionId, operation: OperationId): void {
    declared.set(`${connectionId}/${operation}`, { connectionId, operation })
  }
  for (const { balloon } of spotsOf(ready.balloons)) {
    switch (balloon.kind) {
      case 'READ': {
        const { connectionId, operation } = balloon
        if (connectionId === null || operation === null) break
        const kit = seen.kits.find((each) => each.connectionId === connectionId)
        const many = kit?.reads.find((each) => each.id === operation)?.many === true
        reads.push({ balloonId: balloon.id, many })
        declare(connectionId, operation)
        break
      }
      case 'WRITE':
        if (balloon.connectionId !== null && balloon.operation !== null)
          declare(balloon.connectionId, balloon.operation)
        break
      case 'AGENT': {
        if (balloon.agent?.kind !== 'PUBLISHED') break
        const { agentId } = balloon.agent
        const versionNumber = seen.agents.find((each) => each.agentId === agentId)?.activeVersion
        if (versionNumber !== null && versionNumber !== undefined)
          agents.push({ balloonId: balloon.id, agentId, versionNumber })
        break
      }
      case 'USE': {
        const other = seen.workflows.find((each) => each.workflowId === balloon.workflowId)
        if (other?.frozen == null || other.activeVersion === null) break
        uses.push({
          balloonId: balloon.id,
          workflowId: other.workflowId,
          versionNumber: other.activeVersion,
          frozen: other.frozen,
        })
        for (const each of other.frozen.declared) declare(each.connectionId, each.operation)
        break
      }
      default:
        break
    }
  }
  return { draft: ready, agents, uses, reads, declared: [...declared.values()] }
}
