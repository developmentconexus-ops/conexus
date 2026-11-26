import { PersonId } from '@conexus/hub-api'
import type { RequestContext } from '@mastra/core/request-context'
import { MASTRA_SCOPES_KEY } from '@mastra/core/request-context'
import { z } from 'zod'

const ActivationSchema = z.object({
  number: z.number().int().positive(),
  answeredBy: PersonId.nullable(),
})
/**
 * The activation a published turn runs: its version and who made it active when the turn began
 * (decision of 2026-11-08). It travels as a scope of the turn, which Mastra keeps with a run parked
 * on a card and gives back, unchanged, to the run that resumes.
 */
export type Activation = z.infer<typeof ActivationSchema>

const TYPE = 'conexus-activation'
const NONE = '-'

/** The scope that says which activation the turn runs: `conexus-activation:<number>/<person or ->`. */
export function activationScope(activation: Activation): string {
  return `${TYPE}:${activation.number}/${activation.answeredBy ?? NONE}`
}

/**
 * The activation in the scopes of the run, which a resumed run keeps from its start; none for a new
 * turn that has not set its scopes yet, and for the draft. A scope that is there and is not an
 * activation fails.
 */
export function activationIn(requestContext: RequestContext): Activation | undefined {
  const scopes = z.array(z.string()).optional().parse(requestContext.get(MASTRA_SCOPES_KEY))
  const found = scopes?.find((scope) => scope.startsWith(`${TYPE}:`))
  if (found === undefined) return undefined
  const [number, answeredBy] = found.slice(TYPE.length + 1).split('/')
  return ActivationSchema.parse({
    number: Number(number),
    answeredBy: answeredBy === NONE ? null : answeredBy,
  })
}
