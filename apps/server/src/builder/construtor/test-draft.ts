import type { AgentId, TestedResult } from '@conexus/hub-api'
import type { Agent } from '@mastra/core/agent'
import { APICallError } from 'ai'
import type { FailureLog } from '../../platform/failure.ts'
import { causeChain, Failure, logFailure } from '../../platform/failure.ts'
import type { AgentRun, AgentService } from '../agents/public.ts'
import { agentRunContext } from '../agents/public.ts'
import type { InProject } from '../tools/public.ts'

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
  function refusal(error: unknown, scope: InProject): TestedResult {
    if (error instanceof Failure && error.code === 'INTERNAL_UNEXPECTED') throw error
    if (!(error instanceof Failure) && causeChain(error).some((c) => APICallError.isInstance(c))) {
      return refusal(new Failure('MODEL_CALL_FAILED', { cause: error }), scope)
    }
    if (!(error instanceof Failure)) {
      const failure = new Failure('INTERNAL_UNEXPECTED', { cause: error })
      logFailure(deps.log, failure, { companyId: scope.companyId })
      throw failure
    }
    const failure = error
    logFailure(deps.log, failure, { companyId: scope.companyId })
    const { field } = failure.named
    return { kind: 'REFUSED', code: failure.code, ...(field === undefined ? {} : { field }) }
  }
  return async (scope: InProject, agentId: AgentId, question: string): Promise<TestedResult> => {
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
      if (answered.tripwire !== undefined) throw new Failure('MODEL_REFUSED')
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
