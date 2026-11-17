import type { ConversationId } from '@conexus/hub-api'
import type { RequestContext } from '@mastra/core/request-context'
import type { Memory } from '@mastra/memory'
import type { Place } from '../../hub/access/public.ts'
import type { IdentityPorts } from '../../hub/identity/public.ts'
import type { Database } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import type { Owner, RunScope, Speakers } from '../controller-kit/public.ts'
import { admitAsker, runResolver } from '../controller-kit/public.ts'
import { MARK } from '../machine/public.ts'
import type { Kept } from './chosen.ts'
import { placeOf } from './open.ts'
import type { AssistantProjects } from './ports.ts'

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

/** The marks of the conversation's machine: its company and, in a Projeto, the Projeto (S36). */
export function machineMarks(runOf: RunOf) {
  return async (requestContext: RequestContext) => {
    const run = await runOf(requestContext)
    if (run === undefined) return undefined
    return {
      [MARK.company]: run.owner.companyId,
      ...(run.place.kind === 'PROJECT' ? { [MARK.project]: run.place.projectId } : {}),
    }
  }
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
    projects: Pick<AssistantProjects, 'liveProjectOf'>
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
