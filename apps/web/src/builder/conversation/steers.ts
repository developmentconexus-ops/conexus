import type { MessageId } from '@conexus/hub-api'

/** A message the person sent while the Builder worked, until the stream says Mastra read it. */
export type Steer = { id: MessageId; content: string }

/** The steers after a send of one is told (`steer`, once per id: a retry is the same) or fails (`unsteered`). */
export function steered(
  steers: readonly Steer[],
  step: { type: 'steer'; steer: Steer } | { type: 'unsteered'; id: MessageId },
): readonly Steer[] {
  if (step.type === 'unsteered') return steers.filter((each) => each.id !== step.id)
  return steers.some((each) => each.id === step.steer.id) ? steers : [...steers, step.steer]
}
