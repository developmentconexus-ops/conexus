import type { RunId, TurnFailureCode } from '@conexus/hub-api'
import type { RequestContext } from '@mastra/core/request-context'
import type { Turn } from '../model-accounts/public.ts'
import type { Settled } from '../runs/public.ts'
import { FINISHES } from './turn-line.ts'
import type { TurnLog } from './turn-log.ts'

/** What a turn writes with: our run row, Mastra's context, the model queue's turn. */
export type Writing = {
  id: RunId
  traceId: string
  /** What Mastra needs of the turn to go on after an answer or a message. */
  context: RequestContext
  turn: Turn
  finish: (reason: string) => Promise<Settled | 'gone'>
  /** The run waits on the person's answer, or goes on after it; rejects when the database refuses. */
  waiting: (waiting: boolean) => Promise<void>
  /** Resolves the message's wait (`answerTurn`), once, and stops the watch of Mastra's exits. */
  ended: () => void
  /** Stops the watch of the ways Mastra's run ends besides `agent_end` (`turn-exits.ts`). */
  exits: AbortController
}

type Open = { log: TurnLog; writing: Writing; failure: TurnFailureCode | undefined }

export type EndReason = 'complete' | 'aborted' | 'error'

/**
 * The conversation's turn in this process, moved by Mastra's events (code C21): no turn yet; a run
 * of it in flight, its id known from `agent_start`; parked on the person's cards; carried into the
 * next run Mastra starts (a message closed its card, or Mastra keeps input the run never read);
 * closing while its run row is finished; its failure decided, waiting for `agent_end`; or over,
 * kept for a stream that reconnects (`Last-Event-ID`).
 */
export type TurnState =
  | { kind: 'idle' }
  | ({ kind: 'running'; mastraRun: string | undefined } & Open)
  | ({ kind: 'parked'; mastraRun: string | undefined; calls: Set<string> } & Open)
  | ({ kind: 'steering' } & Open)
  | ({ kind: 'closing'; reason: EndReason } & Open)
  | ({ kind: 'ending'; reason: EndReason } & Open)
  | { kind: 'ended'; last: TurnLog }

type OpenState = Extract<TurnState, Open>

export function isOpen(s: TurnState): s is OpenState {
  return s.kind !== 'idle' && s.kind !== 'ended'
}

/** The turn in progress, or none. */
export function logOf(s: TurnState): TurnLog | undefined {
  return isOpen(s) ? s.log : undefined
}

/** What the turn in progress writes with, or none. */
export function writingOf(s: TurnState): Writing | undefined {
  return isOpen(s) ? s.writing : undefined
}

/** A message's turn begins: its run is in flight, Mastra's id for it not known yet. */
export function opened(log: TurnLog, writing: Writing): TurnState {
  return { kind: 'running', mastraRun: undefined, log, writing, failure: undefined }
}

/** `agent_start`: the turn's run is Mastra's `runId`; a card answered or a message carried it here. */
export function started(s: TurnState, mastraRun: string): TurnState {
  if (s.kind !== 'running' && s.kind !== 'parked' && s.kind !== 'steering') return s
  const { log, writing, failure } = s
  return { kind: 'running', mastraRun, log, writing, failure }
}

/** `tool_suspended`: the turn waits on the person for `call`. */
export function suspended(s: TurnState, call: string, mastraRun: string | undefined): TurnState {
  if (s.kind === 'parked')
    return { ...s, mastraRun: mastraRun ?? s.mastraRun, calls: new Set([...s.calls, call]) }
  if (s.kind !== 'running') return s
  const { log, writing, failure } = s
  return {
    kind: 'parked',
    mastraRun: mastraRun ?? s.mastraRun,
    calls: new Set([call]),
    log,
    writing,
    failure,
  }
}

/**
 * `tool_suspension_cancelled`: Mastra closed `call`; with none left waiting, the parked turn ends
 * (`end-parked`). A turn carried by a message goes on in the run the message starts.
 */
export function cancelled(s: TurnState, call: string): TurnState | 'end-parked' {
  if (s.kind !== 'parked' || !s.calls.has(call)) return s
  const calls = new Set([...s.calls].filter((each) => each !== call))
  return calls.size === 0 ? 'end-parked' : { ...s, calls }
}

/** A message closed the turn's cards, or Mastra keeps input its run never read: the next run carries it. */
export function steered(s: TurnState): TurnState {
  if (s.kind !== 'running' && s.kind !== 'parked') return s
  const { log, writing, failure } = s
  return { kind: 'steering', log, writing, failure }
}

/** The turn's run ends, or Mastra ends none of it here: its run row is being finished. */
export function closing(s: TurnState, reason: EndReason): TurnState {
  if (s.kind !== 'running' && s.kind !== 'parked' && s.kind !== 'steering') return s
  const { log, writing, failure } = s
  return { kind: 'closing', reason, log, writing, failure }
}

/**
 * The run row is finished: the turn's failure is decided here, once (card, the failures table): a
 * write refused or a wait run out first, then the save, then how the queue ended the model's
 * turn, never the provider's text (security S41).
 */
export function deciding(s: TurnState, outcome: Settled | 'gone' | 'threw'): TurnState {
  if (s.kind !== 'closing') return s
  return { ...s, kind: 'ending', failure: failureOf(s, outcome) }
}

function failureOf(
  s: Extract<TurnState, { kind: 'closing' }>,
  outcome: Settled | 'gone' | 'threw',
): TurnFailureCode | undefined {
  if (s.failure !== undefined) return s.failure
  if (outcome === 'threw') return 'INTERNAL_UNEXPECTED'
  if (outcome !== 'gone' && outcome.kind === 'failed') return outcome.code
  if (s.reason !== 'error') return undefined
  if (s.writing.turn.outcome === 'exhausted') return 'MODEL_NO_ACCOUNT'
  const finish = s.log.tally.finishReason
  return (finish === undefined ? undefined : FINISHES[finish]) ?? 'MODEL_CALL_FAILED'
}

/** `agent_end`, or a wait that ended with no end here: the turn is over, kept for a reconnect. */
export function ended(s: TurnState): TurnState {
  return isOpen(s) ? { kind: 'ended', last: s.log } : s
}

/** A write the database refused, or a wait that ran out: the turn's failure, unless one came first. */
export function failing(s: TurnState, code: TurnFailureCode): TurnState {
  if (s.kind === 'idle' || s.kind === 'ended' || s.kind === 'ending') return s
  return { ...s, failure: s.failure ?? code }
}
