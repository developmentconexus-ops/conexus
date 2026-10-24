import type { ConversationEvent, MastraPart, MessageId, ThoughtData } from '@conexus/hub-api'
import {
  applyUpdate,
  MachineData,
  machinePhaseLasts,
  THOUGHT_PART,
  ThoughtData as Thought,
} from '@conexus/hub-api'
import type { Speaker, TurnLog } from './turn-log.ts'
import { say } from './turn-log.ts'

/** An event told as the stream says it, folded into the turn's answer as the screen folds it. */
export function tell(live: Speaker, turn: TurnLog, event: ConversationEvent): void {
  if (event.type === 'message_start') {
    // A copy: the event itself stays as said, for a stream that resumes after it.
    turn.steps.push({ ...event.message })
    turn.model = event.message.model ?? turn.model
  } else if (event.type === 'message_update') {
    const step = turn.steps.find((each) => each.id === event.id)
    if (step !== undefined) step.parts = applyUpdate(step.parts, event.event)
  }
  say(live, turn, event)
}

/** What names a part of ours among the others, so a later one replaces it; none for the rest. */
function extraKey(part: MastraPart): string | undefined {
  if (part.type === 'data-conexus-machine') {
    const machine = MachineData.safeParse(part.data)
    return machine.success && machinePhaseLasts(machine.data.phase) ? undefined : 'machine'
  }
  if (part.type === 'data-conexus-version') return 'version'
  if (part.type === THOUGHT_PART) return `thought:${Thought.safeParse(part.data).data?.id ?? ''}`
  return undefined
}

/** A part of ours, told as a part of the message the turn names: it takes the place of the one it replaces. */
export function tellExtra(live: Speaker, turn: TurnLog, part: MastraPart): void {
  const key = extraKey(part)
  const at = key === undefined ? -1 : turn.extras.findIndex((each) => extraKey(each) === key)
  const index = at === -1 ? turn.extras.length : at
  turn.extras = applyUpdate(turn.extras, { type: 'part', index, part })
  say(live, turn, {
    type: 'message_update',
    id: turn.answerId,
    event: { type: 'part', index, part },
  })
}

/** The thinking in progress ends with the first part after it: how long it took, by our clock. */
export function settleThinking(live: Speaker, turn: TurnLog): void {
  for (const [id, since] of turn.thinking) {
    const seconds = Math.ceil((Date.now() - since) / 1000)
    tellExtra(live, turn, { type: THOUGHT_PART, data: { id, seconds } satisfies ThoughtData })
  }
  turn.thinking.clear()
}

/** A reasoning begins at its first delta or part; the key is the one a read gives it: its message and place. */
export function startThinking(turn: TurnLog, messageId: MessageId, index: number): void {
  const key = `${messageId}.${index}`
  if (!turn.thinking.has(key)) turn.thinking.set(key, Date.now())
}
