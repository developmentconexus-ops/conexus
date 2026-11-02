import type { OfProject } from '@conexus/hub-api'
import type { FastifyInstance } from 'fastify'
import type { ReleaseScope } from '../conversation/public.ts'
import type { ToolsDeps } from '../tools/public.ts'
import { createTools, registerToolRoutes } from '../tools/public.ts'
import type { AgentsDeps } from './agents.ts'
import { createAgentService } from './agents.ts'
import { agentEvents } from './events.ts'
import { activeOf, draftOf, publishedAll } from './frozen.ts'
import { releaseAgents } from './release.ts'
import { registerAgentRoutes } from './routes.ts'
import { usedBy } from './store.ts'

/**
 * A Projeto's agents and the company's tool library (step 24.3, U1): the routes of both, the
 * service the Construtor calls, the versions as an agent runs them, the removal and the hooks that
 * follow an agent's live version.
 */
export function agentsOf(deps: Omit<ToolsDeps, 'usedBy'> & Pick<AgentsDeps, 'isChoosable'>) {
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
    activeOf: (ids: OfProject, agentId: Parameters<typeof activeOf>[2]) =>
      activeOf(database, ids, agentId),
    draftOf: (ids: OfProject, agentId: Parameters<typeof draftOf>[2]) =>
      draftOf(database, ids, agentId),
    publishedAll: () => publishedAll(database),
    release: (scope: ReleaseScope) =>
      releaseAgents({ database, tools, emit: events.emit, log: deps.log }, scope),
    onChange: events.onChange,
  })
}

export type Agents = ReturnType<typeof agentsOf>
