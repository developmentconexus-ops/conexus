import {
  activateAgentVersion,
  createAgent,
  deleteAgent,
  getAgent,
  listAgents,
  listAgentVersions,
  publishAgent,
  saveAgentDraft,
} from '@conexus/hub-api'
import type { FastifyInstance } from 'fastify'
import { answer, serve } from '../../platform/http.ts'
import { inProjectOf } from '../tools/public.ts'
import type { AgentService } from './agents.ts'

/** A Projeto's agents' routes (step 24.3, U1); the service admits the person on each. */
export function registerAgentRoutes(app: FastifyInstance, agents: AgentService): void {
  serve(app, listAgents, async (input) => {
    const { projectId } = input.query
    if (projectId === undefined) {
      const { companyId } = input.params
      return answer({ agents: await agents.listCompany({ companyId, personId: input.person.id }) })
    }
    const params = { ...input.params, projectId }
    return answer({ agents: await agents.list(inProjectOf({ ...input, params })) })
  })
  serve(app, createAgent, async (input) =>
    answer({ agent: await agents.create(inProjectOf(input), input.body, input.attemptKey) }),
  )
  serve(app, getAgent, async (input) =>
    answer({ agent: await agents.get(inProjectOf(input), input.params.agentId) }),
  )
  serve(app, saveAgentDraft, async (input) =>
    answer({
      agent: await agents.saveDraft(inProjectOf(input), input.params.agentId, input.body, 'PERSON'),
    }),
  )
  serve(app, publishAgent, async (input) =>
    answer(await agents.publish(inProjectOf(input), input.params.agentId, input.body)),
  )
  serve(app, listAgentVersions, async (input) =>
    answer({ versions: await agents.versions(inProjectOf(input), input.params.agentId) }),
  )
  serve(app, activateAgentVersion, async (input) => {
    const { agentId, number } = input.params
    return answer({ agent: await agents.activate(inProjectOf(input), agentId, number) })
  })
  serve(app, deleteAgent, async (input) => {
    await agents.remove(inProjectOf(input), input.params.agentId)
    return answer(undefined)
  })
}
