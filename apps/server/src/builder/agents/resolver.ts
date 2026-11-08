import type { Agent } from '@mastra/core/agent'
import type { RequestContext } from '@mastra/core/request-context'
import { Failure } from '../../platform/failure.ts'
import { oncePerRun } from '../controller-kit/public.ts'
import { activationIn, activationScope } from './activation.ts'
import type { AgentRun } from './agent.ts'
import { setAgentRun } from './agent.ts'
import type { Registry } from './registry.ts'

type RunOf = (requestContext: RequestContext) => Promise<AgentRun | undefined>
type Resolved = (requestContext: RequestContext) => Promise<Agent>

/**
 * The agent a run's context names. A turn that began on an activation, which the scopes of a resumed
 * run keep, runs that version; a new turn runs the registered one.
 */
export function resolverOf(runOf: RunOf, registry: Registry): Resolved {
  return oncePerRun(async (requestContext) => {
    const run = await runOf(requestContext)
    if (run === undefined) throw new Failure('CONVERSATION_NOT_FOUND')
    setAgentRun(requestContext, run)
    return (await registry.resolve(run, activationIn(requestContext))).agent
  })
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
