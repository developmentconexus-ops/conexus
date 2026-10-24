import type { ConversationEvent, Message, ToolCallId } from '@conexus/hub-api'
import { MastraPart, MessageId, ModelId, WIRE_LIMITS } from '@conexus/hub-api'
import type {
  AgentControllerDisplayState,
  AgentControllerEvent,
  MastraDBMessage,
} from '@mastra/core/agent-controller'
import { WORKSPACE_TOOLS } from '@mastra/core/workspace'
import { z } from 'zod'

/**
 * The only place that cuts what Mastra holds before it leaves for the screen (card of step 14.2,
 * U2; code C26): a string in a tool's arguments or result keeps its first `WIRE_LIMITS.text`
 * characters, a command's output its last lines and bytes, and `cuts` names each place. The model's
 * own words and reasoning go whole. Mastra's `getDisplayTransform` (`stream-content.d.ts`) transforms
 * a payload by tool and does not limit its size, so the limit is ours.
 */
const DEEPEST = 8

/** The end of a command's output as its row shows it, and whether lines before it were left out. */
export type Tail = { output: string[]; cut: boolean }

/**
 * The last lines of a command's output the row shows, at most `WIRE_LIMITS.outputLines` and
 * `outputBytes`; `dropped` says the output was already cut before it came here.
 */
export function cutTail(output: string, dropped: boolean): Tail {
  const { outputLines, outputBytes } = WIRE_LIMITS
  const end = output.slice(-outputBytes * 2)
  const lines = end.split('\n')
  if (lines.at(-1) === '') lines.pop()
  const kept = lines.slice(-outputLines)
  while (kept.length > 1 && Buffer.byteLength(kept.join('\n')) > outputBytes) kept.shift()
  const [only] = kept
  const long = kept.length === 1 && only !== undefined && only.length > outputBytes
  if (long) kept[0] = only.slice(-outputBytes)
  return {
    output: kept,
    cut: dropped || end.length < output.length || long || kept.length < lines.length,
  }
}

/** A failed call's reason, cut as any text of a call. */
function cutText(text: string, cuts: string[]): string {
  if (text.length <= WIRE_LIMITS.text) return text
  cuts.push('toolInvocation.errorText')
  return `${text.slice(0, WIRE_LIMITS.text)}…`
}

function cutLeaves(value: unknown, path: string, cuts: string[], depth = 0): unknown {
  if (typeof value === 'string') {
    if (value.length <= WIRE_LIMITS.text) return value
    cuts.push(path)
    return `${value.slice(0, WIRE_LIMITS.text)}…`
  }
  if (value === null || typeof value !== 'object') return value
  if (depth >= DEEPEST) {
    cuts.push(path)
    return '…'
  }
  if (Array.isArray(value)) {
    return value.map((each, index) => cutLeaves(each, `${path}.${index}`, cuts, depth + 1))
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, each]) => [
      key,
      cutLeaves(each, `${path}.${key}`, cuts, depth + 1),
    ]),
  )
}

/** A command's output as its row shows it: the last lines, with an ellipsis where lines were left out. */
function outputText(tail: Tail): string {
  return tail.cut ? `…\n${tail.output.join('\n')}` : tail.output.join('\n')
}

/**
 * What the observer's parts (`data-om-*`) say besides their text: ids, kinds, counts and times. The
 * free text of an error or of an observation stays inside (security S41).
 */
function scalarsOf(data: unknown): unknown {
  if (typeof data !== 'object' || data === null) return {}
  return Object.fromEntries(
    Object.entries(data).filter(
      ([key, each]) =>
        typeof each === 'number' ||
        typeof each === 'boolean' ||
        (typeof each === 'string' && (key === 'cycleId' || key === 'operationType')),
    ),
  )
}

