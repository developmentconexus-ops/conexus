import type { AgentId, ConnectionId, PersonId } from '@conexus/hub-api'
import { ConversationId, ToolCallId } from '@conexus/hub-api'
import type { ToolsInput } from '@mastra/core/agent'
import type { RequestContext } from '@mastra/core/request-context'
import { MASTRA_THREAD_ID_KEY } from '@mastra/core/request-context'
import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import type {
  Connectors,
  Returned,
  SessionScope,
  TurnKey,
  WriteRequest,
  WriteShape,
  Written,
} from '../../hub/connectors/public.ts'
import { openText, uncertainText } from '../../hub/connectors/public.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { approvedCallOf } from '../conversation/public.ts'
import { unfixedOf } from '../tools/public.ts'
import type { FrozenTool, PresetFrozenTool } from './frozen.ts'
import { targetOf } from './publish.ts'

/**
 * The failure an agent's tool throws for what certainly was not taken (decision 0062): Mastra
 * wraps it in `TOOL_EXECUTION_FAILED` and hands the model its message, the whole of it, as a tool
 * failure (`is_error` where the provider has one). The text is the JSON `{ kind, status, code,
 * message, body }` of what the provider said; the log never prints it (S41).
 */
class ConnectorRefused extends Error {
  override readonly name = 'ConnectorRefused'
}

type Refusal = Readonly<{
  kind: string
  native?: Readonly<{
    status: number
    code: string | null
    message: string | null
    body: unknown
  }>
}>

/** What the model reads of a provider's body at most: Codex's default for a tool's output, 10 000 tokens at 4 characters each. The record keeps it all. */
const TOLD_CHARACTERS = 40_000

/** A text for the model: whole up to the cap, past it its start and its end, as Claude Code keeps a long tool error; counted in characters, so a cut never splits one in two. */
function cappedText(text: string): string {
  if (text.length <= TOLD_CHARACTERS) return text
  const characters = Array.from(text)
  if (characters.length <= TOLD_CHARACTERS) return text
  const half = TOLD_CHARACTERS / 2
  const cut = characters.length - TOLD_CHARACTERS
  return `${characters.slice(0, half).join('')}…[${cut} characters cut]…${characters.slice(-half).join('')}`
}

/** A body for the model: as it came up to the cap, past it the cut of its JSON. */
function capped(body: unknown): unknown {
  const text = JSON.stringify(body)
  if (text === undefined) return body
  const told = cappedText(text)
  return told === text ? body : told
}

/** Throws what the model reads of an answer that was surely not taken: the kind and, when the provider answered, all it said, up to the cap. */
function refuse(answer: Refusal): never {
  const { status = null, code = null, message = null, body = null } = answer.native ?? {}
  const told = {
    ...{ kind: answer.kind, status, code },
    ...{ message: message === null ? null : cappedText(message), body: capped(body) },
  }
  throw new ConnectorRefused(JSON.stringify(told))
}

/** Every tool of an agent but a write runs without asking (step 24.5): only its own rule beats the controller's. */
export function NEVER_ASKS() {
  return false
}

/** Who an agent's write speaks as: a published version by its agent and number (it has no id of its own), or the person talking to the draft. */
export type WriteAuthor =
  | Readonly<{ kind: 'VERSION'; agentId: AgentId; number: number; answeredBy: PersonId | null }>
  | Readonly<{ kind: 'DRAFT' }>

type Deps = {
  connectors: Pick<
    Connectors['assistant'],
    'operationOf' | 'writeOf' | 'read' | 'write' | 'openWrites'
  >
  scope: SessionScope
  tools: readonly FrozenTool[]
  turnOf: (requestContext: RequestContext) => TurnKey
  author: WriteAuthor
  /** The connector of each connection the place offers, which a write's role check names. */
  offered: readonly Readonly<{ connectionId: ConnectionId; connector: string }>[]
  /**
   * Whether who answers for the version (who made it active) still leaves this write alone, read
   * now (`answererLeavesAlone`).
   */
  leavesAlone: (
    version: Extract<WriteAuthor, { kind: 'VERSION' }>,
    target: NonNullable<ReturnType<typeof targetOf>>,
  ) => Promise<boolean>
  log: FailureLog
}

