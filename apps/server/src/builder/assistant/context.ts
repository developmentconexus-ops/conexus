import type { ConnectionId } from '@conexus/hub-api'
import { ConversationId, ProjectId } from '@conexus/hub-api'
import type { RequestContext } from '@mastra/core/request-context'
import { z } from 'zod'
import type { SessionScope } from '../../hub/connectors/public.ts'
import { ownerOfResource } from '../conversation/public.ts'

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

/** The owner Mastra keeps an Assistant's conversation under: the company with the person, apart from the Builder's. */
export function assistantOwner(owner: {
  companyId: SessionScope['companyId']
  personId: SessionScope['personId']
}): `assistant:company:${string}:person:${string}` {
  return `assistant:company:${owner.companyId}:person:${owner.personId}`
}

const ProjectMark = ProjectId.optional()

/** The person an Assistant conversation belongs to, in a company. */
export type Owner = { companyId: SessionScope['companyId']; personId: SessionScope['personId'] }

/** The connections a conversation chose, as the Hub keeps them (`chosen.ts`). */
export type ChosenOf = (
  owner: Owner,
  conversationId: ConversationId,
) => Promise<readonly ConnectionId[]>

/**
 * The scope of a thread under its owner: the place from its mark, the choice as the Hub keeps it;
 * a mark that does not parse gives no scope.
 */
export function scopeOn(input: {
  owner: Owner
  mark: unknown
  chosen: readonly ConnectionId[]
}): SessionScope | undefined {
  const project = ProjectMark.safeParse(input.mark)
  if (!project.success) return undefined
  return {
    ...input.owner,
    place:
      project.data === undefined
        ? { kind: 'COMPANY' }
        : { kind: 'PROJECT', projectId: project.data },
    chosen: input.chosen,
  }
}

const Controller = z.object({
  resourceId: z.string(),
  sessionId: ConversationId,
  getThreadSetting: z.custom<(key: string) => Promise<unknown>>(
    (value) => typeof value === 'function',
  ),
})

export type ScopeOf = (requestContext: RequestContext) => Promise<SessionScope | undefined>

/**
 * The scope for each turn: the owner from the thread's resource, the place from its mark, the
 * choice as the Hub keeps it, read once per `RequestContext`, so the instructions, the tools and
 * the skills of a run use one value (as the Builder's `grantedFor`); a resumed run brings a new
 * context.
 */
export function sessionScopes(deps: { chosenOf: ChosenOf }): ScopeOf {
  async function readScope(requestContext: RequestContext): Promise<SessionScope | undefined> {
    const controller = Controller.safeParse(requestContext.get('controller'))
    if (!controller.success) return undefined
    const owner = ownerOfResource(controller.data.resourceId)
    if (owner?.kind !== 'assistant') return undefined
    const { companyId, personId } = owner
    const [mark, chosen] = await Promise.all([
      controller.data.getThreadSetting(SESSION_MARK.project),
      deps.chosenOf({ companyId, personId }, controller.data.sessionId),
    ])
    return scopeOn({ owner: { companyId, personId }, mark, chosen })
  }
  const read = new WeakMap<RequestContext, Promise<SessionScope | undefined>>()
  return (requestContext) => {
    let scope = read.get(requestContext)
    if (scope === undefined) {
      scope = readScope(requestContext)
      read.set(requestContext, scope)
    }
    return scope
  }
}
