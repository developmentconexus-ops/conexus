import { posix } from 'node:path'
import { submitPlanTool } from '@mastra/core/agent-controller'
import type { MastraDBMessage } from '@mastra/core/memory'
import { z } from 'zod'
import { APP_FOLDER, PLAN_DIR } from '../../harness/machine/public.ts'
import { personsAnswer } from '../../harness/spec/public.ts'

export const SUBMIT_PLAN_TOOL = submitPlanTool.id

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
    args: z.object({ path: z.string() }),
    result: z.unknown().optional(),
  }),
})
const Submitted = z.looseObject({ submittedPlan: z.object({ action: z.string() }) })

/** The plan files the person approved, from Mastra's committed calls (`getMessages`). */
function approvedPlans(messages: readonly MastraDBMessage[]) {
  const approved = new Set<string>()
  for (const { content } of messages) {
    for (const part of content.parts) {
      const call = PlanCall.safeParse(part)
      const file = call.success ? planFileOf(call.data.toolInvocation.args.path) : undefined
      if (!call.success || file === undefined) continue
      const { toolName, result } = call.data.toolInvocation
      if (
        toolName === SUBMIT_PLAN_TOOL &&
        Submitted.safeParse(result).data?.submittedPlan.action === 'approved'
      ) {
        approved.add(file)
      }
    }
  }
  return approved
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
 * `.conexus/plans`, not one the person approved. The server reads
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
      if (personsAnswer(agent) === undefined) {
        const file = planFileOf(input.path)
        if (file === undefined) {
          return `Refused: a plan is a .md file directly in ${PLAN_DIR}. Write it there and submit that path.`
        }
        if (approvedPlans(agent?.getMessages?.() ?? []).has(file)) {
          return `Refused: ${file} is an approved plan and stays as it was. Write the new plan in a file of its own in ${PLAN_DIR} and submit that path.`
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