/** The open fields of a read's or a write's own input, the ones the model fills, never one the operation says only whoever configures fixes. */
function openOf(input: z.ZodObject, tool: PresetFrozenTool, fixed: readonly string[] = []) {
  const open = new Set(tool.open)
  return z.strictObject(
    Object.fromEntries(
      Object.entries(input.shape).filter(([field]) => open.has(field) && !fixed.includes(field)),
    ),
  )
}

/** A tool in code is called through the Worker it is uploaded as (`code-tools.ts`); only a `PRESET` one is a read or a write here. */
function isPreset(tool: FrozenTool): tool is PresetFrozenTool {
  return tool.kind === 'PRESET'
}

function readTool(deps: Deps, tool: PresetFrozenTool, input: z.ZodObject | undefined) {
  return createTool({
    id: `tool_${tool.slug}`,
    description: tool.description,
    inputSchema: input === undefined ? z.object({}) : openOf(input, tool),
    requireApproval: NEVER_ASKS,
    execute: async (given, { requestContext, abortSignal }) => {
      if (input === undefined || requestContext === undefined)
        return refuse({ kind: 'NOT_GRANTED' })
      const answered = await deps.connectors.read(deps.scope, {
        connectionId: tool.connectionId,
        operation: tool.operation,
        input: { ...given, ...tool.bound },
        turn: deps.turnOf(requestContext),
        signal: abortSignal,
      })
      if (answered.kind !== 'OK') return refuse(answered)
      const { whole: _whole, ...cut } = answered
      return cut
    },
  })
}

/** What the provider answered, for the model: the body up to the cap. */
function told(returned: Returned | null) {
  return returned && { status: returned.status, body: capped(returned.body) }
}

/**
 * What the model hears of a write: what the provider answered, whole up to the cap, on a success and
 * when the end is unknown, so the model reads it itself; the answers that leave the end unknown or the
 * write held come back as results with what to do next, and every other one that was not taken is
 * thrown (criterion 35).
 */
function toldOf(written: Written | { kind: 'CALLS_SPENT' }) {
  switch (written.kind) {
    case 'OK':
      return { ...written, returned: told(written.returned) }
    case 'WRITE_UNCERTAIN':
      return {
        ...written,
        returned: told(written.returned),
        instruction: uncertainText(written.mark, { returned: true }),
      }
    case 'IDEMPOTENCY_CONFLICT':
      return { ...written, instruction: uncertainText(written.mark, { returned: false }) }
    case 'WRITE_OPEN':
      return { ...written, instruction: openText(written.mark, written.since) }
    default:
      return refuse(written)
  }
}

type Asked = Omit<WriteRequest, 'speaker' | 'agentId' | 'number'>

/** The request as its author speaks: a version by what it declares (decision C1), a person by the role the funnel reads. */
function requestOf(deps: Deps, asked: Asked): WriteRequest {
  if (deps.author.kind === 'DRAFT') {
    return { ...asked, speaker: { kind: 'PERSON', personId: deps.scope.personId } }
  }
  const declared = deps.scope.agentVersion?.declared ?? []
  const { agentId, number } = deps.author
  return { ...asked, speaker: { kind: 'VERSION', declared }, agentId, number }
}

/**
 * Whether a published version's write in Faz sozinho may still run without asking (step 24.5,
 * D2-a): the role of who answers for the version (who made it active), read on every call, holds
 * the action and the write. A connection the place no longer offers has no connector to ask about,
 * and asks.
 */
async function aloneByAnswerer(deps: Deps, tool: PresetFrozenTool): Promise<boolean> {
  if (deps.author.kind === 'DRAFT') return true
  const target = targetOf(deps.offered, tool)
  return target !== undefined && deps.leavesAlone(deps.author, target)
}

