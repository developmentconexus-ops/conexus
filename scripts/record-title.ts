import type { Block } from '../apps/server/src/platform/test-anthropic-stream.ts'

// The `title` and `title-observer` scenarios of `scripts/record.ts` (step 24, T26): Mastra names a
// conversation after the run ended, in the background, and says so with `thread_title_updated`
// (`generateTitle`) or `om_thread_title_updated` (the observer's `threadTitle`). Invented prompts
// and answers (security S40).

export const TITLES = ['title', 'title-observer'] as const
type Title = (typeof TITLES)[number]

const PROMPT = 'Quero automatizar o pagamento das contas de uma padaria inventada.'
const TURN: Block[] = [
  { type: 'text', text: 'Posso automatizar o pagamento das contas. Confirme no botão.' },
]
const TITLE = 'Automatizar pagamento de contas'
const OBSERVATION = `<observations>
Date: Nov 13, 2026
* 🔴 (14:30) A pessoa quer automatizar o pagamento das contas de uma padaria inventada.
<current-task>Automatizar o pagamento das contas.</current-task>
<suggested-response>Confirme no botão.</suggested-response>
<thread-title>Pagamento de contas automático</thread-title>
</observations>`

export const PROMPTS: [string, string][] = TITLES.map((each) => [each, PROMPT])

/**
 * The model calls streamed, in order. `title`: the turn; Mastra's own call that names the
 * conversation follows and is answered by `answer`. `title-observer`: the observer's call comes
 * first, since it watches the message threshold before the turn's own.
 */
export const CALLS: Record<Title, Block[][]> = {
  title: [TURN],
  'title-observer': [[{ type: 'text', text: OBSERVATION }], TURN],
}

/**
 * Mastra's call that names the conversation is not streamed: the Messages API answers it as one
 * body, written here (as `REFUSED` in `record.ts` is), not by `test-anthropic-stream.ts`, which the
 * header of the recording names as its source for the turn.
 */
export function answer(
  scenario: string,
  answers: Array<(signal: AbortSignal | null | undefined) => Response>,
) {
  if (scenario !== 'title') return
  answers[1] = () =>
    Response.json({
      id: 'msg_title',
      type: 'message',
      role: 'assistant',
      model: 'claude-sonnet-4-6',
      content: [{ type: 'text', text: TITLE }],
      stop_reason: 'end_turn',
      stop_sequence: null,
      usage: { input_tokens: 10, output_tokens: 5 },
    })
}

/** The event the scenario waits for: the title comes after `agent_end`. */
export function endOf(scenario: string): string {
  if (scenario === 'title') return 'thread_title_updated'
  if (scenario === 'title-observer') return 'om_thread_title_updated'
  return 'agent_end'
}

/** What Memory is given to name the conversation: its own `generateTitle`, or the observer's `threadTitle`. */
export function memoryOptions(scenario: string, model: string) {
  if (scenario === 'title') return { options: { generateTitle: true } }
  if (scenario !== 'title-observer') return {}
  return {
    options: {
      observationalMemory: {
        enabled: true,
        scope: 'thread' as const,
        observation: {
          model: `anthropic/${model}`,
          messageTokens: 20,
          bufferTokens: false as const,
          threadTitle: true,
        },
      },
    },
  }
}
