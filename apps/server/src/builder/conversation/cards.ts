import type { Question as AskedQuestion } from '@conexus/hub-api'
import { ToolCallId } from '@conexus/hub-api'
import type { Agent } from '@mastra/core/agent'
import type { AgentControllerEvent } from '@mastra/core/agent-controller'
import { z } from 'zod'
import { Failure, logFailure } from '../../platform/failure.ts'
import { memoryOwner } from './builder.ts'
import type { Live } from './live.ts'
import { ASK_USER_TOOL, questionsOf, SUBMIT_PLAN_TOOL } from './plan-tools.ts'
import { endWithout } from './turn-end.ts'
import { cancelled, failing, writingOf } from './turn-state.ts'

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
  writingOf(live.state)
    ?.waiting(waiting)
    .catch((cause: unknown) => {
      logFailure(live.log, new Failure('INTERNAL_UNEXPECTED', { cause }))
      live.state = failing(live.state, 'INTERNAL_UNEXPECTED')
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

/** The calls held with Mastra's claim here, by call, each until given back (`releaseCards`). */
const held = new WeakMap<
  Live,
  Map<ToolCallId, { claimKey: string; given: () => void; back: Promise<void> }>
>()

/** Mastra's claim on `toolCallId`, for an answer, a Parar or a message; held until `releaseCards`. */
export function claimCard(live: Live, toolCallId: ToolCallId) {
  const claim = live.session.claimToolSuspension(toolCallId)
  if (!claim.accepted) return claim
  const claims = held.get(live) ?? new Map()
  const { promise: back, resolve: given } = Promise.withResolvers<void>()
  held.set(live, claims.set(toolCallId, { claimKey: claim.claimKey, given, back }))
  return claim
}

/** Gives back the calls claimed with `claimCard`, waking whoever waits for them. */
export function releaseCards(live: Live, calls: ToolCallId[]): void {
  for (const call of calls) {
    const claim = held.get(live)?.get(call)
    if (claim === undefined) continue
    held.get(live)?.delete(call)
    live.session.releaseToolResponse(claim.claimKey)
    claim.given()
  }
}

/**
 * Takes every open card with Mastra's claim, for a Parar or a message that closes them; none when
 * none is open. An answer that took a card first goes first: Mastra's abort does not see the claim,
 * and the resume the answer started would go on after the abort closed the call; so the claim is
 * given back first, and the Parar or the message then meets the run the answer goes on in, or the
 * card Mastra refused to resume. Held, the claims make an answer that comes meanwhile
 * `QUESTION_CLOSED`.
 */
export async function takeCards(live: Live): Promise<ToolCallId[]> {
  for (;;) {
    const claims = openCards(live).map(({ toolCallId }) => ({
      toolCallId,
      claim: claimCard(live, toolCallId),
    }))
    const taken = claims.flatMap(({ toolCallId, claim }) => (claim.accepted ? [toolCallId] : []))
    const answered = claims.flatMap(({ toolCallId, claim }) => {
      const back = held.get(live)?.get(toolCallId)?.back
      return !claim.accepted && claim.reason === 'not_pending' && back !== undefined ? [back] : []
    })
    if (answered.length === 0) return taken
    releaseCards(live, taken)
    await Promise.all(answered)
  }
}

/** The wait ran out: the turn ends as Parar ends it, saying why. */
export function expire(live: Live): void {
  live.state = failing(live.state, 'QUESTION_EXPIRED')
  live.session.abort()
}

/** A question or a plan the turn now waits on: the stream says it (`tool_suspended`), and its run clocks it. */
function onSuspended(live: Live, event: Suspended) {
  if (cardOf(event) === undefined) return
  waitOn(live, true)
}

/**
 * A call Mastra gave up on, because the person stopped the turn, wrote instead, or the wait ran
 * out: Mastra closes it denied, even when an answer had claimed it, so, once none waits, the turn
 * ends, as an aborted run's does, since Mastra ends no run it parked and then aborted. A call of
 * no turn here, or of a turn a message carries on, says nothing more.
 */
function onCancelled(live: Live, event: Cancelled) {
  const s = live.state
  const next = cancelled(s, event.toolCallId)
  if (next !== 'end-parked') {
    live.state = next
    return
  }
  if (s.kind !== 'parked') return
  waitOn(live, false)
  endWithout(live, s.writing, 'aborted').catch((cause: unknown) =>
    logFailure(live.log, new Failure('INTERNAL_UNEXPECTED', { cause })),
  )
}

/** The questions and plans of the turn: asked by a suspension, closed by a cancellation. */
export function onCardEvent(live: Live, event: AgentControllerEvent): void {
  if (event.type === 'tool_suspended') onSuspended(live, event)
  else if (event.type === 'tool_suspension_cancelled') onCancelled(live, event)
}

/**
 * A parked turn left to the next copy: the watch of its run's exits and our listener go first,
 * since Mastra's abort still says `tool_suspension_cancelled` for each parked call and tears the
 * stream down, then Mastra keeps the run as it is (`detachFromCurrent`), without closing the card.
 */
export function detach(live: Live): void {
  writingOf(live.state)?.exits.abort()
  live.unsubscribe()
  live.session.thread.detachFromCurrent()
}

/**
 * The cards a stopped copy left parked in Mastra's database, made this session's again, as Mastra's
 * own resume registers a cold suspension (`resolveSuspensionAgent`); the Mastra runs they belong to.
 */
export async function adoptCards(
  live: Live,
  agent: Pick<Agent, 'listSuspendedRuns'>,
): Promise<string[]> {
  const threadId = live.conversationId
  const resourceId = memoryOwner(live.owner)
  const { runs } = await agent.listSuspendedRuns({ threadId, resourceId })
  const adopted: string[] = []
  for (const { runId, toolCalls } of runs) {
    for (const { toolCallId, toolName, args, suspendPayload } of toolCalls) {
      if (toolName === undefined || toolCallId === undefined) continue
      const address = { toolCallId, toolName, runId, threadId, resourceId }
      live.session.suspensions.register(address)
      // Mastra's database keeps a tool's own suspension without its arguments: the card reads its payload.
      const suspended = { ...address, args: args ?? null, suspendPayload }
      live.session.displayState.apply({ type: 'tool_suspended', ...suspended })
      if (!adopted.includes(runId)) adopted.push(runId)
    }
  }
  return adopted
}
