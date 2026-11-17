import type { ConversationId } from '@conexus/hub-api'
import type { Agent } from '@mastra/core/agent'
import type { RequestContext } from '@mastra/core/request-context'
import type { Memory } from '@mastra/memory'
import { Failure } from '../../platform/failure.ts'
import type { Owner } from '../controller-kit/public.ts'
import { runResolver } from '../controller-kit/public.ts'
import { activationIn, activationScope } from './activation.ts'
import type { AgentRun } from './agent.ts'
import { agentRunIn, setAgentRun, storedOf } from './agent.ts'
import type { Registry } from './registry.ts'

type RunOf = (requestContext: RequestContext) => Promise<AgentRun | undefined>

/**
 * The runs of the agents' conversations: the agent and the draft by the Hub's row (`keptRun`), the
 * version the run resolves to (a turn that began on an activation, which the scopes of a resumed
 * run keep, runs that version; a new turn runs the registered one) and the scope that version
 * keeps, each read once per run.
 */
export function agentRuns(deps: {
  memory: Pick<Memory, 'getThreadById'>
  registry: Registry
  keptRun: (owner: Owner, conversationId: ConversationId) => Promise<AgentRun | undefined>
}) {
  const resolved = new WeakMap<RequestContext, Agent>()
  const scopeOf = runResolver('agents', {
    memory: deps.memory,
    stored: async ({ owner, conversationId }, requestContext) => {
      const run = await deps.keptRun(owner, conversationId)
      if (run === undefined) return undefined
      setAgentRun(requestContext, run)
      const { agent } = await deps.registry.resolve(run, activationIn(requestContext))
      resolved.set(requestContext, agent)
      return storedOf(agent, requestContext)
    },
  })
  async function runOf(requestContext: RequestContext): Promise<AgentRun | undefined> {
    return (await scopeOf(requestContext)) === undefined ? undefined : agentRunIn(requestContext)
  }
  async function resolvedOf(requestContext: RequestContext): Promise<Agent> {
    const run = await scopeOf(requestContext)
    const agent = resolved.get(requestContext)
    if (run === undefined || agent === undefined) throw new Failure('CONVERSATION_NOT_FOUND')
    return agent
  }
  return { scopeOf, runOf, resolvedOf }
}

/**
 * The scopes of a new turn: the incoming ones and the activation it begins with. Mastra stores them
 * with the run and does not call this on a resume, so the turn keeps its activation to its end.
 */
export function scopesOf(runOf: RunOf, registry: Registry) {
  return async ({
    scopes,
    requestContext,
  }: {
    scopes: string[]
    requestContext: RequestContext
  }) => {
    const run = await runOf(requestContext)
    if (run === undefined || run.kind === 'DRAFT') return scopes
    const { activation } = await registry.resolve(run)
    return activation === undefined ? scopes : [...scopes, activationScope(activation)]
  }
}
