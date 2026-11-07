import type { MastraMessagePart } from '@mastra/client-js'
import { z } from 'zod'

type Invocation = Extract<MastraMessagePart, { type: 'tool-invocation' }>['toolInvocation']

/** The prefix of the agent's own tools: the Builder's questions and plans close the same way but are not writes. */
const AGENT_TOOL = 'tool_'

/** What Mastra writes on a call a person's new message declined, and on one the stop closed. */
const INTERRUPTED = 'interrupted_by_user_message'
const ABORTED = 'Aborted by the user'

/** What the screen knows of a call that asks the person, beyond the message that holds it. */
export type Seen = {
  /** The display state holds the call: the buttons are lit. */
  lit: boolean
  /** The stream told `tool_approval_required` for the call. */
  asked: boolean
  /** The stream told `tool_end` for the call, with its result. */
  ended: { result: unknown; denied: boolean; failed: boolean } | undefined
}

/** How a write that asked ended: what the funnel answered (`Written`), as far as the card says it. */
export type Outcome =
  | { kind: 'LAUNCHED'; code: number | undefined }
  | { kind: 'UNCERTAIN'; mark: string }
  | { kind: 'FAILED'; why: FailedWhy; text: string | undefined }

/** Why a write that was approved did not go out: the Hub's refusals, the connection's, or the call that threw. */
export type FailedWhy =
  | 'UNREACHABLE'
  | 'DEADLINE'
  | 'NOT_IN_ROLE'
  | 'NOT_GRANTED'
  | 'CALLS_SPENT'
  | 'WRITE_OPEN'
  | 'ERROR'
  | 'OTHER'

/** What the screen knows of each call that may ask, from the session's state, the stream and the calls' ends. */
export function seenBy(state: {
  approvals: Readonly<Record<string, unknown>>
  asked: Readonly<Record<string, true>>
  ended: Readonly<Record<string, { result: unknown; denied: boolean; failed: boolean }>>
}): (toolCallId: string) => Seen {
  return (toolCallId) => ({
    lit: Object.hasOwn(state.approvals, toolCallId),
    asked: Object.hasOwn(state.asked, toolCallId),
    ended: state.ended[toolCallId],
  })
}

type ApprovalState = 'open' | 'approved' | 'declined' | 'interrupted' | 'stopped'

export type ApprovalCardItem = {
  kind: 'card'
  cardKind: 'approval'
  id: string
  toolCallId: string
  toolName: string
  args: unknown
  state: ApprovalState
  /** The buttons answer only while the session's state holds the call. */
  lit: boolean
  outcome?: Outcome
}

const Kind = z.looseObject({ kind: z.string() })
const Launched = z.looseObject({
  value: z.looseObject({ codigoPedido: z.number() }),
})
const Marked = z.looseObject({ mark: z.string() })
const Refused = z.looseObject({ native: z.looseObject({ message: z.string() }) })

/** What a result that ran says: launched, not known, or failed with the failure said; a call that threw has no result to read. */
function outcomeOf(result: unknown, threw: boolean): Outcome | undefined {
  const kind = Kind.safeParse(result)
  if (!kind.success) return threw ? { kind: 'FAILED', why: 'ERROR', text: undefined } : undefined
  switch (kind.data.kind) {
    case 'OK':
      return { kind: 'LAUNCHED', code: Launched.safeParse(result).data?.value.codigoPedido }
    case 'WRITE_UNCERTAIN':
      return { kind: 'UNCERTAIN', mark: Marked.safeParse(result).data?.mark ?? '' }
    case 'NOT_IN_ROLE':
    case 'NOT_GRANTED':
    case 'CALLS_SPENT':
    case 'WRITE_OPEN':
    case 'UNREACHABLE':
    case 'DEADLINE':
      return { kind: 'FAILED', why: kind.data.kind, text: undefined }
    default:
      return { kind: 'FAILED', why: 'OTHER', text: Refused.safeParse(result).data?.native.message }
  }
}

/** Whether Mastra closed the call as the person's refusal, and by what: their answer, a message or the stop. */
function declinedBy(inv: Invocation, result: unknown, denied: boolean): ApprovalState | undefined {
  if (result === INTERRUPTED || inv.approval?.reason === INTERRUPTED) return 'interrupted'
  if (result === ABORTED || inv.approval?.reason === ABORTED) return 'stopped'
  if (denied || inv.approval?.approved === false || inv.state === 'output-denied') return 'declined'
  return undefined
}

/**
 * The card of a call that asked the person (step 24.5), or none for a call that ran alone. It is
 * open while the call waits: lit when the session's state holds it, and unlit between the stream
 * saying so and the state arriving. Otherwise it says how the call ended, from the live end of the
 * call or from what the store kept: a refusal by the person, a message or the stop; a write that ran
 * (its outcome, a call that threw included); or, for a call the store kept with no end that
 * nothing waits on, no card state of its own (`null`).
 */
export function approvalItem(inv: Invocation, seen: Seen): ApprovalCardItem | null {
  if (!inv.toolName.startsWith(AGENT_TOOL)) return null
  if (!seen.lit && !seen.asked && inv.approval === undefined) return null
  const base = {
    kind: 'card',
    cardKind: 'approval',
    id: inv.toolCallId,
    toolCallId: inv.toolCallId,
    toolName: inv.toolName,
    args: inv.args,
    lit: seen.lit,
  } as const
  const result = seen.ended === undefined ? inv.result : seen.ended.result
  const declined = declinedBy(inv, result, seen.ended?.denied === true)
  if (declined !== undefined) return { ...base, state: declined }
  const outcome = outcomeOf(result, seen.ended?.failed === true || inv.state === 'output-error')
  if (outcome !== undefined) return { ...base, state: 'approved', outcome }
  if (seen.lit || (seen.asked && inv.state === 'call')) return { ...base, state: 'open' }
  return null
}
