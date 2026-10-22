import { ToolCallId } from '@conexus/hub-api'
import type { Agent } from '@mastra/core/agent'
import type { AgentControllerEvent } from '@mastra/core/agent-controller'
import { z } from 'zod'
import { memoryOwner } from './builder.ts'
import type { Question } from './kept.ts'
import { keepQuestion } from './kept.ts'
import type { Card, Live } from './live.ts'
import { beforeAgentEnd, endRun, openTurn, tell } from './live.ts'
import { ASK_USER_TOOL, questionsOf, SUBMIT_PLAN_TOOL } from './plan-tools.ts'

type Suspended = Extract<AgentControllerEvent, { type: 'tool_suspended' }>
type Cancelled = Extract<AgentControllerEvent, { type: 'tool_suspension_cancelled' }>

const Plan = z.object({ title: z.string().default(''), plan: z.string().default('') })

/** The card a suspended call asks the person, from what the tool suspended with, or none. */
function cardOf(event: Suspended): Card | undefined {
  const toolCallId = ToolCallId.safeParse(event.toolCallId)
  if (!toolCallId.success) return undefined
  if (event.toolName === ASK_USER_TOOL) {
    const questions = questionsOf(event.suspendPayload)
    return questions === undefined
      ? undefined
      : { type: 'question', toolCallId: toolCallId.data, questions, state: 'open' }
  }
  if (event.toolName !== SUBMIT_PLAN_TOOL) return undefined
  const { title, plan } = Plan.parse(event.suspendPayload)
  return { type: 'plan', toolCallId: toolCallId.data, title, plan, state: 'open' }
}

/** A card told as it stands: new, answered or closed. */
export function tellCard(live: Live, card: Card): void {
  tell(live, openTurn(live), { type: 'part', part: card })
}

/** The wait ran out: the turn ends as Parar ends it, saying why. */
export function expire(live: Live): void {
  live.expiring = true
  live.saveFailure = 'QUESTION_EXPIRED'
  live.session.abort()
}

/** A question or a plan the turn now waits on: shown, and clocked by its run. */
function onSuspended(live: Live, event: Suspended) {
  const card = cardOf(event)
  if (card === undefined) return
  live.pending.set(card.toolCallId, { card, run: event.runId, claimed: false })
  tellCard(live, card)
  void live.run?.waiting(true)
}

/** Mastra ends no run it parked and then aborted: the turn ends here, as an aborted run's does. */
async function endParked(live: Live, run: string | undefined): Promise<void> {
  await beforeAgentEnd(live, 'aborted')
  endRun(live, 'aborted', run)
}

/** A call Mastra gave up on, because the person stopped the turn, wrote instead, or the wait ran out. */
function onCancelled(live: Live, event: Cancelled) {
  const found = live.pending.get(event.toolCallId)
  if (found === undefined) return
  live.pending.delete(event.toolCallId)
  const { card } = found
  tellCard(live, { ...card, state: live.expiring ? 'expired' : 'closed' })
  if (live.pending.size > 0) return
  live.expiring = false
  void live.run?.waiting(false)
  const { run } = found
  if (live.steering === undefined) {
    void endParked(live, run)
    return
  }
  // A message steers the run: its turn goes on in the run the message starts (`agent_start`).
  live.steering.run = run === undefined ? undefined : live.runs.get(run)
  if (run !== undefined) live.runs.delete(run)
}

/** The questions and plans of the turn: asked by a suspension, closed by a cancellation. */
export function onCardEvent(live: Live, event: AgentControllerEvent): void {
  if (event.type === 'tool_suspended') onSuspended(live, event)
  else if (event.type === 'tool_suspension_cancelled') onCancelled(live, event)
}

/**
 * A message sent while a question waits closes it and goes on in the same turn: Mastra aborts the
 * run parked on the question and starts the next with the message (`steer`), and the turn follows
 * the new run (`agent_start`).
 */
export async function steerCards(live: Live, question: Question): Promise<void> {
  await keepQuestion(live, question)
  live.steering = { run: undefined }
  await live.session.steer({ content: question.content, requestContext: live.run?.context })
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
