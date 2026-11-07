import type { ConversationId } from '@conexus/hub-api'
import { ConnectorId, OperationId } from '@conexus/hub-api'
import type { Connectors } from '../../hub/connectors/public.ts'
import type { Owner } from '../controller-kit/public.ts'
import type { MayApprove, WriteOf } from '../conversation/public.ts'
import type { AgentRun } from './agent.ts'
import type { PresetFrozenTool } from './frozen.ts'
import type { Holding } from './publish.ts'
import { holdsWrite } from './publish.ts'
import type { AgentReads } from './registry.ts'

type Kept = (owner: Owner, id: ConversationId) => Promise<AgentRun | undefined>
type Reads = Pick<AgentReads, 'activeOf' | 'draftOf'>

/** The write a tool of a conversation's agent is, from the version it runs or its draft, with that run. */
async function writeIn(keptRun: Kept, reads: Reads, input: Parameters<WriteOf>[0]) {
  const { companyId, personId, conversationId, toolName } = input
  const run = await keptRun({ companyId, personId }, conversationId)
  if (run === undefined) return undefined
  const version =
    run.kind === 'DRAFT'
      ? await reads.draftOf(run.scope, run.agentId)
      : await reads.activeOf(run.scope, run.agentId)
  const tool = version?.tools.find(
    (each): each is PresetFrozenTool => each.kind === 'PRESET' && `tool_${each.slug}` === toolName,
  )
  return tool === undefined ? undefined : { run, tool }
}

/**
 * The write a tool of a conversation's agent is (step 24.5), from the version it runs or its
 * draft: the log of a card's answer says which connection and operation it was about, and a
 * Recusar has no send to join it to.
 */
export function writeOfAgents(keptRun: Kept, reads: Reads) {
  return async (input: Parameters<WriteOf>[0]): ReturnType<WriteOf> => {
    const found = await writeIn(keptRun, reads, input)
    if (found === undefined) return undefined
    return { connectionId: found.tool.connectionId, operation: found.tool.operation }
  }
}

/**
 * Whether the person answering a card holds its write in their own role, read now (step 24.5,
 * D3-a): the version speaks by what it declares, but who lets it write must hold the write too. A
 * tool that is no write of the run, or a connection the Projeto no longer offers, is not held.
 */
export function mayApproveAgents(
  keptRun: Kept,
  reads: Reads,
  deps: Holding & { connectors: Pick<Connectors['assistant'], 'connections'> },
) {
  return async (input: Parameters<MayApprove>[0]): ReturnType<MayApprove> => {
    const found = await writeIn(keptRun, reads, input)
    if (found === undefined) return false
    const { companyId, personId, projectId } = found.run.scope
    const offered = await deps.connectors.connections({
      ...{ companyId, personId, place: { kind: 'PROJECT', projectId } },
      chosen: [],
    })
    const home = offered.find((each) => each.connectionId === found.tool.connectionId)
    if (home === undefined) return false
    return holdsWrite(deps, input.companyId, input.personId, {
      connectionId: found.tool.connectionId,
      connectorId: ConnectorId.parse(home.connector),
      operationId: OperationId.parse(found.tool.operation),
    })
  }
}
