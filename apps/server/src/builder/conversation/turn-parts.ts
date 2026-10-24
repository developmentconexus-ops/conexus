import type {
  FailureData,
  MachineData,
  MachinePhase,
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
import type { Writing } from './turn-state.ts'
import { isOpen, logOf, opened } from './turn-state.ts'
import { wireSuspended } from './wire.ts'

function newTurn(id: RunId, traceId?: string): TurnLog {
  return {
    id,
    answerId: MessageId.parse(id),
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
    extrasAt: undefined,
  }
}

/** The turn of a run of ours begins: the stream opens it with its `turn`, with the cards Mastra keeps. */
export function beginTurn(live: Live, writing: Writing): TurnLog {
  if (isOpen(live.state)) {
    // The Projeto's lock lets one turn run at a time: one open here is no longer anyone's to wait on.
    logFailure(live.log, new Failure('INTERNAL_UNEXPECTED', { cause: 'a turn met an open turn' }))
    live.state.writing.ended()
  }
  const turn = newTurn(writing.id, writing.traceId)
  live.state = opened(turn, writing)
  const parked = live.session.displayState.get().pendingSuspensions.values()
  const messages = messagesOf(turn, wireSuspended(parked))
  say(live, turn, { type: 'turn', messages, startedAt: turn.startedAt })
  return turn
}

/** The machine's step, told as the part that says what the turn waits for; a replaced machine lasts. */
export function tellMachine(live: Live, phase: MachinePhase): void {
  const turn = logOf(live.state)
  if (turn === undefined) return
  tellExtra(live, turn, { type: 'data-conexus-machine', data: { phase } satisfies MachineData })
  if (machinePhaseLasts(phase)) void saveExtras(live, turn)
}

/** The turn's failure, told where it is decided (`deciding`). */
export function tellFailure(live: Live, turn: TurnLog, code: TurnFailureCode): void {
  tellExtra(live, turn, { type: 'data-conexus-failure', data: { code } satisfies FailureData })
}

export function tellVersion(live: Live, turn: TurnLog, saved: VersionData): void {
  tellExtra(live, turn, { type: 'data-conexus-version', data: saved })
}
