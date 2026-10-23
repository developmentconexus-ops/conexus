import type { ConversationEvent, Message, ToolCallId } from '@conexus/hub-api'
import { MastraPart, MessageId, ModelId, WIRE_LIMITS } from '@conexus/hub-api'
import type { AgentControllerEvent, MastraDBMessage } from '@mastra/core/agent-controller'
import { WORKSPACE_TOOLS } from '@mastra/core/workspace'
import { z } from 'zod'
import type { Tail } from './shell.ts'
import { tailOf } from './shell.ts'

/**
 * The only place that cuts what Mastra holds before it leaves for the screen (card of step 14.2,
 * U2; code C26): a string in a tool's arguments or result keeps its first `WIRE_LIMITS.text`
 * characters, a command's output its last lines and bytes, and `cuts` names each place. The model's
 * own words and reasoning go whole. Mastra's `getDisplayTransform` (`stream-content.d.ts`) transforms
 * a payload by tool and does not limit its size, so the limit is ours.
 */
const DEEPEST = 8

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
    const { args, result } = toolInvocation
    const command = toolInvocation.toolName === WORKSPACE_TOOLS.SANDBOX.EXECUTE_COMMAND
    const output = command && typeof result === 'string' ? tailOf(result) : undefined
    if (output?.cut) cuts.push('toolInvocation.result')
    const cutResult =
      output === undefined ? cutLeaves(result, 'toolInvocation.result', cuts) : outputText(output)
    const cutArgs = cutLeaves(args, 'toolInvocation.args', cuts)
    // Mastra's stream says `isError: false` on a call that succeeded and its store leaves it out; the Hub says it only when true.
    const { isError, ...call } = toolInvocation
    const shown = { ...call, ...(isError ? { isError } : {}), args: cutArgs, result: cutResult }
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

/** The parts Mastra keeps in a message that the screen reads: a step, a source or a file stay inside. */
type Known = Extract<
  MastraDBMessage['content']['parts'][number],
  { type: 'text' | 'reasoning' | 'tool-invocation' }
>

/** The proof that what Mastra keeps of these parts fits the schema of the Hub (code C27). */
function fits(part: Known): z.input<typeof MastraPart> {
  return part
}

/** What the screen gets of one of Mastra's parts, or none for the parts that stay inside. */
function wirePart(part: MastraDBMessage['content']['parts'][number]): MastraPart | undefined {
  const known = part.type === 'text' || part.type === 'reasoning' || part.type === 'tool-invocation'
  const read = MastraPart.safeParse(known ? fits(part) : part)
  return read.success ? cutPart(read.data) : undefined
}

const Answered = z.object({ modelId: z.string().min(1), provider: z.string().min(1) })
const PersonSignal = z.object({ signal: z.object({ type: z.literal('user') }) })
const SuspendedTools = z.object({
  suspendedTools: z.record(z.string(), z.object({ suspendPayload: z.unknown() })),
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
  return Object.fromEntries(
    Object.entries(read.data.suspendedTools).map(([call, { suspendPayload }]) => {
      const cuts: string[] = []
      const payload = cutLeaves(suspendPayload, 'suspendPayload', cuts)
      return [
        call,
        cuts.length === 0 ? { suspendPayload: payload } : { suspendPayload: payload, cuts },
      ]
    }),
  )
}

/** A stored message as the person reads it: theirs, or the Builder's; none of Mastra's others. */
export function wireMessage(message: MastraDBMessage): Message | undefined {
  const role =
    message.role === 'assistant'
      ? 'builder'
      : message.role === 'user' ||
          (message.role === 'signal' && PersonSignal.safeParse(message.content.metadata).success)
        ? 'person'
        : undefined
  if (role === undefined) return undefined
  return {
    id: MessageId.parse(message.id),
    role,
    parts: message.content.parts.flatMap((part) => wirePart(part) ?? []),
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
      return message?.role === 'builder' ? { type: 'message_start', message } : undefined
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
