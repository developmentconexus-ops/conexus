import type { AgentId } from '@conexus/hub-api'
import { ConversationId, ToolCallId } from '@conexus/hub-api'
import type { ToolsInput } from '@mastra/core/agent'
import type { RequestContext } from '@mastra/core/request-context'
import { MASTRA_THREAD_ID_KEY } from '@mastra/core/request-context'
import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import type {
  Connectors,
  SessionScope,
  TurnKey,
  WriteRequest,
  Written,
} from '../../hub/connectors/public.ts'
import { openText, uncertainText } from '../../hub/connectors/public.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { approvedCallOf } from '../conversation/public.ts'
import type { FrozenTool, PresetFrozenTool } from './frozen.ts'

const NOT_GRANTED = { kind: 'NOT_GRANTED' } as const

/** Every tool of an agent but a write runs without asking (step 24.5): only its own rule beats the controller's. */
export function NEVER_ASKS() {
  return false
}

/** Who an agent's write speaks as: a published version by its agent and number (it has no id of its own), or the person talking to the draft. */
export type WriteAuthor =
  | Readonly<{ kind: 'VERSION'; agentId: AgentId; number: number }>
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
  log: FailureLog
}

/** The open fields of a read's or a write's own input, the ones the model fills. */
function openOf(input: z.ZodObject, tool: PresetFrozenTool) {
  const open = new Set(tool.open)
  return z.object(
    Object.fromEntries(Object.entries(input.shape).filter(([field]) => open.has(field))),
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
      if (input === undefined || requestContext === undefined) return NOT_GRANTED
      const answered = await deps.connectors.read(deps.scope, {
        connectionId: tool.connectionId,
        operation: tool.operation,
        input: { ...given, ...tool.bound },
        turn: deps.turnOf(requestContext),
        signal: abortSignal,
      })
      if (answered.kind !== 'OK') return answered
      const { whole: _whole, ...cut } = answered
      return cut
    },
  })
}

/** What the model hears of a write: the funnel's answer, with what to do next where nothing more may be sent. */
function toldOf(written: Written | { kind: 'CALLS_SPENT' }) {
  switch (written.kind) {
    case 'WRITE_UNCERTAIN':
    case 'IDEMPOTENCY_CONFLICT':
      return { ...written, instruction: uncertainText(written.mark) }
    case 'WRITE_OPEN':
      return { ...written, instruction: openText(written.mark, written.since) }
    default:
      return written
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
 * A write of the version (step 24.5): it asks the person first when the version keeps it in
 * Pergunta antes, or when the conversation holds an earlier send of the same write whose end is
 * not known; Mastra treats the tool's own rule as final. Its `execute` sends through the Hub's
 * write funnel, which checks the open sends again unless a person approved this very call.
 */
function writeTool(deps: Deps, tool: PresetFrozenTool, input: z.ZodObject) {
  const target = { connectionId: tool.connectionId, operation: tool.operation }
  return createTool({
    id: `tool_${tool.slug}`,
    description: tool.description,
    inputSchema: openOf(input, tool),
    requireApproval: async (_given, context) => {
      if (tool.approval !== 'AUTO') return true
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
