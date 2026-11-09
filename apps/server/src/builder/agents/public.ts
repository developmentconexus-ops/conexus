import type { OfProject } from '@conexus/hub-api'
import type { FastifyInstance } from 'fastify'
import type { ReleaseScope } from '../controller-kit/public.ts'
import type { ToolsDeps } from '../tools/public.ts'
import { createTools, registerToolRoutes } from '../tools/public.ts'
import type { AgentsDeps } from './agents.ts'
import { createAgentService } from './agents.ts'
import type { CodeToolsDeps } from './code-tools.ts'
import { createAgentConversations } from './controller.ts'
import { registerAgentConversationRoutes } from './conversation-routes.ts'
import { openAgentConversation } from './open.ts'

export type { AgentRun } from './agent.ts'
export { agentKey, agentRunContext } from './agent.ts'
export type { AgentService } from './agents.ts'
export type { AppDataPort } from './app-data.ts'
export { companyAgentsOf } from './company-agents.ts'
export type { AgentReads } from './registry.ts'
export { createRegistry } from './registry.ts'

import { agentEvents } from './events.ts'
import { activeOf, draftOf, liveOf, publishedAll, versionOf } from './frozen.ts'
import { releaseAgents } from './release.ts'
import { registerAgentRoutes } from './routes.ts'
import { usedBy } from './store.ts'

/**
 * A Projeto's agents and the company's tool library (step 24.3, U1): the routes of both, the
 * service the Construtor calls, the versions as an agent runs them, the removal and the hooks that
 * follow an agent's live version.
 */
export function agentsOf(
  deps: Omit<ToolsDeps, 'usedBy' | 'identity'> &
    Pick<AgentsDeps, 'identity' | 'isChoosable' | 'liveProjectIdsOf'>,
) {
  const events = agentEvents()
  const tools = createTools({ ...deps, usedBy })
  const service = createAgentService({ ...deps, tools, emit: events.emit })
  const { database } = deps
  return Object.freeze({
    routes: (app: FastifyInstance) => {
      registerAgentRoutes(app, service)
      registerToolRoutes(app, tools)
    },
    service,
    /** The company's tool library, which the Construtor searches and saves into. */
    tools,
    activeOf: (ids: OfProject, agentId: Parameters<typeof activeOf>[2]) =>
      activeOf(database, ids, agentId),
    draftOf: (ids: OfProject, agentId: Parameters<typeof draftOf>[2]) =>
      draftOf(database, ids, agentId),
    versionOf: (
      ids: OfProject,
      agentId: Parameters<typeof versionOf>[2],
      version: Parameters<typeof versionOf>[3],
    ) => versionOf(database, ids, agentId, version),
    liveOf: (companyId: Parameters<typeof liveOf>[1], agentId: Parameters<typeof liveOf>[2]) =>
      liveOf(database, companyId, agentId),
    publishedAll: () => publishedAll(database),
    release: (scope: ReleaseScope) =>
      releaseAgents({ database, tools, emit: events.emit, log: deps.log }, scope),
    onChange: events.onChange,
  })
}

/**
 * The agents of `agentsOf` alive (step 24.3, U2): the agents' conversations, whose part joins the
 * one `Mastra` after the Assistant's, and their routes beside the agents'.
 */
export function agentsAlive(
  deps: Parameters<typeof agentsOf>[0] &
    Omit<Parameters<typeof createAgentConversations>[0], 'agents' | 'codeTools'> &
    Pick<CodeToolsDeps, 'edge' | 'calls'>,
) {
  const agents = agentsOf(deps)
  const codeTools = { ...deps, reupload: agents.tools.reupload }
  const live = createAgentConversations({ ...deps, agents, codeTools })
  return Object.freeze({
    ...agents,
    part: live.part,
    /** The `Agent` of an agent's draft, which runs alone with no thread (the Construtor's test). */
    draftAgent: live.draftAgent,
    /** Opens a conversation with the agent, as its route does, past the admission (U6's run). */
    open: (input: Parameters<typeof openAgentConversation>[1]) =>
      openAgentConversation({ ...deps, ...live }, input),
    routes: (app: FastifyInstance) => {
      agents.routes(app)
      registerAgentConversationRoutes(app, { ...deps, agents, conversations: live })
    },
  })
}

export type AgentsAlive = ReturnType<typeof agentsAlive>
