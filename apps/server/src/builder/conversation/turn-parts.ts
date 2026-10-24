import { randomUUID } from 'node:crypto'
import type {
  FailureData,
  Kept,
  MachineData,
  MachinePhase,
  RestartedData,
  RunId,
  TurnFailureCode,
  VersionData,
} from '@conexus/hub-api'
import { MessageId, machinePhaseLasts } from '@conexus/hub-api'
import { Failure, logFailure } from '../../platform/failure.ts'
import type { Live } from './live.ts'
import { saveExtras } from './record.ts'
import { tellExtra } from './tell.ts'
import { TurnTally } from './turn-line.ts'
import type { TurnLog } from './turn-log.ts'
import { messagesOf, say } from './turn-log.ts'
import { wireSuspended } from './wire.ts'

function newTurn(id: RunId | undefined, traceId?: string): TurnLog {
  return {
    id,
    answerId: MessageId.parse(id ?? randomUUID()),
    startedAt: new Date().toISOString(),
    steps: [],
    extras: [],
    model: null,
    after: undefined,
    said: [],
    next: 0,
    thinking: new Map(),
    shells: new Map(),
    tally: new TurnTally(),
    traceId,
    failureKept: false,
    parked: new Set(),
    extrasAt: undefined,
    ended: false,
  }
}

/** The turn in progress, or a new one, which the stream opens with its `turn`. */
export function openTurn(live: Live): TurnLog {
  if (live.turn !== undefined && !live.turn.ended) return live.turn
  const turn = newTurn(live.run?.id, live.run?.traceId)
  live.turn = turn
  const parked = live.session.displayState.get().pendingSuspensions.values()
  const messages = messagesOf(turn, wireSuspended(parked))
  say(live, turn, { type: 'turn', messages, startedAt: turn.startedAt })
  return turn
}

/** A turn another copy ran, ended by a restart: said and kept as this process's last turn. */
export function tellRestarted(live: Live, runId: RunId, kept: Kept): void {
  if (live.turn !== undefined && !live.turn.ended) {
    // The Projeto's lock lets one turn run at a time, so a turn open here cannot be the restarted one's.
    logFailure(
      live.log,
      new Failure('INTERNAL_UNEXPECTED', { cause: 'a restart met an open turn' }),
    )
    return
  }
  const turn = newTurn(runId)
  live.turn = turn
  tellExtra(live, turn, { type: 'data-conexus-restarted', data: { kept } satisfies RestartedData })
  turn.ended = true
  say(live, turn, { type: 'turnEnd', reason: 'aborted' })
}

/** The machine's step, told as the part that says what the turn waits for; a replaced machine lasts. */
export function tellMachine(live: Live, phase: MachinePhase): void {
  const turn = openTurn(live)
  tellExtra(live, turn, { type: 'data-conexus-machine', data: { phase } satisfies MachineData })
  if (machinePhaseLasts(phase)) void saveExtras(live, turn)
}

/** The turn's failure, told and kept once. */
export function tellFailure(live: Live, turn: TurnLog, code: TurnFailureCode): void {
  if (turn.failureKept) return
  turn.failureKept = true
  tellExtra(live, turn, { type: 'data-conexus-failure', data: { code } satisfies FailureData })
}

export function tellVersion(live: Live, turn: TurnLog, saved: VersionData): void {
  tellExtra(live, turn, { type: 'data-conexus-version', data: saved })
}
