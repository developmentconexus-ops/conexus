import { ConnectionId, ProjectId } from '@conexus/hub-api'
import type { RequestContext } from '@mastra/core/request-context'
import { z } from 'zod'
import type { SessionScope } from '../../hub/connectors/public.ts'
import { ownerOfResource } from '../conversation/public.ts'

/** The thread's marks, stamped by `createSession({ tags })` at creation; never changed. */
export const SESSION_MARK = {
  company: 'companyId',
  person: 'personId',
  project: 'conexusProjectId',
} as const

/** The owner Mastra keeps an Assistant's conversation under: the company with the person, apart from the Builder's. */
export function assistantOwner(owner: {
  companyId: SessionScope['companyId']
  personId: SessionScope['personId']
}): `assistant:company:${string}:person:${string}` {
  return `assistant:company:${owner.companyId}:person:${owner.personId}`
}

/** The thread setting that holds the chosen connections; written only by the Hub's routes. */
export const CHOSEN_SETTING = 'conexusConnections'

/** A thread setting read back from Mastra's storage (code C27). */
type ReadSetting = (key: string) => Promise<unknown>

const Chosen = z.array(ConnectionId)
const ProjectMark = ProjectId.optional()

/**
 * The scope of a thread under its owner: the place from its mark, the choice from its setting; a
 * mark that does not parse gives no scope, a choice that does not parse gives no connection.
 */
export async function scopeOn(input: {
  owner: { companyId: SessionScope['companyId']; personId: SessionScope['personId'] }
  setting: ReadSetting
}): Promise<SessionScope | undefined> {
  const [mark, choice] = await Promise.all([
    input.setting(SESSION_MARK.project),
    input.setting(CHOSEN_SETTING),
  ])
  const project = ProjectMark.safeParse(mark)
  if (!project.success) return undefined
  const chosen = Chosen.safeParse(choice)
  return {
    ...input.owner,
    place:
      project.data === undefined
        ? { kind: 'COMPANY' }
        : { kind: 'PROJECT', projectId: project.data },
    chosen: chosen.success ? chosen.data : [],
  }
}

const Controller = z.object({
  resourceId: z.string(),
  getThreadSetting: z.custom<ReadSetting>((value) => typeof value === 'function'),
})

async function readScope(requestContext: RequestContext): Promise<SessionScope | undefined> {
  const controller = Controller.safeParse(requestContext.get('controller'))
  if (!controller.success) return undefined
  const owner = ownerOfResource(controller.data.resourceId)
  if (owner?.kind !== 'assistant') return undefined
  const { companyId, personId } = owner
  return scopeOn({ owner: { companyId, personId }, setting: controller.data.getThreadSetting })
}

const read = new WeakMap<RequestContext, Promise<SessionScope | undefined>>()

/**
 * The scope for this turn: the owner from the thread's resource, the place from its mark, the choice
 * from its setting, read once per `RequestContext`, so the instructions, the tools and the skills of
 * a run use one value (as the Builder's `grantedFor`); a resumed run brings a new context.
 */
export function sessionScope(requestContext: RequestContext): Promise<SessionScope | undefined> {
  let scope = read.get(requestContext)
  if (scope === undefined) {
    scope = readScope(requestContext)
    read.set(requestContext, scope)
  }
  return scope
}
