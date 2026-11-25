import type { ConversationId, ProjectId } from '@conexus/hub-api'
import type { RequestContext } from '@mastra/core/request-context'
import type { Memory } from '@mastra/memory'
import type { QueueDeps } from '../../harness/model-accounts/public.ts'
import type { Owner, RunScope, Taken, TurnSource } from '../../harness/spec/public.ts'
import { ownerIn, runResolver, turnOfOwner } from '../../harness/spec/public.ts'
import { conversationIn } from './runs/keys.ts'
import type { Runs } from './runs/runs.ts'

const TURN_PROCESSOR = 'conexus-turn'
const RUN_BUSY = 'RUN_BUSY:'

type Conversation = Owner & { conversationId: ConversationId; projectId: ProjectId }

/** The Hub's index, as a run finds its conversation in it. */
export type ConversationIndex = {
  projectOf(input: Owner & { conversationId: ConversationId }): Promise<ProjectId | undefined>
}

async function conversationOf(
  index: ConversationIndex,
  requestContext: RequestContext,
): Promise<Conversation | undefined> {
  const owner = ownerIn(requestContext)
  const conversationId = conversationIn(requestContext)
  if (owner?.kind !== 'builder' || conversationId === undefined) return undefined
  const { companyId, personId } = owner
  const projectId = await index.projectOf({ companyId, personId, conversationId })
  return projectId === undefined ? undefined : { companyId, personId, conversationId, projectId }
}

/**
 * The Projeto's lock as the run's take (decision 0027): the run takes the Projeto, or is refused
 * with whose run holds it; the turn lets go of its accounts when the run ends (`onEnd`).
 */
function projectTurn(deps: {
  queue: QueueDeps
  runs: Pick<Runs, 'take'>
  index: ConversationIndex
}): (requestContext: RequestContext) => Promise<Taken> {
  return async (requestContext) => {
    const found = await conversationOf(deps.index, requestContext)
    if (found === undefined) return { kind: 'NONE' }
    const turn = await turnOfOwner(deps.queue, found)
    const taken = await deps.runs.take({ ...found, onEnd: () => turn.end() })
    if (!taken.ok) return { kind: 'REFUSED', reason: `${RUN_BUSY}${taken.person ?? ''}` }
    return { kind: 'TAKEN', turn }
  }
}

/**
 * The Builder's turn as its ficha holds it (`turn`): the run's, made as Mastra's run reads its
 * input, from the conversation the run is (Factory `credential-policy.ts:31-90`), never from the
 * request that woke it. `projectTurn` is the step: the run takes the Projeto, or ends refused with
 * whose run holds it, before any model call and with nothing saved. A run Mastra resumes (an
 * answered card) reads no input: its first step takes the turn instead.
 */
export function turnOf(deps: {
  queue: QueueDeps
  runs: Pick<Runs, 'take'>
  index: ConversationIndex
}): TurnSource {
  return {
    kind: 'RUN',
    id: TURN_PROCESSOR,
    none: 'CONVERSATION_NOT_FOUND',
    resumes: true,
    take: projectTurn(deps),
  }
}

/** The Builder's run: its Projeto from the Hub's index, every connection the Projeto received. */
export function builderRuns(deps: {
  index: ConversationIndex
  memory: Pick<Memory, 'getThreadById'>
}): (requestContext: RequestContext) => Promise<RunScope | undefined> {
  return runResolver('builder', {
    memory: deps.memory,
    stored: async ({ owner, conversationId }) => {
      const projectId = await deps.index.projectOf({ ...owner, conversationId })
      if (projectId === undefined) return undefined
      return {
        place: { kind: 'PROJECT', projectId },
        choice: { kind: 'ANY' },
        ceiling: { kind: 'PERSON' },
        attended: true,
      }
    },
  })
}

export type ProjectOf = (requestContext: RequestContext) => Promise<Conversation | undefined>

/** The conversation a Builder's run is, with its company and Projeto, whoever holds the Projeto. */
export function projectOfRun(
  runOf: (requestContext: RequestContext) => Promise<RunScope | undefined>,
): ProjectOf {
  return async (requestContext) => {
    const run = await runOf(requestContext)
    if (run?.place.kind !== 'PROJECT' || run.conversation.kind !== 'THREAD') return undefined
    const { projectId } = run.place
    return { ...run.owner, projectId, conversationId: run.conversation.id }
  }
}

/**
 * The run `turnOf` refused as busy, as Mastra says it on the run's error (`Processor "<id>" stopped
 * the run: <reason>`): with the name of whoever holds the Projeto, when they are still there.
 */
export function busyIn(error: Error): { person: string | undefined } | undefined {
  const said = `Processor "${TURN_PROCESSOR}" stopped the run: ${RUN_BUSY}`
  if (!error.message.startsWith(said)) return undefined
  const person = error.message.slice(said.length)
  return { person: person === '' ? undefined : person }
}
