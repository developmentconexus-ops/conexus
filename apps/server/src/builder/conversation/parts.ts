import { CheckReport } from '@conexus/app/check'
import type { Message, MessagePart, PartEvent, ToolDetail } from '@conexus/hub-api'
import {
  applyEvent,
  DETAIL_LIMITS,
  MessageId,
  ModelId,
  SUBJECT_MAX_LENGTH,
  Task,
  ToolCallId,
} from '@conexus/hub-api'
import type { MastraDBMessage, MastraMessagePart } from '@mastra/core/agent-controller'
import { WORKSPACE_TOOLS } from '@mastra/core/workspace'
import { z } from 'zod'
import { NOTICE_PART, Notice as NoticeData } from '../model-accounts/public.ts'
import { checkDetail, foundBy } from './check-row.ts'
import { TOOL_CLOSURE } from './permissions.ts'
import { ASK_USER_TOOL, AskedResult, questionsOf, SUBMIT_PLAN_TOOL } from './plan-tools.ts'
import { CHECK_TOOL } from './processors.ts'
import { tailOf } from './shell.ts'

type ToolPart = Extract<MessagePart, { type: 'tool' }>

/** The kind of each of the Builder's tools, by its name; any other is `other` (code C26). */
const KINDS: Readonly<Record<string, ToolPart['kind']>> = {
  web_fetch: 'read_page',
  web_search: 'search_web',
  recall: 'recall',
  [WORKSPACE_TOOLS.FILESYSTEM.READ_FILE]: 'read_file',
  [WORKSPACE_TOOLS.FILESYSTEM.WRITE_FILE]: 'write_file',
  [WORKSPACE_TOOLS.FILESYSTEM.EDIT_FILE]: 'edit_file',
  [WORKSPACE_TOOLS.SANDBOX.EXECUTE_COMMAND]: 'run_command',
  [CHECK_TOOL]: 'check',
}

const Text = z.object({ type: z.literal('text'), text: z.string() })
const Reasoning = z.object({ type: z.literal('reasoning') })
const Invocation = z.object({
  type: z.literal('tool-invocation'),
  toolInvocation: z.object({
    toolCallId: z.string().min(1),
    toolName: z.string(),
    state: z.enum([
      'partial-call',
      'call',
      'approval-requested',
      'approval-responded',
      'result',
      'output-error',
      'output-denied',
    ]),
    args: z.unknown(),
    result: z.unknown().optional(),
    isError: z.boolean().optional(),
  }),
})
type Invocation = z.infer<typeof Invocation>['toolInvocation']
// A tool that answers its own failure, as `web_fetch` does, rather than throwing.
const FailedResult = z.object({ isError: z.literal(true) })
const PageArgs = z.object({ url: z.url() })
const PathArgs = z.object({ path: z.string().min(1) })
const CommandArgs = z.object({ command: z.string().min(1) })
const WriteArgs = z.object({ path: z.string().min(1), content: z.string() })
const EditArgs = z.object({
  path: z.string().min(1),
  old_string: z.string(),
  new_string: z.string(),
})
const SearchArgs = z.object({ query: z.string() })
const Notice = z.object({ type: z.literal(NOTICE_PART), data: NoticeData })
const PersonSignal = z.object({ signal: z.object({ type: z.literal('user') }) })
// How a command ended, which Mastra's `execute_command` keeps in the message beside its result.
const CommandExit = z.object({
  type: z.literal('data-sandbox-exit'),
  data: z.object({ toolCallId: z.string().min(1), exitCode: z.int() }),
})
const TASK_TOOLS = new Set(['task_write', 'task_update', 'task_complete', 'task_check'])
const CARD_TOOLS = new Set([ASK_USER_TOOL, SUBMIT_PLAN_TOOL, ...TASK_TOOLS])
const TaskResult = z.object({ tasks: z.array(Task) })
const SubmittedPlan = z.object({
  submittedPlan: z.object({
    title: z.string().default(''),
    plan: z.string().default(''),
    action: z.enum(['approved', 'rejected']),
  }),
})
// What Mastra keeps in the message of a call it suspended: the plan the tool suspended with.
const SuspendedPlans = z.object({
  suspendedTools: z.record(
    z.string(),
    z.object({
      suspendPayload: z.object({ title: z.string().default(''), plan: z.string().default('') }),
    }),
  ),
})
const Answered = z.object({ modelId: z.string().min(1), provider: z.string().min(1) })

function subjectCut(text: string): string {
  return text.slice(0, SUBJECT_MAX_LENGTH)
}

/** A command as its row says it, in its subject and its detail alike: cut, as it was written. */
function saidCommand(command: string): string {
  return subjectCut(command)
}

function stateOf(invocation: Invocation): ToolPart['state'] {
  switch (invocation.state) {
    case 'partial-call':
    case 'call':
    case 'approval-requested':
    case 'approval-responded':
      return 'running'
    case 'output-error':
      return 'error'
    case 'output-denied':
      return 'denied'
    case 'result':
      return invocation.isError === true || FailedResult.safeParse(invocation.result).success
        ? 'error'
        : 'completed'
    default:
      return invocation.state satisfies never
  }
}

