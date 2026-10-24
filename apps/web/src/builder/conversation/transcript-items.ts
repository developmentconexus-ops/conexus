import type { Answer, MastraPart } from '@conexus/hub-api'
import { CARD_TOOLS, Question, SKILL_TOOLS, ToolCallId } from '@conexus/hub-api'
import { z } from 'zod'

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
  toolName: typeof CARD_TOOLS.question
  state: 'open' | 'answered' | 'closed' | 'expired'
  questions: readonly Question[]
  answers?: readonly Answer[]
}
export type PlanCardItem = {
  kind: 'card'
  cardKind: 'plan'
  id: string
  toolCallId: string
  toolName: typeof CARD_TOOLS.plan
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

export function isTaskTool(toolName: string): boolean {
  const bare = toolName.replace(/^mastra_workspace_/, '')
  return bare.startsWith('task_')
}

export const UNGROUPABLE_TOOLS = new Set<string>([...Object.values(CARD_TOOLS), ...SKILL_TOOLS])

export function extractThoughtSeconds(parts: readonly MastraPart[]): number | null {
  for (const part of parts) {
    if (
      part.type === 'data-conexus-thought' &&
      part.data &&
      typeof part.data === 'object' &&
      'seconds' in part.data
    ) {
      const val = Reflect.get(part.data, 'seconds')
      if (typeof val === 'number') return val
    }
  }
  return null
}

const QuestionItemSchema = Question.partial({ options: true, multiSelect: true })

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
  suspendedPayload: unknown,
  cuts?: string[],
): TranscriptItem | null {
  if (!ToolCallId.safeParse(inv.toolCallId).success || isTaskTool(inv.toolName)) return null

  if (inv.toolName === CARD_TOOLS.question) {
    const questions = parseQuestions(suspendedPayload ?? inv.args)
    const answers = parseAnswers(inv.result)
    const isAnswered = inv.state === 'result' && answers !== undefined
    const state = isAnswered ? 'answered' : inv.state === 'output-error' ? 'closed' : 'open'
    return {
      kind: 'card',
      cardKind: 'question',
      id: inv.toolCallId,
      toolCallId: inv.toolCallId,
      toolName: CARD_TOOLS.question,
      state,
      questions,
      answers,
    }
  }

  if (inv.toolName === CARD_TOOLS.plan) {
    const planInfo = parsePlan(suspendedPayload ?? inv.args)
    const action =
      inv.result && typeof inv.result === 'object' ? Reflect.get(inv.result, 'action') : undefined
    const state =
      inv.state === 'result' && action === 'rejected'
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
      toolName: CARD_TOOLS.plan,
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
