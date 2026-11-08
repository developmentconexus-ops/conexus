import { PersonId } from '@conexus/hub-api'
import type { RequestContext } from '@mastra/core/request-context'
import { z } from 'zod'
import { Failure } from '../../platform/failure.ts'

const ActivationSchema = z.object({
  number: z.number().int().positive(),
  answeredBy: PersonId.nullable(),
})
/**
 * The activation a published turn runs: its version and who made it active when the turn began
 * (decision of 2026-11-08). The turn keeps it in the `requestContext`, which Mastra stores with a
 * parked run; the guard gives it back to the answer of the card, so the turn goes on with the version
 * it began on (`docs/reference/boundaries.md`).
 */
export type Activation = z.infer<typeof ActivationSchema>

/** The `requestContext` key of the turn's activation. */
export const ACTIVATION = 'conexus-agent-activation'

/**
 * The activation the turn began with, which an answered card brings back; none for a new turn or
 * for a card parked before activations existed. A value that is there and is not one fails.
 */
export function activationIn(requestContext: RequestContext): Activation | undefined {
  const held = requestContext.get(ACTIVATION)
  if (held === undefined) return undefined
  const parsed = ActivationSchema.safeParse(held)
  if (!parsed.success) {
    throw new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'AGENT_ACTIVATION_INVALID' } })
  }
  return parsed.data
}

/** Pins the turn to its activation. */
export function setActivation(requestContext: RequestContext, activation: Activation): void {
  requestContext.set(ACTIVATION, activation)
}
