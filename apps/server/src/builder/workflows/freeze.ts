import type { Balloon, ConnectionId, OperationId } from '@conexus/hub-api'
import type { FrozenWorkflow, ReadyDraft } from './frozen.ts'
import { spotsOf } from './problem-walk.ts'
import type { Seen } from './problem-world-rules.ts'

type Of<K extends Balloon['kind']> = Extract<Balloon, { kind: K }>

type Frozen = {
  agents: Array<FrozenWorkflow['agents'][number]>
  uses: Array<FrozenWorkflow['uses'][number]>
  reads: Array<FrozenWorkflow['reads'][number]>
  declared: Map<string, { connectionId: ConnectionId; operation: OperationId }>
}

function declare(into: Frozen, connectionId: ConnectionId, operation: OperationId): void {
  into.declared.set(`${connectionId}/${operation}`, { connectionId, operation })
}

function freezeRead(seen: Seen, into: Frozen, balloon: Of<'READ'>): void {
  const { connectionId, operation } = balloon
  if (connectionId === null || operation === null) return
  const kit = seen.kits.find((each) => each.connectionId === connectionId)
  const many = kit?.reads.find((each) => each.id === operation)?.many === true
  into.reads.push({ balloonId: balloon.id, many })
  declare(into, connectionId, operation)
}

function freezeAgent(seen: Seen, into: Frozen, balloon: Of<'AGENT'>): void {
  if (balloon.agent?.kind !== 'PUBLISHED') return
  const { agentId } = balloon.agent
  const versionNumber = seen.agents.find((each) => each.agentId === agentId)?.activeVersion
  if (versionNumber !== null && versionNumber !== undefined)
    into.agents.push({ balloonId: balloon.id, agentId, versionNumber })
}

function freezeUse(seen: Seen, into: Frozen, balloon: Of<'USE'>): void {
  const other = seen.workflows.find((each) => each.workflowId === balloon.workflowId)
  if (other?.frozen == null || other.activeVersion === null) return
  into.uses.push({
    balloonId: balloon.id,
    workflowId: other.workflowId,
    versionNumber: other.activeVersion,
    frozen: other.frozen,
  })
  for (const each of other.frozen.declared) declare(into, each.connectionId, each.operation)
}

/** What a ready draft fixes when it is published: each agent at its active version, each other workflow as that version froze it, each read with the kit's `many`, and what it declares. */
export function freezeOf(seen: Seen, ready: ReadyDraft): FrozenWorkflow {
  const into: Frozen = { agents: [], uses: [], reads: [], declared: new Map() }
  for (const { balloon } of spotsOf(ready.balloons)) {
    if (balloon.kind === 'READ') freezeRead(seen, into, balloon)
    else if (balloon.kind === 'WRITE') {
      if (balloon.connectionId !== null && balloon.operation !== null)
        declare(into, balloon.connectionId, balloon.operation)
    } else if (balloon.kind === 'AGENT') freezeAgent(seen, into, balloon)
    else if (balloon.kind === 'USE') freezeUse(seen, into, balloon)
  }
  return {
    draft: ready,
    agents: into.agents,
    uses: into.uses,
    reads: into.reads,
    declared: [...into.declared.values()],
  }
}
