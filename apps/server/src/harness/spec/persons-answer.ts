import type { AgentToolExecutionContext } from '@mastra/core/tools'

/**
 * The person's answer to this call's card, or undefined while the tool still has to ask. A
 * `resumeData` is the person's only beside the `suspendPayload` of this call's own suspension
 * (`@mastra/core@1.83.0` hands one over without it too). Any other throws instead of asking: a
 * call that suspended with it would resume with it, not with the person's answer.
 */
export function personsAnswer<Answer>(
  agent:
    | Pick<AgentToolExecutionContext<unknown, Answer>, 'resumeData' | 'suspendPayload'>
    | undefined,
): Answer | undefined {
  if (agent?.resumeData === undefined) return undefined
  if (agent.suspendPayload === undefined) {
    throw new Error('`resumeData` is not an argument of this tool: call it again without it.')
  }
  return agent.resumeData
}
