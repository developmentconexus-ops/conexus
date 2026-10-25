import { z } from 'zod'
import type { FailureCode } from './failures.ts'
import { FAILURES } from './failures.ts'

const Cuts = z.array(z.string()).optional()

/** A name of a part of ours, which Mastra keeps in the message as a `data-*` part (step 14.0). */
export const CONEXUS_PARTS = [
  'data-conexus-machine',
  'data-conexus-version',
  'data-conexus-failure',
  'data-conexus-notice',
  'data-conexus-thought',
] as const

/**
 * Whether a saved version's app built (card of step 14): its check at the end of the turn passed,
 * failed the last time the turn could try, or could not run on the machine (founder, 2026-10-22,
 * the words of `CHECK_PLATFORM_FAILED`); or the turn ended with `open` tasks still open the last
 * time it could try, the version saved half done (card of step 14.2, criterion 15).
 */
export const VersionCheck = z.discriminatedUnion('state', [
  z.object({ state: z.literal('passed') }),
  z.object({ state: z.literal('unfinished'), open: z.int().positive() }),
  z.object({ state: z.literal('failed'), code: z.literal('APP_CHECK_FAILED') }),
  z.object({ state: z.literal('unchecked'), code: z.literal('CHECK_PLATFORM_FAILED') }),
])
export type VersionCheck = z.infer<typeof VersionCheck>

/** The steps of the machine a turn waits on, each told as a `data-conexus-machine` part. */
export const MachinePhase = z.enum(['starting', 'copying', 'saving'])
export type MachinePhase = z.infer<typeof MachinePhase>

/** What each part of ours carries in its `data`, one schema per name in `CONEXUS_PARTS`. */
export const MachineData = z.object({ phase: MachinePhase })
export type MachineData = z.infer<typeof MachineData>

export const VersionData = z.object({
  number: z.number(),
  files: z.number(),
  changed: z.boolean(),
  changedFiles: z.number(),
  check: VersionCheck.optional(),
})
export type VersionData = z.infer<typeof VersionData>

export const FailureData = z.object({
  code: z.string().refine((code): code is FailureCode => Object.hasOwn(FAILURES, code)),
  /** The person its phrase names, where the row has `{person}` (`RUN_BUSY`). */
  person: z.string().optional(),
})
export type FailureData = z.infer<typeof FailureData>

export const NoticeData = z.object({ text: z.string() })
export type NoticeData = z.infer<typeof NoticeData>

export const ThoughtData = z.object({ id: z.string(), seconds: z.number() })
export type ThoughtData = z.infer<typeof ThoughtData>

/** A part of ours with its payload, one variant per name in `CONEXUS_PARTS` (code C21). */
export const ConexusPart = z.discriminatedUnion('type', [
  z.object({ type: z.literal('data-conexus-machine'), data: MachineData }),
  z.object({ type: z.literal('data-conexus-version'), data: VersionData }),
  z.object({ type: z.literal('data-conexus-failure'), data: FailureData }),
  z.object({ type: z.literal('data-conexus-notice'), data: NoticeData }),
  z.object({ type: z.literal('data-conexus-thought'), data: ThoughtData }),
])
export type ConexusPart = z.infer<typeof ConexusPart>

/**
 * A call that waits for the person, as Mastra keeps it in the message's `metadata.suspendedTools`
 * and its display state's `pendingSuspensions`; `cuts` as in a part.
 */
export const Suspended = z.object({
  toolCallId: z.string().min(1),
  toolName: z.string(),
  args: z.unknown(),
  suspendPayload: z.unknown(),
  cuts: Cuts,
})
export type Suspended = z.infer<typeof Suspended>

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
  /** Why a call failed: Mastra keeps a failed call as `output-error` with this, and no `result`. */
  errorText: z.string().optional(),
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
