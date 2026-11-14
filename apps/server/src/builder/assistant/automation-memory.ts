import type { InputProcessor } from '@mastra/core/processors'
import type { RequestContext } from '@mastra/core/request-context'

/** Mastra's tool that writes the working memory, by the id its memory gives it. */
const WRITE_MEMORY_TOOL = 'updateWorkingMemory'

/**
 * An automation's run reads the person's profile and never writes it (U7, the card's stop rule): the
 * write tool leaves the step's tools, as `concept_propose` does. Mastra's `readOnly` would also
 * stop the run's own messages from being saved (`agent` `mcfg?.readOnly` before `flushMessages`), and
 * the run's conversation must keep them.
 */
export function profileReadOnlyInRuns(
  byAutomation: (requestContext: RequestContext) => Promise<boolean>,
): InputProcessor {
  return {
    id: 'conexus-profile-read-only-in-runs',
    async processInputStep({ tools, requestContext }) {
      if (tools === undefined || requestContext === undefined || !(WRITE_MEMORY_TOOL in tools))
        return {}
      if (!(await byAutomation(requestContext))) return {}
      const { [WRITE_MEMORY_TOOL]: _written, ...rest } = tools
      return { tools: rest }
    },
  }
}
