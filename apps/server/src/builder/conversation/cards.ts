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
