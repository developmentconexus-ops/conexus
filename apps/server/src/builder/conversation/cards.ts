import type { Question as AskedQuestion } from '@conexus/hub-api'
import { ToolCallId } from '@conexus/hub-api'
import type { Agent } from '@mastra/core/agent'
import type { AgentControllerEvent } from '@mastra/core/agent-controller'
import { z } from 'zod'
import { memoryOwner } from './builder.ts'
import type { Live } from './live.ts'
import { ASK_USER_TOOL, questionsOf, SUBMIT_PLAN_TOOL } from './plan-tools.ts'

type Suspended = Extract<AgentControllerEvent, { type: 'tool_suspended' }>
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

/**
 * The cards waiting in Mastra's database for a session that never saw them asked (a new process):
 * made this session's, as Mastra's own resume registers a cold suspension
 * (`resolveSuspensionAgent`), so an answer resumes them by their address and Parar or a message
 * closes them. Our own (code C75): Mastra 1.79 rebuilds no parked suspension when a session binds a
 * thread, and its claim (`claimToolSuspension`) and abort deny only registered ones.
 */
export async function restoreCards(
  live: Live,
  agent: Pick<Agent, 'listSuspendedRuns'>,
): Promise<void> {
  const threadId = live.conversationId
  const resourceId = memoryOwner(live.owner)
  const { runs } = await agent.listSuspendedRuns({ threadId, resourceId })
  for (const { runId, toolCalls } of runs) {
    for (const { toolCallId, toolName, args, suspendPayload } of toolCalls) {
      if (toolName === undefined || toolCallId === undefined) continue
      const address = { toolCallId, toolName, runId, threadId, resourceId }
      live.session.suspensions.register(address)
      // Mastra's database keeps a tool's own suspension without its arguments: the card reads its payload.
      const suspended = { ...address, args: args ?? null, suspendPayload }
      live.session.displayState.apply({ type: 'tool_suspended', ...suspended })
    }
  }
}
