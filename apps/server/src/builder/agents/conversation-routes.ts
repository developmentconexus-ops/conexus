import type { AgentConversationSummary, AgentId } from '@conexus/hub-api'
import { ConversationId, createAgentConversation, listAgentConversations } from '@conexus/hub-api'
import type { StorageThreadType } from '@mastra/core/memory'
import type { FastifyInstance } from 'fastify'
import type { Database } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import { answer, serve } from '../../platform/http.ts'
import { attemptIdOf, resourceOf } from '../controller-kit/public.ts'
import type { QueueDeps } from '../model-accounts/public.ts'
import type { InProject, ToolsDeps } from '../tools/public.ts'
import { admitted, databaseScopeOf, inProjectOf } from '../tools/public.ts'
import type { AgentConversations } from './controller.ts'
import { AGENT_MARK } from './controller.ts'
import { openAgentConversation } from './open.ts'
import type { AgentReads } from './registry.ts'

type Deps = Pick<ToolsDeps, 'identity' | 'liveProjectOf'> & {
  database: Database
  queue: QueueDeps
  conversations: AgentConversations
  agents: Pick<AgentReads, 'activeOf' | 'draftOf'>
  log: FailureLog
}

/** The person may manage the Projeto's agents, and the agent is one of the Projeto's (`AGENT_NOT_FOUND`). */
async function admittedTo(deps: Deps, scope: InProject, agentId: AgentId) {
  await deps.database.command(databaseScopeOf(scope), (tx) =>
    admitted(deps, tx, scope, 'manageAgents'),
  )
  return deps.agents.draftOf(scope, agentId)
}

function summaryOf(thread: StorageThreadType, agentId: AgentId): AgentConversationSummary {
  return {
    id: ConversationId.parse(thread.id),
    agentId,
    draft: thread.metadata?.[AGENT_MARK.draft] === 'true',
    title: thread.title ?? '',
    updatedAt: thread.updatedAt.toISOString(),
  }
}

/**
 * A Projeto's agent's conversations (step 24.3, U2): the person's own, with the published version
 * or, `draft`, the test one with the draft; every route admits the person who may manage agents.
 */
export function registerAgentConversationRoutes(app: FastifyInstance, deps: Deps): void {
  const { controller, memory } = deps.conversations
  serve(app, createAgentConversation, async (input) => {
    const scope = inProjectOf(input)
    const { agentId } = input.params
    const draft = input.body.draft ?? false
    const drafted = await admittedTo(deps, scope, agentId)
    const frozen = draft ? drafted : await deps.agents.activeOf(scope, agentId)
    if (frozen === null) throw new Failure('AGENT_NOT_PUBLISHED')
    const owner = { companyId: scope.companyId, personId: scope.personId }
    const id = attemptIdOf('agents', owner, input.attemptKey)
    const opened = await openAgentConversation(
      { ...deps, controller, memory },
      { scope, agentId, draft, frozen, id },
    )
    const resourceId = resourceOf('agents', owner)
    const thread = await memory.getThreadById({ threadId: id, resourceId })
    if (thread === null) throw new Failure('CONVERSATION_NOT_FOUND')
    if (opened.made) {
      const about = {
        companyId: scope.companyId,
        traceId: input.traceId,
        conversationId: id,
        draft,
      }
      deps.log.info({ ...about, agentId }, 'AGENT_CONVERSATION_CREATED')
    }
    return answer({ conversation: summaryOf(thread, agentId) })
  })

  serve(app, listAgentConversations, async (input) => {
    const scope = inProjectOf(input)
    const { agentId } = input.params
    await admittedTo(deps, scope, agentId)
    const owner = { companyId: scope.companyId, personId: scope.personId }
    const { threads } = await memory.listThreads({
      filter: {
        resourceId: resourceOf('agents', owner),
        metadata: { [AGENT_MARK.agent]: agentId },
      },
      perPage: false,
      orderBy: { field: 'updatedAt', direction: 'DESC' },
    })
    return answer({ conversations: threads.map((thread) => summaryOf(thread, agentId)) })
  })
}
