import type { RequestContext } from '@mastra/core/request-context'

/**
 * Reads once per `RequestContext`: Mastra resolves a run's instructions, tools, skills and workspace
 * each with the run's context, so they share one value; a resumed run brings a new context.
 */
export function oncePerRun<T>(
  read: (context: RequestContext) => Promise<T>,
): (context: RequestContext) => Promise<T> {
  const done = new WeakMap<RequestContext, Promise<T>>()
  return (context) => {
    let found = done.get(context)
    if (found === undefined) {
      found = read(context)
      done.set(context, found)
    }
    return found
  }
}
