import { Answer, QUESTION_LIMITS } from '@conexus/hub-api'
import { askUserTool } from '@mastra/core/agent-controller'
import { createTool, formatQuestionAnswer } from '@mastra/core/tools'
import { z } from 'zod'

export const ASK_USER_TOOL = askUserTool.id

const Option = z.object({ label: z.string().min(1), description: z.string().optional() })
const Choice = z
  .strictObject({
    question: z.string().min(1),
    header: z.string().min(1).max(12).optional(),
    options: z.array(Option).optional(),
    multiSelect: z.boolean().optional(),
  })
  .refine((each) => each.multiSelect !== true || (each.options?.length ?? 0) > 0, {
    message: 'multiSelect requires options',
  })
/** What `ask_user` is called with and suspends with: 1 to 4 questions. */
const Questions = z.object({ questions: z.array(Choice).min(1).max(QUESTION_LIMITS.questions) })

const ASK_USER_DESCRIPTION = [
  'Ask the person 1 to 4 questions in one card and wait for their answers. Use it only for what the person alone can decide:',
  'a business rule, a company fact or a preference you cannot find in the Project, the web or a sensible default. Never ask what you can look up or choose yourself.',
  'Batch every related question into one call.',
  'Give a question 2 to 4 `options` when it has likely answers, each a short `label` and an optional `description`.',
  'If you recommend one, make it the first option and end its label with "(recomendado)".',
  'Set `multiSelect: true` when more than one option can be picked. Omit `options` for an open question.',
  "Write each question in the person's language. Returns one line per question with the answer.",
].join(' ')

/** What `ask_user` returns once answered: the model's line per question, and the answers themselves. */
const AskedResult = z.object({ content: z.string(), answers: z.array(Answer) })

/**
 * `ask_user` for 1 to 4 questions, on Mastra's own suspend and resume (`askUserTool`): it suspends
 * with the questions and resumes with one answer per question, in order. It is registered under the
 * native id, and the native tool is disabled (decision 0053). Its result keeps the answers, which
 * Mastra stores as the call's result, while `toModelOutput` gives the model only its lines, stored
 * apart in `providerMetadata.mastra.modelOutput` (`agent-*.js`, `computeModelOutputProviderMetadata`).
 */
export function createAskUserTool() {
  return createTool({
    id: ASK_USER_TOOL,
    description: ASK_USER_DESCRIPTION,
    inputSchema: Questions,
    suspendSchema: Questions,
    resumeSchema: z.array(Answer),
    execute: async ({ questions }, context) => {
      const answers = context?.agent?.resumeData
      if (answers !== undefined) {
        const lines = questions.map(
          (each, index) => `${each.question}: ${formatQuestionAnswer(answers[index] ?? '')}`,
        )
        return { content: `User answered:\n${lines.join('\n')}`, answers }
      }
      await context?.agent?.suspend?.({ questions })
      return undefined
    },
    toModelOutput: (output) => {
      const asked = AskedResult.safeParse(output)
      return asked.success ? { type: 'text', value: asked.data.content } : undefined
    },
  })
}
