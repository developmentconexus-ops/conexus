import type { CompanyId, ConversationId, Person } from '@conexus/hub-api'
import { CONVERSATION_TITLE_MAX, Effort, ModelId } from '@conexus/hub-api'
import type { FastifyRequest } from 'fastify'
import { z } from 'zod'
import { Failure } from '../../platform/failure.ts'
import type { QueueDeps } from '../model-accounts/public.ts'
import { conversationModel, effortsOf } from '../model-accounts/public.ts'
import type { CONTROLLER_KINDS, ControllerKind, ModelSource } from '../spec/public.ts'

/** The conversation a request names, once the guard has found it the person's and admitted it. */
type Asked = {
  person: Person
  companyId: CompanyId
  conversationId: ConversationId
  controllerId: (typeof CONTROLLER_KINDS)[ControllerKind]['id']
  part: { model: ModelSource }
}

/** The line the guard writes once Mastra has taken the change, and not before. */
export type Told = { fields: Record<string, string>; message: string }

/**
 * Stricter than Mastra's body (`@mastra/server@1.83.0` `agent-controller.js:224-233`, whose
 * `thinkingLevel` is optional): the effort always comes with the model, and a field more is refused.
 */
const ModelChoiceBody = z.strictObject({ modelId: ModelId, thinkingLevel: Effort })

/**
 * A change of the conversation's model reaches Mastra only when the conversation's model is the
 * session's (the ficha's `model`; a saved agent runs its version's, so its route is a 404), the
 * body is the model and the effort and no more, the person has an account for the model, and the
 * model offers the effort. A refusal changes nothing. The agent's log line, from its ficha, waits
 * for Mastra's `{ ok: true }`.
 */
export async function modelChoice(
  deps: { queue: QueueDeps },
  request: FastifyRequest,
  at: Asked,
): Promise<Told> {
  const { model } = at.part
  if (model.kind !== 'SESSION') throw new Failure('CONVERSATION_NOT_FOUND')
  const body = ModelChoiceBody.safeParse(request.body)
  if (!body.success) throw new Failure('REQUEST_MALFORMED')
  const { modelId, thinkingLevel } = body.data
  const chosen = await conversationModel(
    deps.queue,
    { companyId: at.companyId, personId: at.person.id },
    modelId,
  )
  if (!effortsOf(chosen).includes(thinkingLevel)) throw new Failure('EFFORT_UNSUPPORTED')
  return {
    fields: { companyId: at.companyId, traceId: request.id, conversationId: at.conversationId },
    message: model.switched,
  }
}

/** The title Mastra's body leaves loose: trimmed and between one and `CONVERSATION_TITLE_MAX` characters. */
const RenameBody = z.strictObject({ title: z.string().trim().min(1).max(CONVERSATION_TITLE_MAX) })

/**
 * A rename reaches Mastra's route (`PUT …/threads/:threadId`, which pins the title against the
 * memory's own) with the title the person sees in the field: the body Mastra reads is the trimmed
 * one (`@mastra/fastify` reads `request.body`). The line names the conversation and the agent,
 * never the title, which may carry the company's data.
 */
export function renaming(request: FastifyRequest, at: Asked): Told {
  const body = RenameBody.safeParse(request.body)
  if (!body.success) throw new Failure('REQUEST_MALFORMED')
  request.body = body.data
  return {
    fields: {
      companyId: at.companyId,
      traceId: request.id,
      conversationId: at.conversationId,
      agent: at.controllerId,
    },
    message: 'CONVERSATION_RENAMED',
  }
}
