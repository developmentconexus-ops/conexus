import { z } from 'zod'

const Cuts = z.array(z.string()).optional()

/** A name of a part of ours, which Mastra keeps in the message as a `data-*` part (step 14.0). */
export const CONEXUS_PARTS = [
  'data-conexus-machine',
  'data-conexus-restarted',
  'data-conexus-version',
  'data-conexus-failure',
  'data-conexus-notice',
  'data-conexus-thought',
] as const

const ReasoningDetail = z.union([
  z.object({ type: z.literal('text'), text: z.string(), signature: z.string().optional() }),
  z.object({ type: z.literal('redacted'), data: z.string() }),
])

const ToolInvocation = z.object({
  state: z.enum([
    'partial-call',
    'call',
    'approval-requested',
    'approval-responded',
    'result',
    'output-error',
    'output-denied',
  ]),
  toolCallId: z.string().min(1),
  toolName: z.string(),
  args: z.unknown(),
  result: z.unknown().optional(),
  isError: z.boolean().optional(),
})

/**
 * A part of a message as Mastra keeps it, by the names of Mastra's own types (code C21): the model's
 * words, its reasoning, a tool call with what it received and returned, and `data-*` parts, ours
 * among them. `cuts` names the places where the Hub kept less than there was (`wire.ts`).
 */
export const MastraPart = z.union([
  z.object({ type: z.literal('text'), text: z.string(), cuts: Cuts }),
  z.object({
    type: z.literal('reasoning'),
    reasoning: z.string(),
    details: z.array(ReasoningDetail),
    cuts: Cuts,
  }),
  z.object({
    type: z.literal('tool-invocation'),
    toolInvocation: ToolInvocation,
    cuts: Cuts,
  }),
  z.object({
    type: z.templateLiteral(['data-', z.string()]),
    data: z.unknown(),
    cuts: Cuts,
  }),
])
export type MastraPart = z.infer<typeof MastraPart>

/** What a stream's `message_update` says of a message in progress, in Mastra's form. */
export const MessageUpdate = z.union([
  z.object({ type: z.literal('text-delta'), delta: z.string() }),
  z.object({ type: z.literal('reasoning-delta'), index: z.int().nonnegative(), delta: z.string() }),
  z.object({ type: z.literal('part'), index: z.int().nonnegative(), part: MastraPart }),
])
export type MessageUpdate = z.infer<typeof MessageUpdate>

/**
 * The parts of a message after one of Mastra's updates, the only fold of them on the server and the
 * screen alike: a text delta goes to the last text part or opens one, a reasoning delta to the
 * reasoning at its index, and a part takes its index.
 */
export function applyUpdate(parts: readonly MastraPart[], update: MessageUpdate): MastraPart[] {
  switch (update.type) {
    case 'text-delta': {
      const last = parts.at(-1)
      return last?.type === 'text'
        ? [...parts.slice(0, -1), { ...last, text: last.text + update.delta }]
        : [...parts, { type: 'text', text: update.delta }]
    }
    case 'reasoning-delta': {
      const at = parts[update.index]
      const next: MastraPart =
        at?.type === 'reasoning'
          ? { ...at, reasoning: at.reasoning + update.delta }
          : { type: 'reasoning', reasoning: update.delta, details: [] }
      return update.index < parts.length ? parts.with(update.index, next) : [...parts, next]
    }
    case 'part':
      return update.index >= parts.length
        ? [...parts, update.part]
        : parts.with(update.index, update.part)
    default:
      return update satisfies never
  }
}