/** A part of Mastra's as the screen gets it, cut. */
function cutPart(part: MastraPart): MastraPart {
  const cuts: string[] = []
  if (part.type === 'tool-invocation') {
    const { toolInvocation } = part
    const { args, result, errorText } = toolInvocation
    const command = toolInvocation.toolName === WORKSPACE_TOOLS.SANDBOX.EXECUTE_COMMAND
    const output = command && typeof result === 'string' ? cutTail(result, false) : undefined
    if (output?.cut) cuts.push('toolInvocation.result')
    const cutResult =
      output === undefined ? cutLeaves(result, 'toolInvocation.result', cuts) : outputText(output)
    const cutArgs = cutLeaves(args, 'toolInvocation.args', cuts)
    const cutError = errorText === undefined ? {} : { errorText: cutText(errorText, cuts) }
    // Mastra's stream says `isError: false` on a call that succeeded and its store leaves it out; the Hub says it only when true.
    const { isError, ...call } = toolInvocation
    const failed = { ...(isError ? { isError } : {}), ...cutError }
    const shown = { ...call, ...failed, args: cutArgs, result: cutResult }
    return cuts.length === 0
      ? { ...part, toolInvocation: shown }
      : { ...part, toolInvocation: shown, cuts }
  }
  if (part.type === 'text') return part
  // `details` holds the provider's signatures and a text the stream never fills; the words are in `reasoning`.
  if (part.type === 'reasoning') return { ...part, details: [] }
  const data = cutLeaves(
    part.type.startsWith('data-om-') ? scalarsOf(part.data) : part.data,
    'data',
    cuts,
  )
  return cuts.length === 0 ? { ...part, data } : { ...part, data, cuts }
}

/** What the screen gets of one of Mastra's parts, or none for the parts that stay inside. */
function wirePart(part: MastraDBMessage['content']['parts'][number]): MastraPart | undefined {
  const read = MastraPart.safeParse(part)
  return read.success ? cutPart(read.data) : undefined
}

const Answered = z.object({ modelId: z.string().min(1), provider: z.string().min(1) })
const PersonSignal = z.object({ signal: z.object({ type: z.literal('user') }) })
const USER_MESSAGE_PART = 'data-user-message'
/** What Mastra's controller puts in the part of a message the person sent into the running turn. */
const UserMessageData = z.object({
  contents: z.union([
    z.string(),
    z.array(z.object({ type: z.string(), text: z.string().optional() })),
  ]),
})
const SuspendedTools = z.object({
  suspendedTools: z.record(
    z.string(),
    z.object({
      toolCallId: z.string().min(1),
      toolName: z.string(),
      args: z.unknown(),
      suspendPayload: z.unknown(),
    }),
  ),
})

/** The model that answered a message, `provider/model` as the router names it, or none. */
export function modelOf(message: { content: { metadata?: unknown } }): ModelId | null {
  const answered = Answered.safeParse(message.content.metadata)
  if (!answered.success) return null
  const model = ModelId.safeParse(`${answered.data.provider}/${answered.data.modelId}`)
  return model.success ? model.data : null
}

/** The calls a message left waiting for the person, with what each suspended with, cut. */
function suspendedOf(metadata: unknown): Message['suspended'] {
  const read = SuspendedTools.safeParse(metadata)
  if (!read.success) return {}
  return wireSuspended(Object.values(read.data.suspendedTools))
}

/** A call Mastra keeps waiting for the person, as its display state holds it. */
type Parked = Pick<
  Parameters<AgentControllerDisplayState['pendingSuspensions']['set']>[1],
  'toolCallId' | 'toolName' | 'args' | 'suspendPayload'
>

/** The calls waiting for the person, by call, with what each suspended with, cut. */
export function wireSuspended(calls: Iterable<Parked>): Message['suspended'] {
  return Object.fromEntries(
    [...calls].map(({ toolCallId, toolName, args, suspendPayload }) => {
      const cuts: string[] = []
      const cut = {
        toolCallId,
        toolName,
        args: cutLeaves(args, 'args', cuts),
        suspendPayload: cutLeaves(suspendPayload, 'suspendPayload', cuts),
      }
      return [toolCallId, cuts.length === 0 ? cut : { ...cut, cuts }]
    }),
  )
}

/** The words of the part a signal carries live (`data-user-message`), as a text part, or none. */
function userTextOf(part: MastraDBMessage['content']['parts'][number]): MastraPart | undefined {
  if (part.type !== USER_MESSAGE_PART || !('data' in part)) return undefined
  const read = UserMessageData.safeParse(part.data)
  if (!read.success) return undefined
  const { contents } = read.data
  const text =
    typeof contents === 'string'
      ? contents
      : contents.flatMap((each) => (each.type === 'text' ? (each.text ?? []) : [])).join('\n')
  return { type: 'text', text }
}