function subjectOf(kind: ToolPart['kind'], args: unknown, result: unknown): ToolPart['subject'] {
  const report = kind === 'check' ? CheckReport.safeParse(result) : undefined
  const found = report?.success ? foundBy(report.data) : undefined
  if (found !== undefined) return { check: found }
  const page = kind === 'read_page' ? PageArgs.safeParse(args) : undefined
  if (page?.success) return { url: page.data.url, title: null }
  const search = kind === 'search_web' ? SearchArgs.safeParse(args) : undefined
  if (search?.success) return { query: subjectCut(search.data.query) }
  const file =
    kind === 'read_file' || kind === 'write_file' || kind === 'edit_file'
      ? PathArgs.safeParse(args)
      : undefined
  if (file?.success) return { path: subjectCut(file.data.path) }
  const command = kind === 'run_command' ? CommandArgs.safeParse(args) : undefined
  if (command?.success) return { command: saidCommand(command.data.command) }
  return null
}

/** The first `limit` lines of a text, and whether it had more. */
function firstLines(text: string, limit: number): { text: string; cut: boolean } {
  const lines = text.split('\n')
  return { text: lines.slice(0, limit).join('\n'), cut: lines.length > limit }
}

/**
 * What a tool's row opens on, from its arguments, its result and how its command exited, cut
 * as it is: a command and its output's end, a written file's start, an
 * edit's two sides; a read keeps only its subject (card of step 14, U6).
 */
function detailOf(
  kind: ToolPart['kind'],
  invocation: Invocation,
  exitCode: number | null,
): ToolDetail | undefined {
  const { args, result } = invocation
  const command = kind === 'run_command' ? CommandArgs.safeParse(args) : undefined
  if (command?.success) {
    const { output, cut } = typeof result === 'string' ? tailOf(result) : { output: [], cut: false }
    return { kind: 'command', command: saidCommand(command.data.command), output, exitCode, cut }
  }
  const report = kind === 'check' ? CheckReport.safeParse(result) : undefined
  if (report?.success) return checkDetail(report.data)
  const write = kind === 'write_file' ? WriteArgs.safeParse(args) : undefined
  if (write?.success) {
    const content = write.data.content
    const kept = content.slice(0, DETAIL_LIMITS.fileCharacters)
    const path = subjectCut(write.data.path)
    return { kind: 'file', path, content: kept, cut: kept.length < content.length }
  }
  const edit = kind === 'edit_file' ? EditArgs.safeParse(args) : undefined
  if (!edit?.success) return undefined
  const before = firstLines(edit.data.old_string, DETAIL_LIMITS.editLines)
  const after = firstLines(edit.data.new_string, DETAIL_LIMITS.editLines)
  const path = subjectCut(edit.data.path)
  const cut = before.cut || after.cut
  return { kind: 'edit', path, before: before.text, after: after.text, cut }
}

const OFFERED = new Set(TOOL_CLOSURE.availableTools)

/**
 * A tool call as the person sees it: its kind, its state, what it was about and what its row opens
 * on. A call to a tool outside the closed set fails because the controller refuses it, not because
 * the tool ran: it is `denied`, as Mastra's own `tool_end.denied` fires only for an approval (none here).
 */
function toolOf(invocation: Invocation, exitCode: number | null): ToolPart {
  const kind = KINDS[invocation.toolName] ?? 'other'
  const subject = subjectOf(kind, invocation.args, invocation.result)
  const state = stateOf(invocation)
  const refused = state === 'error' && !OFFERED.has(invocation.toolName)
  return {
    type: 'tool',
    id: invocation.toolCallId,
    kind,
    state: refused ? 'denied' : state,
    subject,
    detail: detailOf(kind, invocation, exitCode),
  }
}

/**
 * The cards of the controller's tools as the person sees them, in the place of a tool row: the
 * questions and the plan the turn waits on or got an answer to, and the task list. A call the tool
 * refused is not a card. An answered question's answers are its call's result, as Mastra keeps it;
 * the plan's text is the thread's while the plan is open (`withSuspended`).
 */
function cardOf(invocation: Invocation): MessagePart | undefined {
  const { toolName, toolCallId, args, result } = invocation
  const id = ToolCallId.safeParse(toolCallId)
  if (!id.success) return undefined
  const state = stateOf(invocation)
  if (TASK_TOOLS.has(toolName)) {
    const tasks = TaskResult.safeParse(result)
    return tasks.success ? { type: 'tasks', items: tasks.data.tasks } : undefined
  }
  if (toolName === ASK_USER_TOOL) {
    const questions = questionsOf(args)
    if (questions === undefined || state === 'error') return undefined
    const card = { type: 'question', toolCallId: id.data, questions } as const
    if (state !== 'completed') return { ...card, state: state === 'running' ? 'open' : 'closed' }
    const answered = AskedResult.safeParse(result)
    return answered.success
      ? { ...card, state: 'answered', answers: answered.data.answers }
      : undefined
  }
  const submitted = SubmittedPlan.safeParse(result)
  if (state === 'error' || (state === 'completed' && !submitted.success)) return undefined
  const { title, plan, action } = submitted.success
    ? submitted.data.submittedPlan
    : { title: '', plan: '', action: undefined }
  const closed = state === 'denied' ? 'closed' : (action ?? 'open')
  return { type: 'plan', toolCallId: id.data, title, plan, state: closed }
}

