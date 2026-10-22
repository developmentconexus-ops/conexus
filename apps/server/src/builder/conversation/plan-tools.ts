import { posix } from 'node:path'
import type { Question as HubQuestion } from '@conexus/hub-api'
import { Answer, PackageName, QUESTION_LIMITS } from '@conexus/hub-api'
import { askUserTool, submitPlanTool } from '@mastra/core/agent-controller'
import { createTool, formatQuestionAnswer } from '@mastra/core/tools'
import { z } from 'zod'
import { APP_FOLDER } from '../machine/public.ts'
import { PREAPPROVED_PACKAGES } from '../packages/public.ts'

export const ASK_USER_TOOL = askUserTool.id
export const SUBMIT_PLAN_TOOL = submitPlanTool.id
/** The one file a plan lives in, in the app folder. */
export const PLAN_PATH = '.conexus/plan.md'

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
const Library = z
  .strictObject({
    question: z.string().min(1),
    library: z.object({ name: PackageName, version: z.string().regex(/^\d+\.\d+\.\d+$/) }),
  })
  .refine((each) => !PREAPPROVED_PACKAGES.has(each.library.name), {
    message: 'the library is already approved: use it without asking',
  })
const Question = z.union([Library, Choice])
/** What `ask_user` is called with and suspends with: 1 to 4 questions. */
const Questions = z.object({ questions: z.array(Question).min(1).max(QUESTION_LIMITS.questions) })

const ASK_USER_DESCRIPTION = [
  'Ask the person 1 to 4 questions in one card and wait for their answers. Use it only for what the person alone can decide:',
  'a business rule, a company fact or a preference you cannot find in the Project, the web or a sensible default. Never ask what you can look up or choose yourself.',
  'Batch every related question into one call.',
  'Give a question 2 to 4 `options` when it has likely answers, each a short `label` and an optional `description`.',
  'If you recommend one, make it the first option and end its label with "(recomendado)".',
  'Set `multiSelect: true` when more than one option can be picked. Omit `options` for an open question.',
  'To ask for a library the starter does not have, send `library: {name, version}` (an exact version) with the reason as the `question`;',
  'the person allows it or not. Never ask for one already approved.',
  "Write each question in the person's language. Returns one line per question with the answer.",
].join(' ')

/**
 * The questions of an `ask_user` call as the card shows them, or none when its input is not a
 * card: a library's has the two answers for its options, a choice its own.
 */
export function questionsOf(input: unknown): HubQuestion[] | undefined {
  const asked = Questions.safeParse(input)
  if (!asked.success) return undefined
  return asked.data.questions.map((each): HubQuestion => {
    if ('library' in each) {
      const { name, version } = each.library
      return { kind: 'library', question: each.question, name, version }
    }
    const { options = [], multiSelect = false } = each
    return { kind: 'choice', question: each.question, header: each.header, options, multiSelect }
  })
}

/** What `ask_user` returns once answered: the model's line per question, and the answers themselves. */
export const AskedResult = z.object({ content: z.string(), answers: z.array(Answer) })

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

/** Whether `path` is the plan file, read as the machine's filesystem reads it. */
function isPlanPath(path: string): boolean {
  const inside = path.startsWith(`${APP_FOLDER}/`) ? posix.relative(APP_FOLDER, path) : path
  return posix.normalize(inside.replace(/^\/+/, '')) === PLAN_PATH
}

/** A plan file's text as the card shows it: a leading `# title` is the title, the rest the plan. */
function splitPlan(raw: string): { title: string; plan: string } {
  const lines = raw.split(/\r?\n/)
  const first = lines.findIndex((line) => line.trim().length > 0)
  if (lines[first]?.startsWith('# ')) {
    const plan = lines
      .slice(first + 1)
      .join('\n')
      .replace(/^\n+/, '')
    return { title: (lines[first] ?? '').slice(2).trim(), plan: plan.trimEnd() }
  }
  return { title: '', plan: raw.trimEnd() }
}

const SUBMIT_PLAN_DESCRIPTION = [
  `Submit the plan you wrote to \`${PLAN_PATH}\` for the person to review.`,
  `Pass \`path\` as \`${PLAN_PATH}\`, the only file a plan lives in; write the file first and do not paste the plan text here.`,
  'Reuse the same file across revisions. The person approves it or asks for changes with a reason;',
  'after a refusal, edit the file and call this tool again.',
].join(' ')

type SubmitPlanExecute = NonNullable<typeof submitPlanTool.execute>

/**
 * Mastra's `submit_plan`, with the plan's home checked at the boundary: only `.conexus/plan.md`. The
 * server reads the plan from the machine and suspends with its title and text beside the path, so the
 * browser, which has no filesystem, shows it. A resumed call is the person's decision and goes
 * straight to the native tool, which gives the model "User feedback: …" on a rejection.
 */
export function createSubmitPlanTool(): typeof submitPlanTool {
  return {
    ...submitPlanTool,
    description: SUBMIT_PLAN_DESCRIPTION,
    execute: async (...[input, context]: Parameters<SubmitPlanExecute>) => {
      const agent = context?.agent
      if (agent?.resumeData === undefined) {
        if (!isPlanPath(input.path)) {
          return `Refused: the plan lives in ${PLAN_PATH}. Write it there and submit that path.`
        }
        const filesystem = context?.workspace?.filesystem
        const raw = await filesystem?.readFile(PLAN_PATH, { encoding: 'utf-8' })
        if (typeof raw === 'string' && agent?.suspend) {
          await agent.suspend({ toolId: SUBMIT_PLAN_TOOL, path: PLAN_PATH, ...splitPlan(raw) })
          return undefined
        }
      }
      return submitPlanTool.execute?.(input, context)
    },
  }
}
