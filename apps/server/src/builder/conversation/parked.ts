import { setTimeout as sleep } from 'node:timers/promises'
import type { Session } from '@mastra/core/agent-controller'
import type { Builder } from './builder.ts'

/**
 * How long Parar waits for Mastra to keep an open card's run. Measured from the card on the stream
 * to its run listed: 14 to 30 ms on an idle machine, 59 ms at most with three CPU hogs (10 runs
 * each). The bound is about 30 times that, for Mastra's writes on a remote database; past it, Parar
 * goes to Mastra as before.
 */
const KEPT_WITHIN_MS = 2_000
/** About the median of those measurements. */
const KEPT_READ_EVERY_MS = 20

/**
 * Waits until Mastra lists each card the session has open among its suspended runs. Mastra 1.79.0
 * ends a run at the card before its output processors save the call and its snapshot, and its Parar
 * denies only a call already saved (`settleSuspendedToolCallsAsDenied`); a Parar in between leaves
 * the card open and its run parked (docs/reference/boundaries.md).
 */
export async function untilCardsKept(
  agent: Builder['agent'],
  session: Session | undefined,
): Promise<void> {
  const threadId = session?.thread.getId()
  const open = [...(session?.displayState.get().pendingSuspensions.values() ?? [])]
  if (session === undefined || threadId == null || open.length === 0) return
  const scope = { threadId, resourceId: session.identity.getResourceId() }
  for (const deadline = Date.now() + KEPT_WITHIN_MS; Date.now() < deadline; ) {
    const { runs } = await agent.listSuspendedRuns(scope)
    const kept = new Set(runs.flatMap((run) => run.toolCalls.map((call) => call.toolCallId)))
    if (open.every((card) => kept.has(card.toolCallId))) return
    await sleep(KEPT_READ_EVERY_MS)
  }
}
