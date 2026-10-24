import type { Question as AskedQuestion } from '@conexus/hub-api'
import { ToolCallId } from '@conexus/hub-api'
import type { Agent } from '@mastra/core/agent'
import type { AgentControllerEvent } from '@mastra/core/agent-controller'
import { z } from 'zod'
import { Failure, logFailure } from '../../platform/failure.ts'
import { memoryOwner } from './builder.ts'
import type { Live } from './live.ts'
import { beforeAgentEnd, endRun } from './live.ts'
import { ASK_USER_TOOL, questionsOf, SUBMIT_PLAN_TOOL } from './plan-tools.ts'

type Suspended = Extract<AgentControllerEvent, { type: 'tool_suspended' }>
type Cancelled = Extract<AgentControllerEvent, { type: 'tool_suspension_cancelled' }>
/** A call Mastra parked, as its event and its display state hold it. */
type Parked = Pick<Suspended, 'toolCallId' | 'toolName' | 'suspendPayload'>

/**
 * A question or a plan the turn waits on, as the answer needs it: what the tool suspended with.
 * The screen reads the same call from the stream's `tool_suspended` and the tool's result.
 */
export type Card = { toolCallId: ToolCallId } & (
  | { type: 'question'; questions: AskedQuestion[] }
  | { type: 'plan'; title: string; plan: string }
)

const Plan = z.object({ title: z.string().default(''), plan: z.string().default('') })

/** The card a parked call asks the person, from what the tool suspended with, or none. */
function cardOf(parked: Parked): Card | undefined {
  const toolCallId = ToolCallId.safeParse(parked.toolCallId)
  if (!toolCallId.success) return undefined
  if (parked.toolName === ASK_USER_TOOL) {
    const questions = questionsOf(parked.suspendPayload)
    return questions === undefined
      ? undefined
      : { type: 'question', toolCallId: toolCallId.data, questions }
  }
  if (parked.toolName !== SUBMIT_PLAN_TOOL) return undefined
  const { title, plan } = Plan.parse(parked.suspendPayload)
  return { type: 'plan', toolCallId: toolCallId.data, title, plan }
}

/**
 * The cards the turn waits on: the calls Mastra keeps parked for the person
 * (`displayState.pendingSuspensions`, as Mastra Code reads them in `live-sessions.ts`).
 */
export function openCards(live: Live): Card[] {
  const parked = live.session.displayState.get().pendingSuspensions.values()
  return [...parked].flatMap((each) => cardOf(each) ?? [])
}

/**
 * The run waits on the person or goes on: its row and its clock. A write the database refuses
 * ends the turn, saying so (card, the failures table).
 */
export function waitOn(live: Live, waiting: boolean): void {
  live.run?.waiting(waiting).catch((cause: unknown) => {
    logFailure(live.log, new Failure('INTERNAL_UNEXPECTED', { cause }))
    live.saveFailure ??= 'INTERNAL_UNEXPECTED'
    live.session.abort()
  })
}

/** Until the resumed calls end, or the run does. */
export function resumed(live: Live, cards: Card[]): Promise<void> {
  const calls = new Set<string>(cards.map((card) => card.toolCallId))
  return new Promise((done) => {
    const unsubscribe = live.session.subscribe((event) => {
      const ended =
        (event.type === 'tool_end' && calls.has(event.toolCallId)) ||
        event.type === 'agent_end' ||
        event.type === 'error'
      if (!ended) return
      unsubscribe()
      done()
    })
  })
}

/**
 * Until the turn waits only on the person: a card open and no run in flight, as Mastra's
 * `agent_end` `suspended` leaves it.
 */
export function parked(live: Live): Promise<void> {
  return new Promise((done) => {
    if (openCards(live).length > 0 && !live.session.run.isRunning()) return done()
    const unsubscribe = live.session.subscribe((event) => {
      if (event.type !== 'agent_end' || event.reason !== 'suspended') return
      unsubscribe()
      done()
    })
  })
}

