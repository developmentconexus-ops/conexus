import { posix } from 'node:path'
import type { Question as HubQuestion } from '@conexus/hub-api'
import { Answer, QUESTION_LIMITS } from '@conexus/hub-api'
import { askUserTool, submitPlanTool } from '@mastra/core/agent-controller'
import type { MastraDBMessage } from '@mastra/core/memory'
import { createTool, formatQuestionAnswer } from '@mastra/core/tools'
import { WORKSPACE_TOOLS } from '@mastra/core/workspace'
import { z } from 'zod'
import { APP_FOLDER, PLAN_DIR } from '../machine/public.ts'

export const ASK_USER_TOOL = askUserTool.id
export const SUBMIT_PLAN_TOOL = submitPlanTool.id

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

/**
 * The questions of an `ask_user` call as the card shows them, or none when its input is not a
 * card.
 */
export function questionsOf(input: unknown): HubQuestion[] | undefined {
  const asked = Questions.safeParse(input)
  if (!asked.success) return undefined
  return asked.data.questions.map(
    ({ question, header, options = [], multiSelect = false }): HubQuestion => ({
      question,
      header,
      options,
      multiSelect,
    }),
  )
}

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

/** The plan file `path` names, as the machine's filesystem reads it: a `.md` directly in `PLAN_DIR`. */
function planFileOf(path: string): string | undefined {
  const inside = path.startsWith(`${APP_FOLDER}/`) ? posix.relative(APP_FOLDER, path) : path
  const file = posix.normalize(inside.replace(/^\/+/, ''))
  return posix.dirname(file) === PLAN_DIR && posix.extname(file) === '.md' ? file : undefined
}

const PlanCall = z.object({
  type: z.literal('tool-invocation'),
  toolInvocation: z.object({
    toolName: z.string(),
    state: z.string(),
    args: z.object({ path: z.string() }),
    isError: z.boolean().optional(),
    result: z.unknown().optional(),
  }),
})
const Submitted = z.looseObject({ submittedPlan: z.object({ action: z.string() }) })
const PLAN_WRITES = new Set<string>([
  WORKSPACE_TOOLS.FILESYSTEM.WRITE_FILE,
  WORKSPACE_TOOLS.FILESYSTEM.EDIT_FILE,
])

/**
 * What the thread says of the plan files, from Mastra's committed calls (`getMessages`): the ones
 * the person approved, and the ones whose last write or edit failed.
 */
function planHistory(messages: readonly MastraDBMessage[]) {
  const approved = new Set<string>()
  const unwritten = new Set<string>()
  for (const { content } of messages) {
    for (const part of content.parts) {
      const call = PlanCall.safeParse(part)
      const file = call.success ? planFileOf(call.data.toolInvocation.args.path) : undefined
      if (!call.success || file === undefined) continue
      const { toolName, state, isError, result } = call.data.toolInvocation
      if (
        toolName === SUBMIT_PLAN_TOOL &&
        Submitted.safeParse(result).data?.submittedPlan.action === 'approved'
      ) {
        approved.add(file)
      } else if (PLAN_WRITES.has(toolName)) {
        const failed = state === 'output-error' || isError === true
        if (failed) unwritten.add(file)
        else unwritten.delete(file)
      }
    }
  }
  return { approved, unwritten }
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
  `Submit the plan you wrote to a \`.md\` file directly in \`${PLAN_DIR}\` for the person to review.`,
  'Pass its `path`; write the file first and do not paste the plan text here.',
  'Reuse the same file across revisions of one plan and give each new change its own file; an approved plan is never rewritten. The person approves it or asks for changes with a reason;',
  'after a refusal, read the file, edit it, read it again to be sure the change is there, and call this tool again.',
].join(' ')

type SubmitPlanExecute = NonNullable<typeof submitPlanTool.execute>

/**
 * Mastra's `submit_plan`, with the plan's home checked at the boundary: a `.md` directly in
 * `.conexus/plans`, not one the person approved, not one whose last write failed. The server reads
 * the plan from the machine and suspends with its title and text beside the path, so the browser,
 * which has no filesystem, shows it. A resumed call is the person's decision and goes straight to
 * the native tool, which gives the model "User feedback: …" on a rejection.
 */
export function createSubmitPlanTool(): typeof submitPlanTool {
  return {
    ...submitPlanTool,
    description: SUBMIT_PLAN_DESCRIPTION,
    execute: async (...[input, context]: Parameters<SubmitPlanExecute>) => {
      const agent = context?.agent
      if (agent?.resumeData === undefined) {
        const file = planFileOf(input.path)
        if (file === undefined) {
          return `Refused: a plan is a .md file directly in ${PLAN_DIR}. Write it there and submit that path.`
        }
        const { approved, unwritten } = planHistory(agent?.getMessages?.() ?? [])
        if (approved.has(file)) {
          return `Refused: ${file} is an approved plan and stays as it was. Write the new plan in a file of its own in ${PLAN_DIR} and submit that path.`
        }
        if (unwritten.has(file)) {
          return `Refused: the last write to ${file} failed, so it still holds the earlier plan. Write it again and submit it.`
        }
        const raw = await context?.workspace?.filesystem?.readFile(file, { encoding: 'utf-8' })
        if (typeof raw === 'string' && agent?.suspend) {
          await agent.suspend({ toolId: SUBMIT_PLAN_TOOL, path: file, ...splitPlan(raw) })
          return undefined
        }
      }
      return submitPlanTool.execute?.(input, context)
    },
  }
}
