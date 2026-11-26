import { z } from 'zod'

/** How a task's round ended, as its result says: complete, or the error that stopped it. */
export function taskOutcome<Shape extends z.core.$ZodLooseShape>(error: Shape) {
  return z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('COMPLETE') }),
    z.object({ kind: z.literal('ERROR'), ...error }),
  ])
}