/** A signal is the person's when it was stored as theirs or carries the live part of their message. */
function isPersonSignal(message: MastraDBMessage): boolean {
  return (
    PersonSignal.safeParse(message.content.metadata).success ||
    message.content.parts.some((part) => part.type === USER_MESSAGE_PART)
  )
}

/** A stored message as the person reads it: theirs, or the Builder's; none of Mastra's others. */
export function wireMessage(message: MastraDBMessage): Message | undefined {
  const role =
    message.role === 'assistant'
      ? 'builder'
      : message.role === 'user' || (message.role === 'signal' && isPersonSignal(message))
        ? 'person'
        : undefined
  if (role === undefined) return undefined
  return {
    id: MessageId.parse(message.id),
    role,
    parts: message.content.parts.flatMap((part) => userTextOf(part) ?? wirePart(part) ?? []),
    suspended: suspendedOf(message.content.metadata),
    model: role === 'builder' ? modelOf(message) : null,
    createdAt: new Date(message.createdAt).toISOString(),
  }
}

/** A command's output so far, as the row shows it: the stream says the whole tail, not a piece. */
export function wireShell(input: {
  toolCallId: ToolCallId
  tail: Tail
  stream: 'stdout' | 'stderr'
}): ConversationEvent {
  const { toolCallId, tail, stream } = input
  const cuts = tail.cut ? ['output'] : undefined
  return { type: 'shell_output', toolCallId, output: tail.output.join('\n'), stream, cuts }
}

/**
 * An event of the controller as the stream says it, or none for the ones the stream does not carry:
 * only those of the card's list, in Mastra's own shape (`AgentControllerWireEvent`), without the
 * free text of an error or of the observer (security S41).
 */
export function wireEvent(event: AgentControllerEvent): ConversationEvent | undefined {
  switch (event.type) {
    case 'message_start': {
      const message = wireMessage(event.message)
      return message === undefined ? undefined : { type: 'message_start', message }
    }
    case 'message_update': {
      const id = MessageId.parse(event.id)
      const { event: update } = event
      if (update.type !== 'part') return { type: 'message_update', id, event: update }
      const part = wirePart(update.part)
      return part === undefined
        ? undefined
        : { type: 'message_update', id, event: { type: 'part', index: update.index, part } }
    }
    case 'message_end':
      return { type: 'message_end', id: MessageId.parse(event.id) }
    case 'command_exit': {
      const { toolCallId, exitCode, success } = event
      return { type: 'command_exit', toolCallId, exitCode, success }
    }
    case 'tool_suspended': {
      const cuts: string[] = []
      const args = cutLeaves(event.args, 'args', cuts)
      const suspendPayload = cutLeaves(event.suspendPayload, 'suspendPayload', cuts)
      const { toolCallId, toolName } = event
      return {
        type: 'tool_suspended',
        toolCallId,
        toolName,
        args,
        suspendPayload,
        cuts: cuts.length === 0 ? undefined : cuts,
      }
    }
    case 'task_updated':
      return { type: 'task_updated', tasks: event.tasks }
    case 'om_status': {
      const { windows, stepNumber, generationCount } = event
      return { type: 'om_status', windows, stepNumber, generationCount }
    }
    case 'om_observation_start':
    case 'om_buffering_start':
    case 'om_buffering_end':
    case 'om_buffering_failed': {
      const { cycleId, operationType } = event
      return { type: event.type, cycleId, operationType }
    }
    case 'om_observation_end':
    case 'om_reflection_end':
      return { type: event.type, cycleId: event.cycleId, durationMs: event.durationMs }
    case 'om_observation_failed':
    case 'om_reflection_failed':
      return { type: event.type, cycleId: event.cycleId, durationMs: event.durationMs }
    case 'om_reflection_start':
      return { type: 'om_reflection_start', cycleId: event.cycleId }
    case 'agent_end':
      return { type: 'agent_end', reason: event.reason }
    default:
      return undefined
  }
}
