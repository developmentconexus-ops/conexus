import type { Answer, MastraPart, Suspended } from '@conexus/hub-api'
import { CARD_TOOLS, Question, TASK_TOOLS, ThoughtData, ToolCallId } from '@conexus/hub-api'
import { z } from 'zod'

type ToolInvocationState = Extract<
  MastraPart,
  { type: 'tool-invocation' }
>['toolInvocation']['state']

/** A message the person sent into the running turn, at the place Mastra read it. */
type PersonItem = { kind: 'person'; id: string; text: string; createdAt: string }
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
  /** Why the call failed, as the store keeps it (`output-error`). */
  errorText?: string
  /** When the screen first heard of the call, epoch ms; none on a read (a read row never runs). */
  startedAt?: number
  cuts?: string[]
}
export type QuestionCardItem = {
  kind: 'card'
  cardKind: 'question'
  id: string
  toolCallId: string
  toolName: typeof CARD_TOOLS.question
  state: 'open' | 'answered' | 'closed'
  questions: readonly Question[]
  answers?: readonly Answer[]
}
export type PlanCardItem = {
  kind: 'card'
  cardKind: 'plan'
  id: string
  toolCallId: string
  toolName: typeof CARD_TOOLS.plan
  state: 'open' | 'approved' | 'rejected' | 'closed'
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
export type TranscriptItem =
  | PersonItem
  | TextItem
  | ReasoningItem
  | ToolItem
  | CardItem
  | ConexusItem

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

const QuestionItemSchema = Question.partial({ options: true, multiSelect: true })

function parseQuestions(input: unknown): Question[] {
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

function parsePlan(input: unknown): { title: string; plan: string; path?: string } {
  const parsed = z
    .object({
      title: z.string().optional(),
      plan: z.string().optional(),
      path: z.string().optional(),
    })
    .safeParse(input)
  return { title: parsed.data?.title ?? '', plan: parsed.data?.plan ?? '', path: parsed.data?.path }
}

type Invocation = Extract<MastraPart, { type: 'tool-invocation' }>['toolInvocation']

/**
 * A card from its call (Factory `awaitsPrompt`): open only while the call waits on the person, an
 * answer once Mastra has one, closed once Mastra closed it without one; nothing while the call
 * runs and has not yet said what it waits for.
 */
function cardState(inv: Invocation, waiting: boolean): 'open' | 'result' | 'closed' | 'none' {
  if (inv.state === 'result') return 'result'
  if (inv.state === 'output-error' || inv.state === 'output-denied') return 'closed'
  return waiting ? 'open' : 'none'
}

export function invocationToItem(
  inv: Invocation,
  suspension: Suspended | undefined,
  cuts?: string[],
): TranscriptItem | null {
  if (
    !ToolCallId.safeParse(inv.toolCallId).success ||
    TASK_TOOLS.some((name) => name === inv.toolName)
  )
    return null

  if (inv.toolName === CARD_TOOLS.question) {
    const at = cardState(inv, suspension !== undefined)
    if (at === 'none') return null
    const questions = parseQuestions(
      suspension === undefined ? inv.args : suspension.suspendPayload,
    )
    const answers = parseAnswers(inv.result)
    const state = at === 'result' ? (answers !== undefined ? 'answered' : 'closed') : at
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
    const at = cardState(inv, suspension !== undefined)
    if (at === 'none') return null
    const submitted = SubmittedPlan.safeParse(inv.result)
    const planInfo = parsePlan(
      submitted.data?.submittedPlan ??
        (suspension === undefined ? inv.args : suspension.suspendPayload),
    )
    const state =
      at === 'result'
        ? submitted.data?.submittedPlan.action === 'rejected'
          ? 'rejected'
          : 'approved'
        : at
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
    errorText: inv.errorText,
    cuts,
  }
}
