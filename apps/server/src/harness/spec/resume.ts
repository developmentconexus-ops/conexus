import type { ToolHookContext } from '@mastra/core/tools'
import { z } from 'zod'

const Resume = z.object({
  resumeData: z.unknown().optional(),
  suspendPayload: z.unknown().optional(),
})
const Approval = z.object({ approved: z.boolean() })

/**
 * A tool resumes only with what its call's own suspension was answered, which comes beside the
 * `suspendPayload` (`@mastra/core@1.83.0` `evented-execution-4C5qBV8d.js:84497`). Mastra also hands
 * over a `resumeData` that no suspension asked for (`:84215-84222`), and a resume skips the tool's
 * input schema (`tool-3X7mHzgh.js:880`). An approval's answer reaches an `agent-*` tool without a
 * `suspendPayload` (`evented-execution-4C5qBV8d.js:84453`): there only the shape is checked.
 * Throwing makes the refusal the tool's error, where `{ proceed: false }` would make it a result.
 */
export function refuseUnaskedResume({ toolName, context }: ToolHookContext): void {
  const { resumeData, suspendPayload } = Resume.parse(context)
  if (resumeData == null || suspendPayload !== undefined) return
  if (toolName.startsWith('agent-') && Approval.safeParse(resumeData).success) return
  throw new Error('`resumeData` is not an argument of this tool: call it again without it.')
}
