import type { ConversationId } from '@conexus/hub-api'
import type { RequestContext } from '@mastra/core/request-context'
import type { Memory } from '@mastra/memory'
import { MARK } from '../../harness/machine/public.ts'
import { conversationRun } from '../../harness/memory/public.ts'
import type { Owner, RunScope, Speakers } from '../../harness/spec/public.ts'
import { admitAsker, oncePerRun, ownerOfResource, runResolver } from '../../harness/spec/public.ts'
import type { CompanyProjects } from '../../harness/tools/public.ts'
import type { Place } from '../../hub/access/public.ts'
import type { IdentityPorts } from '../../hub/identity/public.ts'
import type { Database } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import type { Kept } from './chosen.ts'
import { placeOf } from './open.ts'

/** The place and choice of a conversation of the owner's (`chosen.ts`). */
export type ChosenOf = (owner: Owner, conversationId: ConversationId) => Promise<Kept>

export type RunOf = (requestContext: RequestContext) => Promise<RunScope | undefined>

/**
 * The Assistant's run: the place and the choice from the Hub's row (`chosen.ts`), never from the
 * thread's marks; a run an automation opened is unattended, which its marks say.
 */
export function assistantRuns(deps: {
  memory: Pick<Memory, 'getThreadById'>
  chosenOf: ChosenOf
}): RunOf {
  return runResolver('assistant', {
    memory: deps.memory,
    stored: async ({ owner, conversationId, mark }) => {
      const kept = await deps.chosenOf(owner, conversationId)
      return {
        place: placeOf(kept.projectId),
        choice: { kind: 'CHOSEN', connections: kept.connections },
        ceiling: { kind: 'PERSON' },
        attended: mark.automation === undefined,
      }
    },
  })
}

/**
 * The marks of the conversation's machine: its company and, in a Projeto, the Projeto (S36), from
 * the resource and the Hub's row. The machine opens with the conversation, before its thread is
 * there to read its marks; the guard refuses a thread marked for someone else before any turn.
 */
export function machineMarks(chosenOf: ChosenOf) {
  return oncePerRun(async (requestContext) => {
    const run = conversationRun(requestContext)
    const resource = run === undefined ? undefined : ownerOfResource(run.resourceId)
    if (run === undefined || resource?.kind !== 'assistant') return undefined
    const owner = { companyId: resource.companyId, personId: resource.personId }
    const { projectId } = await chosenOf(owner, run.sessionId)
    return {
      [MARK.company]: owner.companyId,
      ...(projectId === null ? {} : { [MARK.project]: projectId }),
    }
  })
}

function readerScope(owner: Owner) {
  return { kind: 'COMPANY', ...owner } as const
}

/**
 * The company, the person with their role, job title and department, and the Projeto the
 * conversation lives in, for its block.
 */
export function speakersOf(
  deps: {
    database: Database
    identity: IdentityPorts
    projects: Pick<CompanyProjects, 'liveProjectOf'>
  },
  scope: Readonly<{ owner: Owner; place: Place }>,
): Promise<Speakers> {
  const { owner, place } = scope
  return deps.database.read(readerScope(owner), async (tx) => {
    const admitted = await admitAsker(deps.identity, tx, owner)
    const { companyId, personId } = owner
    const company = await deps.identity.companyNameOf(tx, { admitted, companyId })
    const person = await deps.identity.personNameOf(tx, personId)
    const profile = await deps.identity.memberProfileOf(tx, { companyId, personId })
    const project =
      place.kind === 'PROJECT'
        ? await deps.projects.liveProjectOf(tx, { companyId, projectId: place.projectId })
        : undefined
    if (company === undefined || person === undefined) {
      throw new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'PROMPT_SPEAKER_GONE' } })
    }
    if (place.kind === 'PROJECT' && project === undefined) {
      throw new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'PROMPT_PROJECT_GONE' } })
    }
    return { company, person, role: admitted.role, ...profile, projectName: project?.name }
  })
}
