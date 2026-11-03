import { z } from 'zod'
import { AgentId, ToolId, ToolVersionId } from './agent-ids.ts'
import { CompanyId } from './companies.ts'
import { ConnectionId } from './connectors.ts'
import type { FailureCode } from './failures.ts'
import { ATTEMPT_KEY_HEADER, defineOperation } from './operation.ts'
import { ProjectId } from './projects.ts'

/** The tool of each card the person answers, as the controller names the call it parks. */
export const CARD_TOOLS = { question: 'ask_user', plan: 'submit_plan' } as const

/** The controller's tools that keep the task list, which the screen shows as one list and not as calls. */
export const TASK_TOOLS = ['task_write', 'task_update', 'task_complete', 'task_check'] as const

/** The tools that load a skill, which the Builder calls on its own. */
export const SKILL_TOOLS = ['skill', 'skill_read', 'skill_search'] as const

/**
 * The workspace's tools as Mastra names them (`WORKSPACE_TOOLS`), the ones the Builder's closure
 * offers; the server proves each equal to Mastra's constant (`permissions.ts`, code C27).
 */
export const WORKSPACE_TOOL = {
  readFile: 'mastra_workspace_read_file',
  writeFile: 'mastra_workspace_write_file',
  editFile: 'mastra_workspace_edit_file',
  listFiles: 'mastra_workspace_list_files',
  delete: 'mastra_workspace_delete',
  fileStat: 'mastra_workspace_file_stat',
  mkdir: 'mastra_workspace_mkdir',
  grep: 'mastra_workspace_grep',
  executeCommand: 'mastra_workspace_execute_command',
  getProcessOutput: 'mastra_workspace_get_process_output',
  killProcess: 'mastra_workspace_kill_process',
} as const

/**
 * The Builder's own tools besides the workspace's: the web, the memory's recall, the check and the
 * three of a Projeto's granted connections (the server proves them equal to its own, code C27).
 */
export const BUILDER_TOOL = {
  webSearch: 'web_search',
  webFetch: 'web_fetch',
  recall: 'recall',
  check: 'conexus_check',
  connectorRead: 'connector_read',
  connectorNotes: 'connector_notes',
  connectorNoteSave: 'connector_note_save',
} as const

/** Every tool the Builder's closure offers (`TOOL_CLOSURE.availableTools`), each named once. */
export const CLOSED_TOOLS = [
  ...Object.values(WORKSPACE_TOOL),
  ...Object.values(BUILDER_TOOL),
  ...SKILL_TOOLS,
  ...Object.values(CARD_TOOLS),
  ...TASK_TOOLS,
] as const
export type ClosedTool = (typeof CLOSED_TOOLS)[number]

/**
 * A connector operation's id, the kit's own form (`kernel/operation.ts`); the Hub finds it in the kit
 * through the connectors' door, which alone may read the kit (security S36).
 */
export const OperationId = z
  .string()
  .regex(/^[a-z][a-zA-Z0-9]{1,39}$/)
  .brand('OperationId')
export type OperationId = z.infer<typeof OperationId>

/** The name the model reads, `tool_<slug>`: the same in every version of the tool. */
export const ToolSlug = z.string().regex(/^[a-z][a-z0-9_]{0,39}$/)
export type ToolSlug = z.infer<typeof ToolSlug>

/** What a tool of the company's library reads (step 24.3, `T1`): one read of one connection, the same in every version. */
export const ToolTarget = z.object({ connectionId: ConnectionId, operation: OperationId })
export type ToolTarget = z.infer<typeof ToolTarget>

/**
 * One version of a tool: its description, the values it fixes and the top-level fields the model
 * fills. The model's input is `{ ...filled, ...bound }`, so a fixed value always wins; `bound` and
 * `open` never share a field and together cover the operation's required ones. A ready read of a
 * connector is `bound: {}` with every field open.
 */
export const ToolVersionConfig = z.object({
  description: z.string().trim().min(1).max(500),
  bound: z.record(z.string(), z.unknown()),
  open: z.array(z.string().min(1).max(64)).max(64),
})
export type ToolVersionConfig = z.infer<typeof ToolVersionConfig>

export const ToolInput = ToolTarget.extend(ToolVersionConfig.shape).extend({ slug: ToolSlug })
export type ToolInput = z.infer<typeof ToolInput>

