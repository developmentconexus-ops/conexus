import type { AgentId, FailureCode } from '@conexus/hub-api'
import type { Agent } from '@mastra/core/agent'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure, logFailure } from '../../platform/failure.ts'
import type { AgentRun, AgentService } from '../agents/public.ts'
import { agentRunContext } from '../agents/public.ts'
import type { InProject } from '../tools/public.ts'

/** What a test of the draft answers the Construtor: the draft's answer and its tools, or the refusal. */
export type Tested =
  | { kind: 'ANSWERED'; text: string; tools: string[] }
  | { kind: 'REFUSED'; code: FailureCode; field?: string }

/**
 * One question to the draft's `Agent` (step 24.3, U4): the same `agentOf` a published agent runs
 * by, alone, with no controller, thread or stored conversation, on the person's model account
 * and counted in their queue. A refusal, or the model failing, is the result the Construtor
 * reads, never an exception; the model's own text is never logged (security S41).
 */
export function testDraft(deps: {
  agents: Pick<AgentService, 'testable'>
  draftAgent: (run: AgentRun) => Promise<Agent>
  log: FailureLog
}) {
  function refusal(error: unknown, scope: InProject): Tested {
    if (error instanceof Failure && error.code === 'INTERNAL_UNEXPECTED') throw error
    const failure =
      error instanceof Failure ? error : new Failure('MODEL_CALL_FAILED', { cause: error })
    logFailure(deps.log, failure, { companyId: scope.companyId })
    const { field } = failure.named
    return { kind: 'REFUSED', code: failure.code, ...(field === undefined ? {} : { field }) }
  }
  return async (scope: InProject, agentId: AgentId, question: string): Promise<Tested> => {
    const started = Date.now()
    try {
      await deps.agents.testable(scope, agentId)
    } catch (error) {
      if (!(error instanceof Failure)) throw error
      return refusal(error, scope)
    }
    const run = { kind: 'DRAFT', scope, agentId } satisfies AgentRun
    try {
      const agent = await deps.draftAgent(run)
      const answered = await agent.generate(question, { requestContext: agentRunContext(run) })
      const tools = answered.steps.flatMap((step) =>
        step.toolCalls.map((call) => call.payload.toolName),
      )
      const ms = Date.now() - started
      deps.log.info(
        { companyId: scope.companyId, agentId, ms, tools: tools.length },
        'AGENT_TESTED',
      )
      return { kind: 'ANSWERED', text: answered.text, tools }
    } catch (error) {
      return refusal(error, scope)
    }
  }
}
