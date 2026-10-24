import type { RunId, TurnFailureCode } from '@conexus/hub-api'
import type { Settled } from '../runs/public.ts'
import { FINISHES } from './turn-line.ts'
import type { TurnLog } from './turn-log.ts'

/** What a turn writes with: its id, and the end of the run its Mastra run took (`turnOf`). */
export type Writing = {
  id: RunId
  traceId: string
  finish: (reason: string) => Promise<Settled | 'gone'>
  /** Resolves `over`, once: the turn said its end, or its session closed. */
  ended: () => void
  over: Promise<void>
}

export type EndReason = 'complete' | 'aborted' | 'error'

type Open = {
  log: TurnLog
  writing: Writing
  /** The turn's failure, decided once its run is finished. */
  failure: TurnFailureCode | undefined
  /** Whose run holds the Projeto, for a turn refused as `RUN_BUSY`. */
  person: string | undefined
  /** How the turn ends, once its run is finished and before Mastra says `agent_end`. */
  end: EndReason | undefined
}

/**
 * The conversation's turn in this process, moved by Mastra's events (code C21): none yet; one Mastra
 * run of it in flight, from the person's message or answer to Mastra's `agent_end`; or over, kept
 * for a stream that reconnects (`Last-Event-ID`). A question ends the turn: its answer opens the next.
 */
export type TurnState =
  | { kind: 'idle' }
  | ({ kind: 'running' } & Open)
  | { kind: 'ended'; last: TurnLog }

export function isOpen(s: TurnState): s is Extract<TurnState, { kind: 'running' }> {
  return s.kind === 'running'
}

/** The turn in progress, or none. */
export function logOf(s: TurnState): TurnLog | undefined {
  return isOpen(s) ? s.log : undefined
}

/** What the turn in progress writes with, or none. */
export function writingOf(s: TurnState): Writing | undefined {
  return isOpen(s) ? s.writing : undefined
}

/** A message's or an answer's turn begins. */
export function opened(log: TurnLog, writing: Writing): TurnState {
  return { kind: 'running', log, writing, failure: undefined, person: undefined, end: undefined }
}

/**
 * The run is finished: the turn's end and failure are decided here, once (card, the failures
 * table): a failure said first, then the save, then how the queue ended the model's turn, never the
 * provider's text (security S41).
 */
export function closed(
  s: TurnState,
  reason: EndReason,
  outcome: Settled | 'gone' | 'threw',
): TurnState {
  if (s.kind !== 'running' || s.end !== undefined) return s
  return { ...s, end: reason, failure: failureOf(s, reason, outcome) }
}

function failureOf(
  s: Extract<TurnState, { kind: 'running' }>,
  reason: EndReason,
  outcome: Settled | 'gone' | 'threw',
): TurnFailureCode | undefined {
  if (s.failure !== undefined) return s.failure
  if (outcome === 'threw') return 'INTERNAL_UNEXPECTED'
  if (outcome !== 'gone' && outcome.kind === 'failed') return outcome.code
  if (reason !== 'error') return undefined
  const finish = s.log.tally.finishReason
  return (finish === undefined ? undefined : FINISHES[finish]) ?? 'MODEL_CALL_FAILED'
}

/** `agent_end`: the turn is over, kept for a reconnect. */
export function ended(s: TurnState): TurnState {
  return isOpen(s) ? { kind: 'ended', last: s.log } : s
}

/** A failure known before the run is finished: the turn's, unless one came first. */
export function failing(s: TurnState, code: TurnFailureCode, person?: string): TurnState {
  if (s.kind !== 'running' || s.end !== undefined || s.failure !== undefined) return s
  return { ...s, failure: code, person }
}