/** The file part a finished write or edit leaves, or none for any other tool state. */
export function fileOf(tool: ToolPart): MessagePart | undefined {
  const operation =
    tool.kind === 'write_file' ? 'write' : tool.kind === 'edit_file' ? 'edit' : undefined
  if (operation === undefined || tool.state !== 'completed' || tool.subject === null)
    return undefined
  return 'path' in tool.subject
    ? { type: 'file', toolId: tool.id, path: tool.subject.path, operation }
    : undefined
}

/** Where a part of Mastra's sits: its message and place in it, which name a thinking part. */
export type Place = { messageId: MessageId; index: number }

/** The id of the thinking at `place`, the same live and read again. */
function reasoningId(place: Place): string {
  return `${place.messageId}.${place.index}`
}

/**
 * What the person sees of one of Mastra's parts: its text, that it thought (never what), a tool
 * call, and a queue notice; the rest stays inside. Thinking read here is over; its time is the
 * thread's (`history.ts`). A command's exit code is Mastra's `data-sandbox-exit` beside the call.
 */
export function partOf(
  part: MastraMessagePart | unknown,
  place: Place,
  exitOf: (call: string) => number | null = () => null,
): MessagePart | undefined {
  const text = Text.safeParse(part)
  if (text.success) return text.data
  if (Reasoning.safeParse(part).success) {
    return { type: 'reasoning', id: reasoningId(place), state: 'completed', seconds: null }
  }
  const invocation = Invocation.safeParse(part)
  if (invocation.success) {
    const { toolName } = invocation.data.toolInvocation
    if (CARD_TOOLS.has(toolName)) return cardOf(invocation.data.toolInvocation)
    return toolOf(invocation.data.toolInvocation, exitOf(invocation.data.toolInvocation.toolCallId))
  }
  const notice = Notice.safeParse(part)
  if (notice.success) return { type: 'notice', text: notice.data.data.text }
  return undefined
}

/** A read part as the event the stream would have said it by, for `applyEvent` to fold. */
export function eventOf(part: MessagePart): PartEvent {
  if (part.type === 'text') return { type: 'text', delta: part.text }
  return part.type === 'notice' ? { type: 'notice', text: part.text } : { type: 'part', part }
}

/** The model that answered a message, `provider/model` as the router names it, or none. */
export function modelOf(message: { content: { metadata?: unknown } }): ModelId | null {
  const answered = Answered.safeParse(message.content.metadata)
  if (!answered.success) return null
  const model = ModelId.safeParse(`${answered.data.provider}/${answered.data.modelId}`)
  return model.success ? model.data : null
}

/** A plan Mastra holds only as a call it suspended or denied is read from what the call suspended with. */
function withPlan(
  shown: MessagePart | undefined,
  suspended: z.infer<typeof SuspendedPlans>['suspendedTools'] | undefined,
): MessagePart | undefined {
  if (shown?.type !== 'plan' || shown.plan !== '') return shown
  const payload = suspended?.[shown.toolCallId]?.suspendPayload
  return payload === undefined ? shown : { ...shown, title: payload.title, plan: payload.plan }
}

/** A stored message as the person reads it: theirs, or the Builder's; none of Mastra's others. */
export function messageOf(message: MastraDBMessage): Message | undefined {
  const role =
    message.role === 'assistant'
      ? 'builder'
      : message.role === 'user' ||
          (message.role === 'signal' && PersonSignal.safeParse(message.content.metadata).success)
        ? 'person'
        : undefined
  if (role === undefined) return undefined
  const id = MessageId.parse(message.id)
  const exits = new Map<string, number>()
  for (const part of message.content.parts) {
    const exit = CommandExit.safeParse(part)
    if (exit.success) exits.set(exit.data.data.toolCallId, exit.data.data.exitCode)
  }
  const suspended = SuspendedPlans.safeParse(message.content.metadata)
  let parts: MessagePart[] = []
  for (const [index, part] of message.content.parts.entries()) {
    const place = { messageId: id, index }
    const read = partOf(part, place, (call) => exits.get(call) ?? null)
    const shown = withPlan(read, suspended.data?.suspendedTools)
    if (shown === undefined) continue
    parts = applyEvent(parts, eventOf(shown))
    const after = shown.type === 'tool' ? fileOf(shown) : undefined
    if (after !== undefined) parts = applyEvent(parts, eventOf(after))
  }
  return {
    id,
    role,
    parts,
    model: role === 'builder' ? modelOf(message) : null,
    createdAt: new Date(message.createdAt).toISOString(),
  }
}
