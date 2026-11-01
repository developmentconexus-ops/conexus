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