/**
 * A write of the version (step 24.5): it asks the person first when the version keeps it in
 * Pergunta antes, when the role of who answers for the version (who made it active) no longer
 * leaves it alone, or when the conversation holds an earlier send of the same write whose end is
 * not known; Mastra treats the tool's own rule as final, and asks when it throws (`@mastra/core@1.82.0` `agent-BP9OWM6D.js:15136-15140`),
 * so a failed read asks. Its `execute` sends through the Hub's write funnel, which checks the open
 * sends again unless a person approved this very call.
 */
function writeTool(deps: Deps, tool: PresetFrozenTool, write: WriteShape) {
  const { input, fixed } = write
  const target = { connectionId: tool.connectionId, operation: tool.operation }
  return createTool({
    id: `tool_${tool.slug}`,
    description: tool.description,
    inputSchema: openOf(input, tool, fixed),
    requireApproval: async (_given, context) => {
      if (tool.approval !== 'AUTO') return true
      if (!(await aloneByAnswerer(deps, tool))) return true
      const threadId = ConversationId.safeParse(context?.requestContext?.[MASTRA_THREAD_ID_KEY])
      if (!threadId.success) return true
      const open = await deps.connectors.openWrites({
        ...{ scope: deps.scope, threadId: threadId.data },
        ...target,
      })
      return open.length > 0
    },
    execute: async (given, { requestContext, agent, abortSignal }) => {
      if (requestContext === undefined || agent?.threadId === undefined) {
        deps.log.error({ ...target, tool: tool.slug }, 'CONNECTOR_WRITE_NO_CONTEXT')
        throw new Error('an agent’s write was called without its conversation')
      }
      // A version published before the field was declared fixed leaves it open: nothing is sent (criterion 44).
      const unfixed = unfixedOf(fixed, tool)
      if (unfixed !== undefined) {
        deps.log.info({ ...target, tool: tool.slug, field: unfixed }, 'CONNECTOR_WRITE_NOT_FIXED')
        throw new ConnectorRefused(JSON.stringify({ kind: 'NOT_FIXED', field: unfixed }))
      }
      const toolCallId = ToolCallId.parse(agent.toolCallId)
      const approved = approvedCallOf(requestContext)
      const asked: Asked = {
        ...{ scope: deps.scope, ...target, input: { ...given, ...tool.bound } },
        ...{ threadId: ConversationId.parse(agent.threadId), toolCallId },
        ...(approved?.toolCallId === toolCallId ? { approvedBy: approved.personId } : {}),
        ...{ turn: deps.turnOf(requestContext), signal: abortSignal },
      }
      return toldOf(await deps.connectors.write(requestOf(deps, asked)))
    },
  })
}

/**
 * The version's tools, one `createTool` each under `tool_<slug>` (step 24.3), as the version holds
 * them: a read's call goes through the company's door with the fixed values over what the model
 * sent, so the model never changes one, counted in the turn's 50 calls, and the model gets the cut;
 * a write's goes through the write funnel the same way (step 24.5). The writes are apart, for the
 * program does not call them (criterion 10). A connection the Projeto no longer offers has no input,
 * and its read answers `NOT_GRANTED`.
 */
export async function presetTools(deps: Deps): Promise<{ reads: ToolsInput; writes: ToolsInput }> {
  const made = await Promise.all(
    deps.tools.filter(isPreset).map(async (tool) => {
      const id = `tool_${tool.slug}`
      const write = await deps.connectors.writeOf(deps.scope, tool)
      if (write !== undefined) return { id, writes: true, made: writeTool(deps, tool, write) }
      const read = await deps.connectors.operationOf(deps.scope, tool)
      return { id, writes: false, made: readTool(deps, tool, read) }
    }),
  )
  function of(writes: boolean): ToolsInput {
    return Object.fromEntries(
      made.filter((each) => each.writes === writes).map((each) => [each.id, each.made]),
    )
  }
  return { reads: of(false), writes: of(true) }
}
