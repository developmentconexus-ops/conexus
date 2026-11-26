import type { ConversationId } from '@conexus/hub-api'
import { AgentId, AutomationId, CompanyId, PersonId, ProjectId } from '@conexus/hub-api'
import type { RequestContext } from '@mastra/core/request-context'
import type { Memory } from '@mastra/memory'
import { z } from 'zod'
import type { Choice, Place, Principal } from '../../hub/access/public.ts'
import { principalFor } from '../../hub/access/public.ts'
import type { Declared } from '../../hub/identity/public.ts'
import { Failure } from '../../platform/failure.ts'
import { conversationRun } from '../memory/public.ts'
import type { ControllerKind, Owner } from './kinds.ts'
import { ownerOfResource } from './kinds.ts'
import { oncePerRun } from './once.ts'

/** How far a run may read: the role of whoever converses, or what a version declares. */
type Ceiling = Readonly<{ kind: 'PERSON' } | { kind: 'DECLARED'; declared: Declared }>

/** The conversation a run is of: a kept thread, or the Construtor's test of a draft, which has none. */
type RunThread = Readonly<{ kind: 'THREAD'; id: ConversationId } | { kind: 'TRIAL' }>

/** Whose run, where, on which connections and how far, read once per run from what the Hub keeps. */
export type RunScope = Readonly<{
  kind: ControllerKind
  owner: Owner
  place: Place
  conversation: RunThread
  choice: Choice
  ceiling: Ceiling
  /** Whether a person follows the run; an automation's run has nobody to answer a card. */
  attended: boolean
}>

/** What the owner of a conversation keeps of it, or the thread's marks where the owner keeps no row (the Construtor's Projeto, the Assistant's `attended`). */
export type Stored = Readonly<{ place: Place; choice: Choice; ceiling: Ceiling; attended: boolean }>

/** The kinds whose threads are born with marks (`createSession({ tags })`); the Builder's carry none. */
export type MarkedKind = Exclude<ControllerKind, 'builder'>

type MarkKeys = Readonly<{
  company: string
  person: string
  project: string
  automation?: string
  automationName?: string
  agent?: string
  draft?: string
}>

/** The keys of each kind's marks, byte for byte as the threads kept today carry them. */
export const RUN_MARKS = {
  assistant: {
    company: 'companyId',
    person: 'personId',
    project: 'conexusProjectId',
    automation: 'conexusAutomation',
    automationName: 'conexusAutomationName',
  },
  construtor: {
    company: 'conexusConstrutorCompany',
    person: 'conexusConstrutorPerson',
    project: 'conexusConstrutorProject',
  },
  agents: {
    company: 'conexusAgentCompany',
    person: 'conexusAgentPerson',
    project: 'conexusAgentProject',
    agent: 'conexusAgent',
    draft: 'conexusAgentDraft',
  },
} as const satisfies Record<MarkedKind, MarkKeys>

export type RunMark = Readonly<{
  companyId: CompanyId
  personId: PersonId
  projectId?: ProjectId
  automation?: { automationId: AutomationId; name: string }
  agent?: { agentId: AgentId; draft: boolean }
}>

/** The fields of a mark by name, so one schema reads any kind: each kind's keys come from `RUN_MARKS`. */
const MARK_FIELDS = z.object({
  company: CompanyId,
  person: PersonId,
  project: ProjectId.optional(),
  automation: AutomationId.optional(),
  automationName: z.string().optional(),
  agent: AgentId.optional(),
  draft: z.enum(['true', 'false']).optional(),
})

/**
 * The schema of a kind's marks: who and where the thread was opened for, compared later with its
 * resource. The kind's keys are those `marksOf` writes (`RUN_MARKS`); a key the kind lacks reads as
 * absent, and a mark missing or of another type is refused.
 */
export function markSchema(kind: MarkedKind): z.ZodType<RunMark> {
  const keys: MarkKeys = RUN_MARKS[kind]
  const named = z.preprocess((metadata) => {
    if (typeof metadata !== 'object' || metadata === null) return metadata
    const entries = Object.entries(keys).map(([field, key]) => [field, Reflect.get(metadata, key)])
    return Object.fromEntries(entries)
  }, MARK_FIELDS)
  return named.pipe(
    z.transform(
      (fields): RunMark => ({
        companyId: fields.company,
        personId: fields.person,
        projectId: fields.project,
        automation:
          fields.automation === undefined
            ? undefined
            : { automationId: fields.automation, name: fields.automationName ?? '' },
        agent:
          fields.agent === undefined
            ? undefined
            : { agentId: fields.agent, draft: fields.draft === 'true' },
      }),
    ),
  )
}

