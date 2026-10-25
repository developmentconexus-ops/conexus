import type { Answer } from '@conexus/hub-api'
import { CARD_TOOLS, Question, TASK_TOOLS, ThoughtData, ToolCallId } from '@conexus/hub-api'
import type { MastraMessagePart } from '@mastra/client-js'
import { z } from 'zod'
import type { Message, Suspended } from './messages.ts'
import type { Running } from './session-state.ts'

type ToolInvocationState = Extract<
  MastraMessagePart,
  { type: 'tool-invocation' }
>['toolInvocation']['state']

type TextItem = { kind: 'text'; id: string; text: string }
export type ReasoningItem = {
  kind: 'reasoning'
  id: string
  reasoning: string
  seconds: number | null
  streaming: boolean
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
}
export type QuestionCardItem = {
  kind: 'card'
  cardKind: 'question'
  id: string
  toolCallId: string
  toolName: typeof CARD_TOOLS.question
  state: 'open' | 'answered' | 'closed' | 'stopped'
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
}
export type TranscriptItem = TextItem | ReasoningItem | ToolItem | CardItem | ConexusItem

/** How long each thinking took, by the key the server gives it: its message and its place in it. */
function thoughtSeconds(parts: readonly MastraMessagePart[]): Map<string, number> {
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

const Answered = z.object({ answers: z.array(z.union([z.string(), z.array(z.string())])) })

function parseAnswers(input: unknown): Answer[] | undefined {
  return Answered.safeParse(input).data?.answers
}

/** What Mastra's `submit_plan` returns once answered: the plan as submitted and the decision on it. */
const SubmittedPlan = z.object({
  submittedPlan: z.object({
    action: z.string(),
    title: z.string().optional(),
    plan: z.string().optional(),
  }),
})

const PlanArgs = z.object({ title: z.string(), plan: z.string(), path: z.string() }).partial()

function parsePlan(input: unknown): { title: string; plan: string; path?: string } {
  const parsed = PlanArgs.safeParse(input).data
  return { title: parsed?.title ?? '', plan: parsed?.plan ?? '', path: parsed?.path }
}

type Invocation = Extract<MastraMessagePart, { type: 'tool-invocation' }>['toolInvocation']

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

function questionStateOf(
  at: 'open' | 'result' | 'closed',
  answered: boolean,
  stopped: boolean,
): QuestionCardItem['state'] {
  if (at === 'open' || (at === 'result' && answered)) return at === 'open' ? 'open' : 'answered'
  return stopped ? 'stopped' : 'closed'
}

export function invocationToItem(
  inv: Invocation,
  suspension: Suspended | undefined,
  stopped = false,
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
    const state = questionStateOf(at, answers !== undefined, stopped)
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
  }
}

/** What Mastra's messages do not carry: the calls waiting on the person, and the commands running. */
export type View = {
  suspended: Readonly<Record<string, Suspended>>
  running: Readonly<Record<string, Running>>
  /** When the screen first heard of each tool call, by its id, epoch ms. */
  heard: Readonly<Record<string, number>>
  /** The answer is still arriving: its last thinking is in progress. */
  live: boolean
  /** The last run was stopped by the person: a card Mastra closed then was closed by Parar. */
  stopped: boolean
}

function fromParts(
  message: Message,
  thoughts: ReadonlyMap<string, number>,
  view: View,
): TranscriptItem[] {
  const items: TranscriptItem[] = []
  for (const [index, part] of message.parts.entries()) {
    const id = `${message.id}-${index}`
    // Mastra opens a step with an empty text part: it says nothing and must not split a run of tools.
    if (part.type === 'text') {
      if (part.text.trim() !== '') items.push({ kind: 'text', id, text: part.text })
    } else if (part.type === 'reasoning')
      items.push({
        kind: 'reasoning',
        id,
        reasoning: part.reasoning,
        seconds: thoughts.get(`${message.id}.${index}`) ?? null,
        streaming: false,
      })
    else if (part.type === 'tool-invocation') {
      const item = invocationToItem(
        part.toolInvocation,
        view.suspended[part.toolInvocation.toolCallId],
        view.stopped,
      )
      if (item) items.push(item)
    } else if (
      part.type.startsWith('data-conexus-') &&
      part.type !== 'data-conexus-thought' &&
      'data' in part
    ) {
      // Mastra's own `data-*` parts (the memory's) are not rows, and must not split a run of tools.
      items.push({ kind: 'conexus', id, partType: part.type, data: part.data })
    }
  }
  return items
}

/** A tool's own row of a call that ended outside Mastra's parts: its output and its exit. */
function withRunning(item: TranscriptItem, running: Running | undefined): TranscriptItem {
  if (item.kind !== 'tool' || running === undefined) return item
  const failed = running.exit?.success === false
  return {
    ...item,
    output: running.output,
    exitCode: running.exit?.code,
    state: failed ? 'output-error' : item.state,
    isError: failed ? true : item.isError,
  }
}

/** A tool's row counts its clock from when the screen first heard of the call. */
function withHeard(item: TranscriptItem, heard: Readonly<Record<string, number>>): TranscriptItem {
  return item.kind === 'tool' && heard[item.id] !== undefined
    ? { ...item, startedAt: heard[item.id] }
    : item
}

/**
 * A card's later telling, the result Mastra gives in the resumed run's message, says how it ended;
 * what it asked stays as the call said it, since the result does not carry it again.
 */
function joined(first: TranscriptItem | undefined, later: TranscriptItem): TranscriptItem {
  if (first?.kind !== 'card' || later.kind !== 'card') return later
  if (first.cardKind === 'question' && later.cardKind === 'question')
    return later.questions.length > 0 ? later : { ...later, questions: first.questions }
  if (first.cardKind !== 'plan' || later.cardKind !== 'plan') return later
  return { ...later, title: later.title || first.title, plan: later.plan || first.plan }
}

/**
 * The one derivation of a turn's rows from the Builder's messages, live and read alike. Mastra
 * gives a tool's call and its result in different messages, so a row of the same call keeps the
 * place of the first and the state of the last. The seconds of a thought are in the message of
 * ours, not in the step that thought, so they are read across the turn.
 */
export function itemsOf(messages: readonly Message[], view: View): TranscriptItem[] {
  const thoughts = thoughtSeconds(messages.flatMap((message) => message.parts))
  const items: TranscriptItem[] = []
  const placed = new Map<string, number>()
  for (const message of messages) {
    for (const found of fromParts(message, thoughts, view)) {
      const item = withHeard(withRunning(found, view.running[found.id]), view.heard)
      const at = placed.get(item.id)
      if (at === undefined) placed.set(item.id, items.push(item) - 1)
      else items[at] = joined(items[at], item)
    }
  }
  const last = items.at(-1)
  if (view.live && last?.kind === 'reasoning') {
    items[items.length - 1] = { ...last, streaming: true }
  }
  return items
}

/** Whether the turn waits on the person: a question or a plan is open. */
export function waitsOnPerson(items: readonly TranscriptItem[]): boolean {
  return items.some((item) => item.kind === 'card' && item.state === 'open')
}
