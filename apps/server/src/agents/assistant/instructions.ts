import { readFileSync } from 'node:fs'
import { CONEXUS_PROMPT, TITLE } from '../../harness/prompt/public.ts'

/**
 * The Assistant's observer: the conversation's title and what a business conversation keeps, never
 * the task list, which the signals rebuild at each step (card of the alignment, U4).
 */
export const ASSISTANT_OBSERVER = `${TITLE.ask.observer} Observe as a business analyst: keep numbers with where they came from (which connection, which read, which file), the codes and meanings the person taught, the filters and periods asked, the files made or received and what they hold, and what was handed to the Builder. Do not observe \`<current-task-list>\` or \`<task-list-update>\`; they are rebuilt.`

/**
 * The fixed message, the same bytes in every conversation of every company (criterion 13a): what
 * Conexus is, shared with the units after this one (`conexus.md`), then the Assistant (`assistant.md`).
 */
export const FIXED = [
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
export const MODEL_BLOCKS: Readonly<Record<string, string>> = {
  'openai/gpt-6-luna': LUNA,
  'openai/gpt-5.6-luna': LUNA,
}
