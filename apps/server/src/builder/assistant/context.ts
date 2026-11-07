import type { ConnectionId, ProjectId } from '@conexus/hub-api'
import { ConversationId } from '@conexus/hub-api'
import type { RequestContext } from '@mastra/core/request-context'
import { z } from 'zod'
import type { SessionScope } from '../../hub/connectors/public.ts'
import { oncePerRun, ownerOfResource } from '../controller-kit/public.ts'
import { MARK } from '../machine/public.ts'

/**
 * The thread's marks, stamped by `createSession({ tags })` at creation; never changed. A
 * conversation an automation's run opened carries the automation's id and its name at that run
 * (step 24.2), text marks because `tags` are `Record<string, string>`.
 */
export const SESSION_MARK = {
  company: 'companyId',
  person: 'personId',
  project: 'conexusProjectId',
  automation: 'conexusAutomation',
  automationName: 'conexusAutomationName',
} as const

/** The person an Assistant conversation belongs to, in a company. */
export type Owner = { companyId: SessionScope['companyId']; personId: SessionScope['personId'] }

/** A conversation's place and choice, as the Hub keeps them (`chosen.ts`). */
export type Kept = { projectId: ProjectId | null; connections: readonly ConnectionId[] }

/** The place and choice of a conversation of the owner's (`chosen.ts`). */
export type ChosenOf = (owner: Owner, conversationId: ConversationId) => Promise<Kept>

/** The scope of a conversation under its owner: its place and choice as the Hub keeps them. */
export function scopeOn(owner: Owner, kept: Kept): SessionScope {
  return {
    ...owner,
    place:
      kept.projectId === null
        ? { kind: 'COMPANY' }
        : { kind: 'PROJECT', projectId: kept.projectId },
    chosen: kept.connections,
  }
}

const Controller = z.object({
  resourceId: z.string(),
  sessionId: ConversationId,
})

export type ScopeOf = (requestContext: RequestContext) => Promise<SessionScope | undefined>

/** The conversation a run belongs to, from the controller's mark on its context; none outside one. */
export function runConversation(requestContext: RequestContext) {
  const controller = Controller.safeParse(requestContext.get('controller'))
  return controller.success ? controller.data : undefined
}

/**
 * The scope for each turn: the owner from the thread's resource, the place and the
 * choice as the Hub keeps them, read once per `RequestContext`, so the instructions, the tools and
 * the skills of a run use one value (as the Builder's `grantedFor`); a resumed run brings a new
 * context.
 */
export function sessionScopes(deps: { chosenOf: ChosenOf }): ScopeOf {
  return oncePerRun(async (requestContext) => {
    const run = runConversation(requestContext)
    if (run === undefined) return undefined
    const owner = ownerOfResource(run.resourceId)
    if (owner?.kind !== 'assistant') return undefined
    const { companyId, personId } = owner
    const owned = { companyId, personId }
    return scopeOn(owned, await deps.chosenOf(owned, run.sessionId))
  })
}

/** The marks of the conversation's machine: its company and, in a Projeto, the Projeto (S36). */
export function machineMarks(scopeOf: ScopeOf) {
  return async (requestContext: RequestContext) => {
    const scope = await scopeOf(requestContext)
    if (scope === undefined) return undefined
    return {
      [MARK.company]: scope.companyId,
      ...(scope.place.kind === 'PROJECT' ? { [MARK.project]: scope.place.projectId } : {}),
    }
  }
}
