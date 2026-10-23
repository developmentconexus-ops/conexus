import type { ConversationEvent, MastraPart, Message, OMProgress } from '@conexus/hub-api'
import { applyUpdate } from '@conexus/hub-api'
import type { Task, TranscriptItem } from './transcript.ts'
import { fromMessages, reduce } from './transcript.ts'

export type OMPhase = 'idle' | 'buffering' | 'observing' | 'reflecting'

export type Live =
  | { kind: 'idle' }
  | {
      kind: 'answering'
      transcript: readonly TranscriptItem[]
      parts: readonly MastraPart[]
      startedAt: string | null
      tasks: readonly Task[]
      memory: OMProgress | null
      omPhase: OMPhase
      memoryFailed?: 'observation' | 'reflection' | null
    }
  | {
      kind: 'resuming'
      transcript: readonly TranscriptItem[]
      parts: readonly MastraPart[]
      startedAt: string | null
      tasks: readonly Task[]
      memory: OMProgress | null
      omPhase: OMPhase
      memoryFailed?: 'observation' | 'reflection' | null
    }
  | {
      kind: 'ended'
      transcript: readonly TranscriptItem[]
      parts: readonly MastraPart[]
      tasks: readonly Task[]
      memory: OMProgress | null
      omPhase: OMPhase
      memoryFailed?: 'observation' | 'reflection' | null
    }

export const IDLE: Live = { kind: 'idle' }

export type Step =
  | ConversationEvent
  | { type: 'sent' }
  | { type: 'unsent' }
  | { type: 'reconnected' }

type ActiveState = Extract<Live, { kind: 'answering' }>

function inProgress(state: Live): ActiveState {
  if (state.kind === 'answering' || state.kind === 'resuming') {
    return {
      kind: 'answering',
      transcript: state.transcript,
      parts: state.parts,
      startedAt: state.startedAt,
      tasks: state.tasks,
      memory: state.memory,
      omPhase: state.omPhase,
      memoryFailed: state.memoryFailed,
    }
  }
  return {
    kind: 'answering',
    transcript: [],
    parts: [],
    startedAt: null,
    tasks: [],
    memory: null,
    omPhase: 'idle',
    memoryFailed: null,
  }
}

function handleOmStatus(
  current: ActiveState,
  step: Extract<ConversationEvent, { type: 'om_status' }>,
): ActiveState {
  const msgWindow = step.windows.active.messages
  const obsWindow = step.windows.active.observations
  const status =
    current.omPhase === 'observing' || current.omPhase === 'reflecting' ? current.omPhase : 'idle'
  const memory: OMProgress = {
    status,
    pendingTokens: msgWindow.tokens,
    threshold: msgWindow.threshold,
    thresholdPercent: msgWindow.threshold > 0 ? (msgWindow.tokens / msgWindow.threshold) * 100 : 0,
    observationTokens: obsWindow.tokens,
    reflectionThreshold: obsWindow.threshold,
    reflectionThresholdPercent:
      obsWindow.threshold > 0 ? (obsWindow.tokens / obsWindow.threshold) * 100 : 0,
    generationCount: step.generationCount,
    stepNumber: step.stepNumber,
  }
  return { ...current, memory }
}

function handleOmPhaseEvent(
  current: ActiveState,
  step: Extract<
    ConversationEvent,
    | { type: 'om_observation_start' }
    | { type: 'om_observation_end' }
    | { type: 'om_observation_failed' }
    | { type: 'om_reflection_start' }
    | { type: 'om_reflection_end' }
    | { type: 'om_reflection_failed' }
    | { type: 'om_buffering_start' }
    | { type: 'om_buffering_end' }
    | { type: 'om_buffering_failed' }
  >,
): ActiveState {
  switch (step.type) {
    case 'om_observation_start':
      return { ...current, omPhase: 'observing' }
    case 'om_observation_end':
      return { ...current, omPhase: 'idle', memoryFailed: null }
    case 'om_observation_failed':
      return { ...current, omPhase: 'idle', memoryFailed: 'observation' }
    case 'om_reflection_start':
      return { ...current, omPhase: 'reflecting' }
    case 'om_reflection_end':
      return { ...current, omPhase: 'idle', memoryFailed: null }
    case 'om_reflection_failed':
      return { ...current, omPhase: 'idle', memoryFailed: 'reflection' }
    case 'om_buffering_start':
      return { ...current, omPhase: 'buffering' }
    case 'om_buffering_end':
    case 'om_buffering_failed':
      return { ...current, omPhase: 'idle' }
    default:
      return step satisfies never
  }
}

function handleMessageEvent(
  current: ActiveState,
  step: Extract<
    ConversationEvent,
    | { type: 'message_start' }
    | { type: 'message_update' }
    | { type: 'message_end' }
    | { type: 'shell_output' }
    | { type: 'command_exit' }
    | { type: 'tool_suspended' }
    | { type: 'agent_end' }
  >,
): ActiveState {
  if (step.type === 'message_start') {
    const transcript = [...current.transcript, ...fromMessages([step.message])]
    return { ...current, transcript, parts: [...current.parts, ...step.message.parts] }
  }
  if (step.type === 'message_update') {
    const transcript = reduce(current.transcript, step)
    const parts = applyUpdate(current.parts, step.event)
    return { ...current, transcript, parts }
  }
  if (step.type === 'agent_end') {
    const transcript = reduce(current.transcript, step)
    return { ...current, transcript, omPhase: 'idle' }
  }
  return { ...current, transcript: reduce(current.transcript, step) }
}

export function live(state: Live, step: Step): Live {
  switch (step.type) {
    case 'sent':
      return state.kind === 'answering' ? state : inProgress(state)
    case 'unsent':
      return state.kind === 'answering' && state.parts.length === 0 ? IDLE : state
    case 'reconnected':
      return state.kind === 'answering' ? { ...inProgress(state), kind: 'resuming' } : state
    case 'turn':
      return {
        kind: 'answering',
        transcript: fromMessages([step.message]),
        parts: step.message.parts,
        startedAt: step.startedAt,
        tasks: [],
        memory: null,
        omPhase: 'idle',
        memoryFailed: null,
      }
    case 'task_updated':
      return { ...inProgress(state), tasks: step.tasks }
    case 'om_status':
      return handleOmStatus(inProgress(state), step)
    case 'om_observation_start':
    case 'om_observation_end':
    case 'om_observation_failed':
    case 'om_reflection_start':
    case 'om_reflection_end':
    case 'om_reflection_failed':
    case 'om_buffering_start':
    case 'om_buffering_end':
    case 'om_buffering_failed':
      return handleOmPhaseEvent(inProgress(state), step)
    case 'message_start':
    case 'message_update':
    case 'message_end':
    case 'shell_output':
    case 'command_exit':
    case 'tool_suspended':
    case 'agent_end':
      return handleMessageEvent(inProgress(state), step)
    case 'turnEnd':
      return state.kind === 'answering' || state.kind === 'resuming'
        ? { ...inProgress(state), kind: 'ended' }
        : state
    default:
      return step satisfies never
  }
}

export function shownAnswer(
  state: Live,
  messages: readonly Message[],
): {
  transcript: readonly TranscriptItem[]
  parts: readonly MastraPart[]
  streaming: boolean
} | null {
  switch (state.kind) {
    case 'idle':
      return null
    case 'answering':
      return { transcript: state.transcript, parts: state.parts, streaming: true }
    case 'resuming':
    case 'ended':
      return state.parts.length === 0 || messages.at(-1)?.role === 'builder'
        ? null
        : { transcript: state.transcript, parts: state.parts, streaming: false }
    default:
      return state satisfies never
  }
}
