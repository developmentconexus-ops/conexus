import type { ConversationId, ProjectId } from '@conexus/hub-api'
import { CompanyId, PersonId } from '@conexus/hub-api'
import type { InputProcessor } from '@mastra/core/processors'
import type { RequestContext } from '@mastra/core/request-context'
import { z } from 'zod'
import type { QueueDeps } from '../model-accounts/public.ts'
import { memoryModelsFor, setTurn, Turn, turnIn } from '../model-accounts/public.ts'
import type { Runs } from '../runs/public.ts'
import { conversationIn } from '../runs/public.ts'

const TURN_PROCESSOR = 'conexus-turn'
const MEMORY_OWNER = /^company:(?<companyId>[^:]+):person:(?<personId>[^:]+)$/
const RUN_BUSY = 'RUN_BUSY:'

const Owner = z.object({ companyId: CompanyId, personId: PersonId })
type Owner = z.infer<typeof Owner>
type Conversation = Owner & { conversationId: ConversationId; projectId: ProjectId }

/** The Hub's index, as a run finds its conversation in it. */
export type ConversationIndex = {
  projectOf(input: Owner & { conversationId: ConversationId }): Promise<ProjectId | undefined>
}

const Resource = z.object({
  resourceId: z.string().transform((resource) => MEMORY_OWNER.exec(resource)?.groups),
})

/** Whose conversation a Mastra run is: the owner Mastra keeps its thread under (`memoryOwner`). */
function ownerIn(requestContext: RequestContext): Owner | undefined {
  const found = Resource.safeParse(requestContext.get('controller'))
  const owner = Owner.safeParse(found.data?.resourceId)
  return owner.success ? owner.data : undefined
}

async function conversationOf(
  index: ConversationIndex,
  requestContext: RequestContext,
): Promise<Conversation | undefined> {
  const owner = ownerIn(requestContext)
  const conversationId = conversationIn(requestContext)
  if (owner === undefined || conversationId === undefined) return undefined
  const projectId = await index.projectOf({ ...owner, conversationId })
  return projectId === undefined ? undefined : { ...owner, conversationId, projectId }
}

async function turnOfOwner(queue: QueueDeps, owner: Owner): Promise<Turn> {
  return new Turn({ ...owner, memoryModels: await memoryModelsFor(queue, owner) })
}

type Abort = (reason: string) => never

/** Takes the Projeto for the run and puts its turn on its context, or ends the run refused. */
async function takeTurn(
  deps: { queue: QueueDeps; runs: Pick<Runs, 'take'>; index: ConversationIndex },
  requestContext: RequestContext | undefined,
  abort: Abort,
): Promise<void> {
  const found =
    requestContext === undefined ? undefined : await conversationOf(deps.index, requestContext)
  if (requestContext === undefined || found === undefined) return abort('CONVERSATION_NOT_FOUND')
  const turn = await turnOfOwner(deps.queue, found)
  const taken = await deps.runs.take({ ...found, onEnd: () => turn.end() })
  if (!taken.ok) return abort(`${RUN_BUSY}${taken.person ?? ''}`)
  setTurn(requestContext, turn)
}

/**
 * The run's turn, made as Mastra's run reads its input, from the conversation the run is (Factory
 * `credential-policy.ts:31-90`), never from the request that woke it: the run takes the Projeto,
 * or ends refused with whose run holds it, before any model call and with nothing saved. A run
 * Mastra resumes (an answered card) reads no input: its first step takes the turn instead.
 */
export function turnOf(deps: {
  queue: QueueDeps
  runs: Pick<Runs, 'take'>
  index: ConversationIndex
}): InputProcessor {
  return {
    id: TURN_PROCESSOR,
    async processInput({ requestContext, messages, abort }) {
      await takeTurn(deps, requestContext, abort)
      return messages
    },
    async processInputStep({ requestContext, abort }) {
      if (turnIn(requestContext) === undefined) await takeTurn(deps, requestContext, abort)
      return {}
    },
  }
}

/** The Projeto of the conversation a Mastra run is, whoever holds it. */
export function projectIn(index: ConversationIndex) {
  return async (requestContext: RequestContext) => {
    const found = await conversationOf(index, requestContext)
    return found === undefined
      ? undefined
      : { companyId: found.companyId, projectId: found.projectId }
  }
}

/** A turn for a side call made before the run read its input: the observer's (`accountModel`). */
export function sideTurn(queue: QueueDeps) {
  return async (requestContext: RequestContext): Promise<Turn | undefined> => {
    const owner = ownerIn(requestContext)
    return owner === undefined ? undefined : turnOfOwner(queue, owner)
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
