import type { AgentConversationSummary, AgentId } from '@conexus/hub-api'
import {
  AGENT_FILE,
  ConversationId,
  createAgentConversation,
  listAgentConversations,
  listWrites,
} from '@conexus/hub-api'
import type { StorageThreadType } from '@mastra/core/memory'
import type { FastifyInstance } from 'fastify'
import type { Connectors } from '../../hub/connectors/public.ts'
import type { Database } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import { answer, serve } from '../../platform/http.ts'
import { attemptIdOf, listOwned, ownThread, resourceOf } from '../controller-kit/public.ts'
import { registerFile } from '../machine/public.ts'
import type { QueueDeps } from '../model-accounts/public.ts'
import type { InProject, ToolsDeps } from '../tools/public.ts'
import { admitted, databaseScopeOf, inProjectOf, sessionScopeOf } from '../tools/public.ts'
import type { AgentConversations } from './controller.ts'
import { AGENT_MARK, keptRun } from './controller.ts'
import { openAgentConversation } from './open.ts'
import type { AgentReads } from './registry.ts'

type Deps = Pick<ToolsDeps, 'identity' | 'liveProjectOf'> & {
  database: Database
  queue: QueueDeps
  conversations: AgentConversations
  agents: Pick<AgentReads, 'activeOf' | 'draftOf'>
  connectors: Pick<Connectors['assistant'], 'writes'>
  log: FailureLog
}

/** The person may manage the Projeto's agents, and the agent is one of the Projeto's (`AGENT_NOT_FOUND`). */
async function admittedTo(deps: Deps, scope: InProject, agentId: AgentId) {
  await mayManage(deps, scope)
  return deps.agents.draftOf(scope, agentId)
}

async function mayManage(deps: Deps, scope: InProject) {
  await deps.database.command(databaseScopeOf(scope), (tx) =>
    admitted(deps, tx, scope, 'manageAgents'),
  )
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

/** The conversation of the person in this agent and Projeto, else `CONVERSATION_NOT_FOUND` (S10): the one admission of both write routes. */
async function ownConversation(
  deps: Deps,
  input: Parameters<typeof inProjectOf>[0] & {
    params: { agentId: AgentId; conversationId: ConversationId }
  },
) {
  const scope = inProjectOf(input)
  const { agentId, conversationId } = input.params
  await admittedTo(deps, scope, agentId)
  const owner = { companyId: scope.companyId, personId: scope.personId }
  const run = await keptRun(deps.database, owner, conversationId)
  if (run?.agentId !== agentId || run.scope.projectId !== scope.projectId) {
    throw new Failure('CONVERSATION_NOT_FOUND')
  }
  return { scope: sessionScopeOf(scope), threadId: conversationId }
}

/**
 * What the card reads (step 24.5): the conversation's writes as the record keeps them; a
 * conversation of another person or agent is not found (S10).
 */
function serveWrites(app: FastifyInstance, deps: Deps): void {
  serve(app, listWrites, async (input) => {
    const kept = await deps.connectors.writes(await ownConversation(deps, input))
    const writes = kept.map(({ since, ...row }) => ({ ...row, sentAt: since.toISOString() }))
    return answer({ writes })
  })
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
      { ...deps, controller, memory, machines: deps.conversations.machines },
      { scope, agentId, draft, frozen, id },
    )
    const thread = await ownThread(memory, 'agents', owner, id)
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
    const threads = await listOwned(memory, 'agents', owner, { [AGENT_MARK.agent]: agentId })
    return answer({ conversations: threads.map((thread) => summaryOf(thread, agentId)) })
  })
  serveWrites(app, deps)

  registerFile(app, {
    route: AGENT_FILE,
    machines: deps.conversations.machines,
    log: deps.log,
    served: 'AGENT_FILE_READ',
    ownConversation: async (owner, conversationId) => {
      const run = await keptRun(deps.database, owner, conversationId)
      const thread = await memory.getThreadById({
        threadId: conversationId,
        resourceId: resourceOf('agents', owner),
      })
      if (run === undefined || thread === null) throw new Failure('CONVERSATION_NOT_FOUND')
      await mayManage(deps, { ...owner, projectId: run.scope.projectId })
    },
  })
}
