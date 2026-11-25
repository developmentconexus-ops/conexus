import type { ConversationId } from '@conexus/hub-api'
import type { Agent } from '@mastra/core/agent'
import type { RequestContext } from '@mastra/core/request-context'
import type { Memory } from '@mastra/memory'
import type { Owner } from '../../harness/spec/public.ts'
import { runResolver } from '../../harness/spec/public.ts'
import { Failure } from '../../platform/failure.ts'
import type { Activation } from './activation.ts'
import { activationIn, activationScope } from './activation.ts'
import type { AgentRun } from './agent.ts'
import { agentRunIn, setAgentRun, storedOf } from './agent.ts'
import type { Registry, Resolution } from './registry.ts'

type RunOf = (requestContext: RequestContext) => Promise<AgentRun | undefined>
export type ActivationOf = (requestContext: RequestContext) => Promise<Activation | undefined>

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
  const resolved = new WeakMap<RequestContext, Resolution>()
  const scopeOf = runResolver('agents', {
    memory: deps.memory,
    stored: async ({ owner, conversationId }, requestContext) => {
      const run = await deps.keptRun(owner, conversationId)
      if (run === undefined) return undefined
      setAgentRun(requestContext, run)
      const resolution = await deps.registry.resolve(run, activationIn(requestContext))
      resolved.set(requestContext, resolution)
      return storedOf(resolution.agent, requestContext)
    },
  })
  async function runOf(requestContext: RequestContext): Promise<AgentRun | undefined> {
    return (await scopeOf(requestContext)) === undefined ? undefined : agentRunIn(requestContext)
  }
  async function resolvedOf(requestContext: RequestContext): Promise<Agent> {
    const run = await scopeOf(requestContext)
    const agent = resolved.get(requestContext)?.agent
    if (run === undefined || agent === undefined) throw new Failure('CONVERSATION_NOT_FOUND')
    return agent
  }
  /** The activation of the resolution the run's agent came from: the one its turn records. */
  async function activationOfRun(requestContext: RequestContext): Promise<Activation | undefined> {
    await scopeOf(requestContext)
    return resolved.get(requestContext)?.activation
  }
  return { scopeOf, runOf, resolvedOf, activationOfRun }
}

/**
 * The scopes of a new turn: the incoming ones and the activation it begins with, the one of the
 * agent the turn runs (a publication between two reads cannot split them). Mastra stores them
 * with the run and does not call this on a resume, so the turn keeps its activation to its end.
 */
export function scopesOf(runOf: RunOf, activationOf: ActivationOf) {
  return async ({
    scopes,
    requestContext,
  }: {
    scopes: string[]
    requestContext: RequestContext
  }) => {
    const run = await runOf(requestContext)
    if (run === undefined || run.kind === 'DRAFT') return scopes
    const activation = await activationOf(requestContext)
    return activation === undefined ? scopes : [...scopes, activationScope(activation)]
  }
}
