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
const MEMORY_OWNER =
  /^(?:(?<assistant>assistant):)?company:(?<companyId>[^:]+):person:(?<personId>[^:]+)$/
const RUN_BUSY = 'RUN_BUSY:'

const Owner = z.object({ companyId: CompanyId, personId: PersonId })
type Owner = z.infer<typeof Owner>
type Conversation = Owner & { conversationId: ConversationId; projectId: ProjectId }

/** The Hub's index, as a run finds its conversation in it. */
export type ConversationIndex = {
  projectOf(input: Owner & { conversationId: ConversationId }): Promise<ProjectId | undefined>
}

/** Which controller's a thread is, by the resource it is kept under (C21). */
export type ResourceOwner = Owner & { kind: 'builder' | 'assistant' }

/**
 * Whose a thread is, and of which controller, from the resource Mastra keeps it under
 * (`memoryOwner`, the Assistant's `assistantOwner`), or none.
 */
export function ownerOfResource(resourceId: unknown): ResourceOwner | undefined {
  const groups = typeof resourceId === 'string' ? MEMORY_OWNER.exec(resourceId)?.groups : undefined
  const owner = Owner.safeParse(groups)
  if (!owner.success) return undefined
  return { kind: groups?.assistant === undefined ? 'builder' : 'assistant', ...owner.data }
}

const Resource = z.object({ resourceId: z.string() })

/** Whose conversation a Mastra run is: the owner Mastra keeps its thread under, of either controller. */
function ownerIn(requestContext: RequestContext): ResourceOwner | undefined {
  return ownerOfResource(Resource.safeParse(requestContext.get('controller')).data?.resourceId)
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

/** The turn of a conversation's owner, in the accounts' queue (step 11). */
export async function turnOfOwner(queue: QueueDeps, owner: Owner): Promise<Turn> {
  const { companyId, personId } = owner
  return new Turn({ companyId, personId, memoryModels: await memoryModelsFor(queue, owner) })
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

/** The conversation a Mastra run is, with its company and Projeto, whoever holds the Projeto. */
export function projectIn(index: ConversationIndex) {
  return async (requestContext: RequestContext) => {
    const found = await conversationOf(index, requestContext)
    return found === undefined
      ? undefined
      : {
          companyId: found.companyId,
          projectId: found.projectId,
          conversationId: found.conversationId,
          personId: found.personId,
        }
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