/** The marks a thread of the kind is born with (`createSession({ tags })`), the same keys as `RUN_MARKS`. */
export function marksOf(kind: MarkedKind, mark: RunMark): Record<string, string> {
  const keys: MarkKeys = RUN_MARKS[kind]
  const { automation, agent, projectId } = mark
  return {
    [keys.company]: mark.companyId,
    [keys.person]: mark.personId,
    ...(projectId === undefined ? {} : { [keys.project]: projectId }),
    ...(automation === undefined || keys.automation === undefined
      ? {}
      : {
          [keys.automation]: automation.automationId,
          ...(keys.automationName === undefined ? {} : { [keys.automationName]: automation.name }),
        }),
    ...(agent === undefined || keys.agent === undefined
      ? {}
      : {
          [keys.agent]: agent.agentId,
          ...(keys.draft === undefined ? {} : { [keys.draft]: String(agent.draft) }),
        }),
  }
}

type StoredOf = (
  found: Readonly<{ owner: Owner; conversationId: ConversationId; mark: RunMark }>,
  requestContext: RequestContext,
) => Promise<Stored | undefined>

/**
 * The scope of each run of the kind, read once per `RequestContext` (Factory `tools/scope.ts`): the
 * owner from the thread's resource, the marks only to refuse a thread opened for someone else, and
 * the rest from what the owner keeps (`stored`). None outside a run of the kind, for a thread whose
 * marks name another company or person, or for a conversation the owner no longer keeps.
 */
export function runResolver(
  kind: ControllerKind,
  deps: Readonly<{ memory: Pick<Memory, 'getThreadById'>; stored: StoredOf }>,
): (requestContext: RequestContext) => Promise<RunScope | undefined> {
  return oncePerRun(async (requestContext) => {
    const run = conversationRun(requestContext)
    if (run === undefined) return undefined
    const resource = ownerOfResource(run.resourceId)
    if (resource?.kind !== kind) return undefined
    const owner = { companyId: resource.companyId, personId: resource.personId }
    const thread =
      kind === 'builder'
        ? null
        : await deps.memory.getThreadById({ threadId: run.sessionId, resourceId: run.resourceId })
    const mark = markIn(kind, thread?.metadata, owner)
    if (mark === undefined) return undefined
    const stored = await deps.stored({ owner, conversationId: run.sessionId, mark }, requestContext)
    if (stored === undefined) return undefined
    return { kind, owner, conversation: { kind: 'THREAD', id: run.sessionId }, ...stored }
  })
}

/**
 * The thread's marks, when they name the company and the person of its resource; none for a thread
 * opened for someone else. The Builder's thread carries none, so its mark is its resource's owner.
 */
export function markIn(kind: ControllerKind, metadata: unknown, owner: Owner): RunMark | undefined {
  if (kind === 'builder') return owner
  const mark = markSchema(kind).safeParse(metadata).data
  if (mark?.companyId !== owner.companyId || mark.personId !== owner.personId) return undefined
  return mark
}

/** Who the access door answers for in the run: the conversation's kind, its person, place and choice. */
export function principalOf(run: RunScope): Principal {
  const { companyId, personId } = run.owner
  const { place, choice } = run
  switch (run.kind) {
    case 'assistant':
      return principalFor({ consumer: 'assistant', companyId, personId, place, choice })
    case 'builder':
    case 'construtor': {
      if (place.kind !== 'PROJECT') {
        throw new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'RUN_WITHOUT_PROJECT' } })
      }
      return principalFor({ consumer: run.kind, companyId, personId, projectId: place.projectId })
    }
    case 'agents':
      return run.ceiling.kind === 'DECLARED'
        ? principalFor({
            ...{ consumer: 'agent', companyId, personId, place, choice },
            declared: run.ceiling.declared,
          })
        : principalFor({ consumer: 'assistant', companyId, personId, place, choice })
    default:
      return run.kind satisfies never
  }
}

/** What a run tells the data door beyond its principal: the conversation, and the saved agent when it is one. */
export type DataBinding = Readonly<{ thread: ConversationId | null; agentId?: AgentId }>

/** The conversation a run reads in, as the data door records it; the Construtor's test of a draft has none. */
export function dataContextOf(run: RunScope): DataBinding {
  return { thread: run.conversation.kind === 'THREAD' ? run.conversation.id : null }
}
