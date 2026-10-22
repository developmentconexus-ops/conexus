import { ToolCallId } from '@conexus/hub-api'
import type { Agent } from '@mastra/core/agent'
import type { AgentControllerEvent } from '@mastra/core/agent-controller'
import { z } from 'zod'
import { Failure, logFailure } from '../../platform/failure.ts'
import { memoryOwner } from './builder.ts'
import type { Question } from './kept.ts'
import { keepQuestion } from './kept.ts'
import type { Card, Live } from './live.ts'
import { beforeAgentEnd, endRun, openTurn, tell } from './live.ts'
import { ASK_USER_TOOL, questionsOf, SUBMIT_PLAN_TOOL } from './plan-tools.ts'

type Suspended = Extract<AgentControllerEvent, { type: 'tool_suspended' }>
type Cancelled = Extract<AgentControllerEvent, { type: 'tool_suspension_cancelled' }>
/** A call Mastra parked, as its event and its display state hold it. */
type Parked = Pick<Suspended, 'toolCallId' | 'toolName' | 'suspendPayload'>

const Plan = z.object({ title: z.string().default(''), plan: z.string().default('') })

/** The card a parked call asks the person, from what the tool suspended with, or none. */
function cardOf(parked: Parked): Card | undefined {
  const toolCallId = ToolCallId.safeParse(parked.toolCallId)
  if (!toolCallId.success) return undefined
  if (parked.toolName === ASK_USER_TOOL) {
    const questions = questionsOf(parked.suspendPayload)
    return questions === undefined
      ? undefined
      : { type: 'question', toolCallId: toolCallId.data, questions, state: 'open' }
  }
  if (parked.toolName !== SUBMIT_PLAN_TOOL) return undefined
  const { title, plan } = Plan.parse(parked.suspendPayload)
  return { type: 'plan', toolCallId: toolCallId.data, title, plan, state: 'open' }
}

/**
 * The cards the turn waits on: the calls Mastra keeps parked for the person
 * (`displayState.pendingSuspensions`, as Mastra Code reads them in `live-sessions.ts`).
 */
export function openCards(live: Live): Card[] {
  const parked = live.session.displayState.get().pendingSuspensions.values()
  return [...parked].flatMap((each) => cardOf(each) ?? [])
}

/** A card told as it stands: new, answered or closed. */
export function tellCard(live: Live, card: Card): void {
  tell(live, openTurn(live), { type: 'part', part: card })
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
function resumed(live: Live, cards: Card[]): Promise<void> {
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

/** A question or a plan the turn now waits on: shown, and clocked by its run. */
function onSuspended(live: Live, event: Suspended) {
  const card = cardOf(event)
  if (card === undefined) return
  tellCard(live, card)
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

/** The card the turn told for a call, answered or not, until it closes. */
function toldCard(live: Live, toolCallId: ToolCallId): Card | undefined {
  return live.turn?.answer.parts.find(
    (part): part is Card =>
      (part.type === 'question' || part.type === 'plan') &&
      part.toolCallId === toolCallId &&
      (part.state === 'open' || part.state === 'answered' || part.state === 'approved'),
  )
}

/**
 * A call Mastra gave up on, because the person stopped the turn, wrote instead, or the wait ran
 * out: Mastra closes it denied, even when an answer had claimed it, so the card closes and, once
 * none waits, the turn ends. A call of no turn here, as one a stopped copy left, says nothing.
 */
function onCancelled(live: Live, event: Cancelled) {
  const toolCallId = ToolCallId.safeParse(event.toolCallId)
  const card = toolCallId.success ? toldCard(live, toolCallId.data) : undefined
  if (card === undefined) return
  const expired = live.saveFailure === 'QUESTION_EXPIRED'
  tellCard(live, { ...card, state: expired ? 'expired' : 'closed' })
  if (openCards(live).length > 0) return
  waitOn(live, false)
  const { runId } = event
  if (live.steering === undefined) {
    endParked(live, runId).catch((cause: unknown) =>
      logFailure(live.log, new Failure('INTERNAL_UNEXPECTED', { cause })),
    )
    return
  }
  // A message steers the run: its turn goes on in the run the message starts (`agent_start`).
  live.steering.run = runId === undefined ? undefined : live.runs.get(runId)
  if (runId !== undefined) live.runs.delete(runId)
}

/** The questions and plans of the turn: asked by a suspension, closed by a cancellation. */
export function onCardEvent(live: Live, event: AgentControllerEvent): void {
  if (event.type === 'tool_suspended') onSuspended(live, event)
  else if (event.type === 'tool_suspension_cancelled') onCancelled(live, event)
}

/**
 * A message sent while a question waits closes it and goes on in the same turn: Mastra aborts the
 * run parked on the question and starts the next with the message (`steer`), and the turn follows
 * the new run (`agent_start`). False when no card waits, or an answer went on first: the message
 * is then a turn of its own.
 */
export async function steerCards(live: Live, question: Question): Promise<boolean> {
  const taken = await takeCards(live)
  if (taken.length === 0) return false
  try {
    await keepQuestion(live, question)
  } finally {
    releaseCards(live, taken)
  }
  live.steering = { run: undefined }
  await live.session.steer({ content: question.content, requestContext: live.run?.context })
  return true
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
