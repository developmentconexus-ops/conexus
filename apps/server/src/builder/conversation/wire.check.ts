import type { ConversationEvent, MastraPart } from '@conexus/hub-api'
import type { AgentControllerWireEvent, MastraDBMessage } from '@mastra/core/agent-controller'
import type { z } from 'zod'

// Never called: `npm run typecheck` fails when the stream says a key that Mastra's own event of the
// same type does not carry (`cuts` is ours). Mastra's type is the source of the keys (code C27).
type Ours<T extends ConversationEvent['type']> = Extract<ConversationEvent, { type: T }>
type Theirs<T extends AgentControllerWireEvent['type']> = Extract<
  AgentControllerWireEvent,
  { type: T }
>
type Extra<T extends ConversationEvent['type'] & AgentControllerWireEvent['type']> = Exclude<
  keyof Ours<T>,
  keyof Theirs<T> | 'cuts'
>

type MustBeNever<T extends never> = T

type Mirrored =
  | 'message_start'
  | 'message_end'
  | 'shell_output'
  | 'command_exit'
  | 'tool_suspended'
  | 'task_updated'
  | 'om_status'
  | 'om_observation_start'
  | 'om_observation_end'
  | 'om_observation_failed'
  | 'om_reflection_start'
  | 'om_reflection_end'
  | 'om_reflection_failed'
  | 'om_buffering_start'
  | 'om_buffering_end'
  | 'om_buffering_failed'
  | 'agent_end'

export type NothingExtra = MustBeNever<{ [T in Mirrored]: Extra<T> }[Mirrored]>

// @ts-expect-error: a key that Mastra's event lacks is not `never`, so the check above would fail.
export type Caught = MustBeNever<Exclude<'reason' | 'made_up', keyof Theirs<'agent_end'> | 'cuts'>>

/** What Mastra keeps of the parts the screen reads fits the schema of the Hub. */
type Known = Extract<
  MastraDBMessage['content']['parts'][number],
  { type: 'text' | 'reasoning' | 'tool-invocation' }
>
export function partsFit(part: Known): z.input<typeof MastraPart> {
  return part
}