/** What a tool does, by its operation's class; only reads in step 24.3 (the 24.5 adds the writes). */
export const ToolEffect = z.enum(['READ'])
export type ToolEffect = z.infer<typeof ToolEffect>

/** A read of a connection the Projeto received that the library does not hold yet, chosen as it is. */
export const ReadyTool = ToolTarget.extend({ label: z.string(), summary: z.string(), slug: ToolSlug })
export type ReadyTool = z.infer<typeof ReadyTool>

export const ToolVersionDetail = ToolVersionConfig.extend({
  id: ToolVersionId,
  number: z.int().positive(),
})
export type ToolVersionDetail = z.infer<typeof ToolVersionDetail>

export const ToolSummary = ToolTarget.extend({
  id: ToolId,
  slug: ToolSlug,
  description: z.string(),
  effect: ToolEffect,
  latest: z.object({ id: ToolVersionId, number: z.int().positive() }),
  /** The agents whose draft or a published version uses a version of the tool. */
  usedBy: z.array(z.object({ id: AgentId, name: z.string() })),
})
export type ToolSummary = z.infer<typeof ToolSummary>

export const ToolDetail = ToolSummary.extend({ versions: z.array(ToolVersionDetail) })
export type ToolDetail = z.infer<typeof ToolDetail>

const InProject = z.object({ companyId: CompanyId, projectId: ProjectId })
const OfTool = InProject.extend({ toolId: ToolId })
const TOOLS = '/api/companies/{companyId}/projects/{projectId}/tools'
const TOOL_FAILURES = [
  'NOT_FOUND',
  'SESSION_REQUIRED',
  'DATABASE_UNAVAILABLE',
] as const satisfies readonly FailureCode[]
const OneTool = z.object({ tool: ToolDetail })

export const listTools = defineOperation({
  id: 'listTools',
  summary:
    'Lists the tools of the company’s library this Projeto may use, and the ready reads of its connections not in the library yet.',
  access: 'session',
  method: 'GET',
  path: TOOLS,
  bodyLimit: 1024,
  input: { params: InProject },
  success: {
    status: 200,
    body: z.object({ tools: z.array(ToolSummary), ready: z.array(ReadyTool) }),
  },
  failures: TOOL_FAILURES,
})

export const createTool = defineOperation({
  id: 'createTool',
  summary: `Saves a tool in the company’s library at version 1, keyed by ${ATTEMPT_KEY_HEADER}: one read of a connection this Projeto received, with fixed values and the fields the model fills.`,
  access: 'session',
  method: 'POST',
  path: TOOLS,
  bodyLimit: 32_768,
  input: { params: InProject, body: ToolInput },
  attemptKey: true,
  success: { status: 201, body: OneTool },
  failures: [...TOOL_FAILURES, 'TOOL_REFUSED', 'IDEMPOTENCY_CONFLICT'],
})

export const getTool = defineOperation({
  id: 'getTool',
  summary: 'Reads one tool this Projeto may use, with its versions.',
  access: 'session',
  method: 'GET',
  path: `${TOOLS}/{toolId}`,
  bodyLimit: 1024,
  input: { params: OfTool },
  success: { status: 200, body: OneTool },
  failures: [...TOOL_FAILURES, 'TOOL_NOT_FOUND'],
})

export const createToolVersion = defineOperation({
  id: 'createToolVersion',
  summary: `Saves the next version of a tool, keyed by ${ATTEMPT_KEY_HEADER}; the earlier versions, and the agents that hold them, do not change.`,
  access: 'session',
  method: 'POST',
  path: `${TOOLS}/{toolId}/versions`,
  bodyLimit: 32_768,
  input: { params: OfTool, body: ToolVersionConfig },
  attemptKey: true,
  success: { status: 201, body: OneTool },
  failures: [...TOOL_FAILURES, 'TOOL_NOT_FOUND', 'TOOL_REFUSED', 'IDEMPOTENCY_CONFLICT'],
})

export const deleteTool = defineOperation({
  id: 'deleteTool',
  summary:
    'Deletes a tool of the library and its versions, unless a draft or a published version of an agent uses it.',
  access: 'session',
  method: 'DELETE',
  path: `${TOOLS}/{toolId}`,
  bodyLimit: 1024,
  input: { params: OfTool },
  success: { status: 204 },
  failures: [...TOOL_FAILURES, 'TOOL_NOT_FOUND', 'TOOL_IN_USE'],
})
