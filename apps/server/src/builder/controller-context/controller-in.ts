import { ConversationId, ModelId } from '@conexus/hub-api'
import type { RequestContext } from '@mastra/core/request-context'
import { z } from 'zod'

type Emit = (event: { type: 'info'; message: string } | { type: 'error'; error: Error }) => void

function isFunction(value: unknown): value is () => unknown {
  return typeof value === 'function'
}

const Controller = z.object({
  sessionId: ConversationId.optional().catch(undefined),
  resourceId: z.string().optional().catch(undefined),
  threadId: z.string().optional().catch(undefined),
  emitEvent: z.custom<Emit>(isFunction).optional().catch(undefined),
  session: z
    .object({
      modelId: ModelId.optional().catch(undefined),
      state: z
        .object({ get: z.custom<() => unknown>(isFunction) })
        .optional()
        .catch(undefined),
    })
    .optional()
    .catch(undefined),
})

type ControllerIn = z.infer<typeof Controller>

/** The controller's mark on the run's context, read once for every kind of conversation; empty outside a run. */
export function controllerIn(requestContext: RequestContext | undefined): ControllerIn {
  const found = Controller.safeParse(requestContext?.get('controller'))
  return found.success ? found.data : {}
}

/** The conversation a run belongs to and the resource its thread is kept under; none outside a run of one. */
export function conversationRun(requestContext: RequestContext | undefined) {
  const { resourceId, sessionId } = controllerIn(requestContext)
  return resourceId === undefined || sessionId === undefined ? undefined : { resourceId, sessionId }
}
