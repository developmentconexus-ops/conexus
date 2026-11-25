import type { ConversationId, ProjectId } from '@conexus/hub-api'
import type { RequestContext } from '@mastra/core/request-context'
import type { Memory } from '@mastra/memory'
import type { QueueDeps } from '../../harness/model-accounts/public.ts'
import type { Owner, RunScope, Taken, TurnSource } from '../../harness/spec/public.ts'
import { runResolver, turnOfOwner } from '../../harness/spec/public.ts'
import type { Runs } from './runs/runs.ts'

const TURN_PROCESSOR = 'conexus-turn'

type Conversation = Owner & { conversationId: ConversationId; projectId: ProjectId }

/** The Hub's index, as a run finds its conversation in it. */
export type ConversationIndex = {
  projectOf(input: Owner & { conversationId: ConversationId }): Promise<ProjectId | undefined>
}

/** Why `turnOf` refused a conversation's run: the Projeto is busy, with the name of whoever holds it while they are still there. */
export type Refused = Readonly<{ code: 'RUN_BUSY'; person?: string }>

/**
 * What the turn's processor recorded of each refusal, for the end of the turn to read: the
 * controller's own `error` event says only that a processor aborted the run (`finishReason:
 * 'tripwire'`, with the reason folded into its text), so the code and the name are kept here, by
 * conversation, and never read back from the text (code C52).
 */
export type Refusals = ReturnType<typeof createRefusals>

export function createRefusals() {
  const held = new Map<ConversationId, Refused>()
  return {
    record(conversationId: ConversationId, refused: Refused): void {
      held.set(conversationId, refused)
    },
    /** The refusal the run's end reads, once: a later run of the conversation never meets it. */
    read(conversationId: ConversationId): Refused | undefined {
      const refused = held.get(conversationId)
      held.delete(conversationId)
      return refused
    },
  }
}

/**
 * The Projeto's lock as the run's take (decision 0027): the run takes the Projeto, or is refused
 * with whose run holds it; the turn lets go of its accounts when the run ends (`onEnd`).
 */
function projectTurn(deps: {
  queue: QueueDeps
  runs: Pick<Runs, 'take'>
  projectOf: ProjectOf
  refusals: Refusals
}): (requestContext: RequestContext) => Promise<Taken> {
  return async (requestContext) => {
    const found = await deps.projectOf(requestContext)
    if (found === undefined) return { kind: 'NONE' }
    deps.refusals.read(found.conversationId)
    const turn = await turnOfOwner(deps.queue, found)
    const taken = await deps.runs.take({ ...found, onEnd: () => turn.end() })
    if (!taken.ok) {
      deps.refusals.record(found.conversationId, {
        code: 'RUN_BUSY',
        ...(taken.person === undefined ? {} : { person: taken.person }),
      })
      return { kind: 'REFUSED', reason: 'RUN_BUSY' }
    }
    return { kind: 'TAKEN', turn }
  }
}

/**
 * The Builder's turn as its ficha holds it (`turn`): the run's, made as Mastra's run reads its
 * input, from the conversation the run is (Factory `credential-policy.ts:31-90`), never from the
 * request that woke it. `projectTurn` is the step: the run takes the Projeto, or ends refused,
 * with the refusal recorded for the end of the turn, before any model call and with nothing
 * saved. A run Mastra resumes (an answered card) reads no input: its first step takes the turn
 * instead.
 */
export function turnOf(deps: {
  queue: QueueDeps
  runs: Pick<Runs, 'take'>
  projectOf: ProjectOf
  refusals: Refusals
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
