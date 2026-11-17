import { readFileSync } from 'node:fs'
import type { AgentInstructions } from '@mastra/core/agent'
import type { RequestContext } from '@mastra/core/request-context'
import { Failure } from '../../platform/failure.ts'
import type { Mays, Speakers } from '../controller-kit/public.ts'
import {
  blockOf,
  CONEXUS_PROMPT,
  fixedSystem,
  sessionModel,
  TITLE,
} from '../controller-kit/public.ts'
import { dataOrder } from '../data-tools/public.ts'

/**
 * The Assistant's observer: the conversation's title and what a business conversation keeps, never
 * the task list, which the signals rebuild at each step (card of the alignment, U4).
 */
export const ASSISTANT_OBSERVER = `${TITLE.ask.observer} Observe as a business analyst: keep numbers with where they came from (which connection, which read, which file), the codes and meanings the person taught, the filters and periods asked, the files made or received and what they hold, and what was handed to the Builder. Do not observe \`<current-task-list>\` or \`<task-list-update>\`; they are rebuilt.`

/**
 * The fixed message, the same bytes in every conversation of every company (criterion 13a): what
 * Conexus is, shared with the units after this one (`conexus.md`), then the Assistant (`assistant.md`).
 */
const FIXED = [
  CONEXUS_PROMPT,
  readFileSync(new URL('./prompt/assistant.md', import.meta.url), 'utf8').trim(),
].join('\n\n')

/**
 * The block of one model, by the turn's model id with its provider, after the fixed message: Mastra
 * Code's `modelSpecificPrompts` (`mastracode/sdk/src/agents/prompts/model.ts`, chosen by exact id in
 * `prompts/index.ts:146-148`, a section of the agent's prompt at `:211`). It reaches the model by any
 * account, the ChatGPT subscription or an OpenAI key. `gpt-6-luna` was measured giving up on a
 * partial answer after a read that fell short, in the Assistant's scorecard; `gpt-5.6-luna` gets the
 * same block unmeasured. A model without a block gets the fixed message alone.
 */
const LUNA = readFileSync(new URL('./prompt/openai-luna.md', import.meta.url), 'utf8').trim()
const MODEL_BLOCKS: Readonly<Record<string, string>> = {
  'openai/gpt-6-luna': LUNA,
  'openai/gpt-5.6-luna': LUNA,
}

/**
 * The system messages (`P1`, `L1`): the fixed one with its own cache mark, the turn's model's block
 * when it has one, then the conversation's block, which the Hub marks as the last one; resolved again
 * on each call of the agent.
 */
export function assistantInstructions(deps: {
  offeredOf: (
    requestContext: RequestContext,
  ) => Promise<readonly { name: string; connector: string; chosen: boolean }[]>
  speakersOf: (requestContext: RequestContext) => Promise<Speakers | undefined>
  maysOf: (requestContext: RequestContext) => Promise<Mays>
}) {
  return async ({ requestContext }: { requestContext: RequestContext }) => {
    const [speakers, offered, may] = await Promise.all([
      deps.speakersOf(requestContext),
      deps.offeredOf(requestContext),
      deps.maysOf(requestContext),
    ])
    if (speakers === undefined) {
      throw new Failure('INTERNAL_UNEXPECTED', {
        details: { reason: 'PROMPT_WITHOUT_CONVERSATION' },
      })
    }
    const chosen = offered.filter((each) => each.chosen)
    const model = MODEL_BLOCKS[sessionModel(requestContext)]
    return [
      fixedSystem(FIXED),
      { role: 'system', content: dataOrder() },
      ...(model === undefined ? [] : [{ role: 'system' as const, content: model }]),
      { role: 'system', content: blockOf(speakers, chosen, may) },
    ] satisfies AgentInstructions
  }
}
