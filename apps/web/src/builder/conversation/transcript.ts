import type { ConversationEvent, MastraPart, Message, MessageUpdate } from '@conexus/hub-api'
import type { PlanCardItem, QuestionCardItem, TranscriptItem } from './transcript-items.ts'
import {
  extractThoughtSeconds,
  invocationToItem,
  parsePlan,
  parseQuestions,
} from './transcript-items.ts'

export * from './transcript-items.ts'

export function fromParts(
  parts: readonly MastraPart[],
  baseId = 'part',
  suspended: Record<string, unknown> = {},
): readonly TranscriptItem[] {
  const items: TranscriptItem[] = []
  const seconds = extractThoughtSeconds(parts)

  for (const [index, part] of parts.entries()) {
    const id = `${baseId}-${index}`
    if (part.type === 'text') items.push({ kind: 'text', id, text: part.text, cuts: part.cuts })
    else if (part.type === 'reasoning')
      items.push({
        kind: 'reasoning',
        id,
        reasoning: part.reasoning,
        seconds,
        streaming: false,
        cuts: part.cuts,
      })
    else if (part.type === 'tool-invocation') {
      const item = invocationToItem(
        part.toolInvocation,
        suspended[part.toolInvocation.toolCallId],
        part.cuts,
      )
      if (item) items.push(item)
    } else if (part.type !== 'data-conexus-thought') {
      items.push({ kind: 'conexus', id, partType: part.type, data: part.data, cuts: part.cuts })
    }
  }
  return items
}

export function fromMessages(messages: readonly Message[]): readonly TranscriptItem[] {
  return messages.flatMap((m) => fromParts(m.parts, m.id, m.suspended))
}

function applyDelta(
  transcript: readonly TranscriptItem[],
  eventId: string,
  update: MessageUpdate,
): readonly TranscriptItem[] {
  if (update.type === 'text-delta') {
    const last = transcript.at(-1)
    if (last && last.kind === 'text') {
      return [...transcript.slice(0, -1), { ...last, text: last.text + update.delta }]
    }
    return [...transcript, { kind: 'text', id: `${eventId}:text`, text: update.delta }]
  }
  if (update.type === 'reasoning-delta') {
    const id = `${eventId}:reasoning-${update.index}`
    const at = transcript.findIndex((item) => item.kind === 'reasoning' && item.id === id)
    const item = at !== -1 ? transcript[at] : undefined
    if (item && item.kind === 'reasoning') {
      return transcript.with(at, { ...item, reasoning: item.reasoning + update.delta })
    }
    return [
      ...transcript,
      {
        kind: 'reasoning',
        id,
        reasoning: update.delta,
        seconds: null,
        streaming: true,
      },
    ]
  }
  return transcript
}

function applyPartUpdate(
  transcript: readonly TranscriptItem[],
  eventId: string,
  part: MastraPart,
  index: number,
): readonly TranscriptItem[] {
  if (part.type === 'text') {
    const at = transcript.findLastIndex((item) => item.kind === 'text')
    const item = at !== -1 ? transcript[at] : undefined
    if (item && item.kind === 'text') {
      return transcript.with(at, { ...item, text: part.text, cuts: part.cuts })
    }
    return [
      ...transcript,
      { kind: 'text', id: `${eventId}:part-${index}`, text: part.text, cuts: part.cuts },
    ]
  }
  if (part.type === 'reasoning') {
    const id = `${eventId}:part-${index}`
    const at = transcript.findIndex((item) => item.kind === 'reasoning' && item.id === id)
    const item = at !== -1 ? transcript[at] : undefined
    if (item && item.kind === 'reasoning') {
      return transcript.with(at, { ...item, reasoning: part.reasoning, cuts: part.cuts })
    }
    return [
      ...transcript,
      {
        kind: 'reasoning',
        id,
        reasoning: part.reasoning,
        seconds: null,
        streaming: true,
        cuts: part.cuts,
      },
    ]
  }
  if (part.type === 'tool-invocation') {
    const item = invocationToItem(part.toolInvocation, undefined, part.cuts)
    if (!item) return transcript
    const at = transcript.findIndex((candidate) => candidate.id === item.id)
    return at !== -1 ? transcript.with(at, item) : [...transcript, item]
  }
  if (
    part.type === 'data-conexus-thought' &&
    part.data &&
    typeof part.data === 'object' &&
    'seconds' in part.data
  ) {
    const seconds = Reflect.get(part.data, 'seconds')
    const at = transcript.findLastIndex(
      (item) => item.kind === 'reasoning' && item.id.startsWith(`${eventId}:part-`),
    )
    const item = at !== -1 ? transcript[at] : undefined
    if (typeof seconds === 'number' && item && item.kind === 'reasoning') {
      return transcript.with(at, { ...item, seconds, streaming: false })
    }
    return transcript
  }
  return [
    ...transcript,
    {
      kind: 'conexus',
      id: `${eventId}:part-${index}`,
      partType: part.type,
      data: part.data,
      cuts: part.cuts,
    },
  ]
}

