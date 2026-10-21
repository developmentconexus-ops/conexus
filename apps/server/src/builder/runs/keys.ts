import type { RunId } from '@conexus/hub-api'
import { RunId as RunIdSchema } from '@conexus/hub-api'
import type { RequestContext } from '@mastra/core/request-context'

const RUN_KEY = 'conexus.run'

/** The request context of a turn, with the run it drives: how the controller's workspace learns whose it is. */
export function withRun(context: RequestContext, runId: RunId): RequestContext {
  context.set(RUN_KEY, runId)
  return context
}

export function runIn(context: RequestContext | undefined): RunId | undefined {
  const found = RunIdSchema.safeParse(context?.get(RUN_KEY))
  return found.success ? found.data : undefined
}
