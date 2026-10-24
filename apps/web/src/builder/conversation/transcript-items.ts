import type { Answer, FailureCode, MastraPart, Question, Suspension } from '@conexus/hub-api'
import { FAILURES, ToolCallId, VersionCheck } from '@conexus/hub-api'
import { z } from 'zod'

export const MachinePhase = z.enum(['starting', 'waking', 'copying', 'replaced', 'saving'])
export type MachinePhase = z.infer<typeof MachinePhase>

export const ConexusMachineData = z.object({ phase: MachinePhase })
export type ConexusMachineData = z.infer<typeof ConexusMachineData>

export const ConexusVersionData = z.object({
  number: z.number(),
  files: z.number(),
  changed: z.boolean(),
  changedFiles: z.number(),
  check: VersionCheck.optional(),
})
export type ConexusVersionData = z.infer<typeof ConexusVersionData>

export const ConexusRestartedData = z.object({
  kept: z.union([z.number(), z.literal('nothing'), z.literal('lost')]),
})
export type ConexusRestartedData = z.infer<typeof ConexusRestartedData>

export const ConexusFailureData = z.object({
  code: z.string().refine((c): c is FailureCode => Object.hasOwn(FAILURES, c)),
})
export type ConexusFailureData = z.infer<typeof ConexusFailureData>

export const ConexusNoticeData = z.object({ text: z.string() })
export type ConexusNoticeData = z.infer<typeof ConexusNoticeData>

export function isMachineLasting(phase: MachinePhase): boolean {
  return phase === 'replaced'
}

type ToolInvocationState = Extract<
  MastraPart,
  { type: 'tool-invocation' }
>['toolInvocation']['state']

type TextItem = { kind: 'text'; id: string; text: string; cuts?: string[] }
export type ReasoningItem = {
  kind: 'reasoning'
  id: string
  reasoning: string
  seconds: number | null
  streaming: boolean
  cuts?: string[]
}
export type ToolItem = {
  kind: 'tool'
  id: string
  toolCallId: string
  toolName: string
  state: ToolInvocationState
  args: unknown
  result?: unknown
  output?: string
  exitCode?: number
  isError?: boolean
  cuts?: string[]
}
export type QuestionCardItem = {
  kind: 'card'
  cardKind: 'question'
  id: string
  toolCallId: string
  toolName: 'ask_user'
  state: 'open' | 'answered' | 'closed' | 'expired'
  questions: readonly Question[]
  answers?: readonly Answer[]
}
export type PlanCardItem = {
  kind: 'card'
  cardKind: 'plan'
  id: string
  toolCallId: string
  toolName: 'submit_plan'
  state: 'open' | 'approved' | 'rejected' | 'closed' | 'expired'
  title: string
  plan: string
  path?: string
}
type CardItem = QuestionCardItem | PlanCardItem
type ConexusItem = {
  kind: 'conexus'
  id: string
  partType: string
  data: unknown
  cuts?: string[]
}
export type TranscriptItem = TextItem | ReasoningItem | ToolItem | CardItem | ConexusItem

const TASK_TOOLS = new Set(['task_write', 'task_update', 'task_complete', 'task_check'])

export function isTaskTool(toolName: string): boolean {
  const bare = toolName.replace(/^mastra_workspace_/, '')
  return TASK_TOOLS.has(bare) || bare.startsWith('task_')
}

export const UNGROUPABLE_TOOLS = new Set([
  'ask_user',
  'submit_plan',
  'skill',
  'skill_read',
  'skill_search',
])

const ThoughtData = z.object({ id: z.string(), seconds: z.number() })

/** How long each thinking took, by the key the server gives it: its message and its place in it. */
export function thoughtSeconds(parts: readonly MastraPart[]): Map<string, number> {
  const seconds = new Map<string, number>()
  for (const part of parts) {
    if (part.type !== 'data-conexus-thought') continue
    const data = ThoughtData.safeParse(part.data)
    if (data.success) seconds.set(data.data.id, data.data.seconds)
  }
  return seconds
}

const QuestionItemSchema = z.object({
  question: z.string(),
  header: z.string().optional(),
  options: z.array(z.object({ label: z.string(), description: z.string().optional() })).optional(),
  multiSelect: z.boolean().optional(),
})

export function parseQuestions(input: unknown): Question[] {
  const parsed = z.object({ questions: z.array(QuestionItemSchema) }).safeParse(input)
  if (!parsed.success) return []
  return parsed.data.questions.map((q) => ({
    question: q.question,
    header: q.header,
    options: q.options ?? [],
    multiSelect: q.multiSelect ?? false,
  }))
}

function parseAnswers(input: unknown): Answer[] | undefined {
  const parsed = z
    .object({ answers: z.array(z.union([z.string(), z.array(z.string())])) })
    .safeParse(input)
  return parsed.success ? parsed.data.answers : undefined
}

/** What Mastra's `submit_plan` returns once answered: the plan as submitted and the decision on it. */
const SubmittedPlan = z.object({
  submittedPlan: z.object({
    action: z.string(),
    title: z.string().optional(),
    plan: z.string().optional(),
  }),
})

export function parsePlan(input: unknown): { title: string; plan: string; path?: string } {
  const parsed = z
    .object({
      title: z.string().optional(),
      plan: z.string().optional(),
      path: z.string().optional(),
    })
    .safeParse(input)
  return { title: parsed.data?.title ?? '', plan: parsed.data?.plan ?? '', path: parsed.data?.path }
}

export function invocationToItem(
  inv: Extract<MastraPart, { type: 'tool-invocation' }>['toolInvocation'],
  suspension: Suspension | undefined,
  cuts?: string[],
): TranscriptItem | null {
  if (!ToolCallId.safeParse(inv.toolCallId).success || isTaskTool(inv.toolName)) return null

  if (inv.toolName === 'ask_user') {
    const questions = parseQuestions(
      suspension === undefined ? inv.args : suspension.suspendPayload,
    )
    const answers = parseAnswers(inv.result)
    const isAnswered = inv.state === 'result' && answers !== undefined
    const state = isAnswered ? 'answered' : inv.state === 'output-error' ? 'closed' : 'open'
    return {
      kind: 'card',
      cardKind: 'question',
      id: inv.toolCallId,
      toolCallId: inv.toolCallId,
      toolName: 'ask_user',
      state,
      questions,
      answers,
    }
  }

  if (inv.toolName === 'submit_plan') {
    const submitted = SubmittedPlan.safeParse(inv.result)
    const planInfo = parsePlan(
      suspension === undefined
        ? (submitted.data?.submittedPlan ?? inv.args)
        : suspension.suspendPayload,
    )
    const state =
      inv.state === 'result' && submitted.data?.submittedPlan.action === 'rejected'
        ? 'rejected'
        : inv.state === 'result'
          ? 'approved'
          : inv.state === 'output-error'
            ? 'closed'
            : 'open'
    return {
      kind: 'card',
      cardKind: 'plan',
      id: inv.toolCallId,
      toolCallId: inv.toolCallId,
      toolName: 'submit_plan',
      state,
      title: planInfo.title,
      plan: planInfo.plan,
      path: planInfo.path,
    }
  }

  return {
    kind: 'tool',
    id: inv.toolCallId,
    toolCallId: inv.toolCallId,
    toolName: inv.toolName,
    state: inv.state,
    args: inv.args,
    result: inv.result,
    isError: inv.isError ?? (inv.state === 'output-error' || inv.state === 'output-denied'),
    cuts,
  }
}