/** Gives back the cards `takeCards` took. */
export function releaseCards(live: Live, taken: string[]): void {
  for (const key of taken) live.session.releaseToolResponse(key)
}

/**
 * Takes every open card with Mastra's claim, for a Parar or a message that closes them; none when
 * none is open. An answer that took a card first goes first: Mastra's abort does not see the claim,
 * and the resume the answer started would go on after the abort closed the call; so its call ends
 * first, and the Parar or the message then meets the run the answer goes on in. Held, the claims
 * make an answer that comes meanwhile `QUESTION_CLOSED`.
 */
export async function takeCards(live: Live): Promise<string[]> {
  for (;;) {
    const claims = openCards(live).map((card) => ({
      card,
      claim: live.session.claimToolSuspension(card.toolCallId),
    }))
    const taken = claims.flatMap(({ claim }) => (claim.accepted ? [claim.claimKey] : []))
    const answered = claims.flatMap(({ card, claim }) =>
      !claim.accepted && claim.reason === 'not_pending' ? [card] : [],
    )
    if (answered.length === 0) return taken
    releaseCards(live, taken)
    await resumed(live, answered)
  }
}

/** The wait ran out: the turn ends as Parar ends it, saying why. */
export function expire(live: Live): void {
  live.saveFailure = 'QUESTION_EXPIRED'
  live.session.abort()
}

/** A question or a plan the turn now waits on: the stream says it (`tool_suspended`), and its run clocks it. */
function onSuspended(live: Live, event: Suspended) {
  if (cardOf(event) === undefined) return
  waitOn(live, true)
}

/** Mastra ends no run it parked and then aborted: the turn ends here, as an aborted run's does. */
async function endParked(live: Live, run: string | undefined): Promise<void> {
  try {
    await beforeAgentEnd(live, 'aborted')
  } finally {
    endRun(live, 'aborted', run)
  }
}

/**
 * A call Mastra gave up on, because the person stopped the turn, wrote instead, or the wait ran
 * out: Mastra closes it denied, even when an answer had claimed it, so, once none waits, the turn
 * ends. A call of no turn here, as one a stopped copy left, says nothing.
 */
function onCancelled(live: Live, event: Cancelled) {
  const turn = live.turn
  if (turn === undefined || turn.ended || !turn.parked.delete(event.toolCallId)) return
  if (openCards(live).length > 0) return
  waitOn(live, false)
  const { runId } = event
  if (live.carry === undefined) {
    endParked(live, runId).catch((cause: unknown) =>
      logFailure(live.log, new Failure('INTERNAL_UNEXPECTED', { cause })),
    )
    return
  }
  // A message steers the run: its turn goes on in the run the message starts (`agent_start`).
  live.carry.run = runId === undefined ? undefined : live.runs.get(runId)
  if (runId !== undefined) live.runs.delete(runId)
}

/** The questions and plans of the turn: asked by a suspension, closed by a cancellation. */
export function onCardEvent(live: Live, event: AgentControllerEvent): void {
  if (event.type === 'tool_suspended') onSuspended(live, event)
  else if (event.type === 'tool_suspension_cancelled') onCancelled(live, event)
}

/**
 * The questions and plans a stopped copy left parked in Mastra's database are closed denied, and
 * their runs released, so nothing of them stays: the session takes them as its own parked
 * suspensions and aborts, which settles them (`settleSuspendedToolCallsAsDenied`) and releases
 * their runs.
 */
export async function denyParked(
  live: Live,
  agent: Pick<Agent, 'listSuspendedRuns'>,
): Promise<void> {
  const threadId = live.conversationId
  const resourceId = memoryOwner(live.owner)
  const { runs } = await agent.listSuspendedRuns({ threadId, resourceId })
  for (const run of runs) {
    for (const { toolCallId, toolName } of run.toolCalls) {
      if (toolName === undefined || toolCallId === undefined) continue
      live.session.suspensions.register({
        toolCallId,
        toolName,
        runId: run.runId,
        threadId,
        resourceId,
      })
    }
  }
  if (runs.length > 0) live.session.abort()
}