function applyToolSuspension(
  transcript: readonly TranscriptItem[],
  event: Extract<ConversationEvent, { type: 'tool_suspended' }>,
): readonly TranscriptItem[] {
  if (event.toolName === 'ask_user') {
    const questions = parseQuestions(event.suspendPayload ?? event.args)
    const card: QuestionCardItem = {
      kind: 'card',
      cardKind: 'question',
      id: event.toolCallId,
      toolCallId: event.toolCallId,
      toolName: 'ask_user',
      state: 'open',
      questions,
    }
    const at = transcript.findIndex((item) => item.id === event.toolCallId)
    return at !== -1 ? transcript.with(at, card) : [...transcript, card]
  }
  if (event.toolName === 'submit_plan') {
    const planInfo = parsePlan(event.suspendPayload ?? event.args)
    const card: PlanCardItem = {
      kind: 'card',
      cardKind: 'plan',
      id: event.toolCallId,
      toolCallId: event.toolCallId,
      toolName: 'submit_plan',
      state: 'open',
      title: planInfo.title,
      plan: planInfo.plan,
      path: planInfo.path,
    }
    const at = transcript.findIndex((item) => item.id === event.toolCallId)
    return at !== -1 ? transcript.with(at, card) : [...transcript, card]
  }
  return transcript
}

export function reduce(
  transcript: readonly TranscriptItem[],
  event: ConversationEvent,
): readonly TranscriptItem[] {
  switch (event.type) {
    case 'turn':
      return fromMessages([event.message])
    case 'message_start':
      return [...transcript, ...fromMessages([event.message])]
    case 'message_update':
      return event.event.type === 'part'
        ? applyPartUpdate(transcript, event.id, event.event.part, event.event.index)
        : applyDelta(transcript, event.id, event.event)
    case 'shell_output': {
      const at = transcript.findIndex((item) => item.id === event.toolCallId)
      const item = at !== -1 ? transcript[at] : undefined
      return item && item.kind === 'tool'
        ? transcript.with(at, { ...item, output: (item.output ?? '') + event.output })
        : transcript
    }
    case 'command_exit': {
      const at = transcript.findIndex((item) => item.id === event.toolCallId)
      const item = at !== -1 ? transcript[at] : undefined
      return item && item.kind === 'tool'
        ? transcript.with(at, {
            ...item,
            exitCode: event.exitCode,
            state: event.success ? 'result' : 'output-error',
            isError: !event.success,
          })
        : transcript
    }
    case 'tool_suspended':
      return applyToolSuspension(transcript, event)
    case 'message_end':
    case 'turnEnd':
    case 'agent_end':
      return transcript.map((item) =>
        item.kind === 'reasoning' ? { ...item, streaming: false } : item,
      )
    case 'task_updated':
    case 'om_status':
    case 'om_observation_start':
    case 'om_observation_end':
    case 'om_observation_failed':
    case 'om_reflection_start':
    case 'om_reflection_end':
    case 'om_reflection_failed':
    case 'om_buffering_start':
    case 'om_buffering_end':
    case 'om_buffering_failed':
      return transcript
    default:
      return event satisfies never
  }
}
