import type { ConversationId, TurnFailureCode as FailureCode } from '@conexus/hub-api'
import { MessageId, MessagePart, TurnFailureCode } from '@conexus/hub-api'
import type { Session } from '@mastra/core/agent-controller'
import { z } from 'zod'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure, logFailure } from '../../platform/failure.ts'
import type { TurnLog } from './turn-log.ts'

/** The person's questions not yet saved by Mastra, kept on the thread so a crash loses none. */
export const QUESTION_KEY = 'conexus.questions'
/** One kept question, named by its message's Idempotency-Key. */
export const Question = z.object({ key: z.uuid(), content: z.string(), at: z.iso.datetime() })
export type Question = z.infer<typeof Question>

/**
 * The id of the person's message sent with `key`, made by the server: Mastra saves the message
 * under it, and a read shows the question kept before that save under it too.
 */
export function questionId(conversationId: ConversationId, key: string): MessageId {
  return MessageId.parse(`${conversationId}:${key}`)
}

/** The failures of the turns, kept on the thread so a reload reads each where it happened. */
export const TURN_FAILURES_KEY = 'conexus.turnFailures'
/** A turn's failure, after the person's message of that turn. */
export const TurnFailure = z.object({ after: MessageId, code: TurnFailureCode })
export type TurnFailure = z.infer<typeof TurnFailure>

/** How long each thinking took, kept on the thread so a read shows it as the stream did (#176). */
export const THINKING_KEY = 'conexus.thinking'
/** One thinking's time, named by its part's `id`. */
export const ThoughtTime = z.object({ id: z.string(), seconds: z.number().int().nonnegative() })
export type ThoughtTime = z.infer<typeof ThoughtTime>

/**
 * The parts of a turn that last past its end and Mastra does not save, kept on the thread so a read
 * shows them: the version it saved, the machine it replaced, and the restart that ended it.
 */
export const TURN_PARTS_KEY = 'conexus.turnParts'
/** A lasting part of the turn that answers the person's message `after`. */
export const TurnPart = z.object({ after: MessageId, part: MessagePart })
export type TurnPart = z.infer<typeof TurnPart>

/** What keeping on a conversation's thread needs: its session, its log and its writes in flight. */
export type Keeper = { session: Session; log: FailureLog; kept: Promise<void> }

/** A write to the thread after the ones before it, which the next write waits for in turn. */
export function queued(keeper: Keeper, write: () => Promise<void>): Promise<void> {
  // biome-ignore lint/plugin: a write that failed went to its own caller; this one only waits for the queue to settle (code C37)
  const kept = keeper.kept.catch(() => undefined).then(write)
  keeper.kept = kept
  return kept
}

/**
 * Keeps `item` in the thread's list under `key`, in place of the one it is the `same` as, after the
 * writes before it. A write that fails is logged and the turn goes on without it.
 */
export function keptInList<T>(
  keeper: Keeper,
  kept: { key: string; list: z.ZodType<T[]>; item: T; same: (each: T) => boolean },
): Promise<void> {
  const { key, list, item, same } = kept
  const { thread } = keeper.session
  return queued(keeper, async () => {
    const read = list.safeParse(await thread.getSetting({ key }))
    const others = (read.success ? read.data : []).filter((each) => !same(each))
    await thread.setSetting({ key, value: [...others, item] })
  }).catch((cause: unknown) =>
    logFailure(keeper.log, new Failure('INTERNAL_UNEXPECTED', { cause })),
  )
}

/** A machine part is of the kind of its phase; any other part, of its type. */
function sameKind(one: MessagePart, other: MessagePart): boolean {
  if (one.type !== other.type) return false
  return one.type !== 'machine' || (other.type === 'machine' && one.phase === other.phase)
}

/** Keeps a lasting part of the turn on the thread, after the person's message it answers. */
export function keepPart(
  keeper: Keeper,
  turn: Pick<TurnLog, 'after'>,
  part: MessagePart,
): Promise<void> {
  const { after } = turn
  if (after === undefined) return Promise.resolve()
  return keptInList(keeper, {
    key: TURN_PARTS_KEY,
    list: z.array(TurnPart),
    item: { after, part },
    same: (each) => each.after === after && sameKind(each.part, part),
  })
}

/** Keeps the turn's failure on the thread, once per message (`after`). */
export function keepFailure(keeper: Keeper, turn: TurnLog, code: FailureCode): Promise<void> {
  const { after } = turn
  if (after === undefined || turn.failureKept) return Promise.resolve()
  turn.failureKept = true
  return keptInList(keeper, {
    key: TURN_FAILURES_KEY,
    list: z.array(TurnFailure),
    item: { after, code },
    same: (each) => each.after === after,
  })
}

/**
 * Keeps the person's question on the thread (Mastra saves a run's messages only at its end): with
 * the others of the run in progress, or alone when no other message is in flight, since the
 * earlier ones are saved. The writes go one after the other, so the last one holds every question.
 */
export function keepQuestion(
  live: Keeper & { asked: Set<unknown>; questions: Question[] },
  question: Question,
): Promise<void> {
  const running = live.asked.size > 0 || live.session.stream.isActive()
  const others = live.questions.filter((each) => each.key !== question.key)
  live.questions = running ? [...others, question] : [question]
  const value = live.questions
  return queued(live, () => live.session.thread.setSetting({ key: QUESTION_KEY, value }))
}
