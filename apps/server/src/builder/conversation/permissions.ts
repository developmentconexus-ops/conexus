import type { PermissionRules, ToolCategory } from '@mastra/core/agent-controller'
import { WORKSPACE_TOOLS } from '@mastra/core/workspace'

const { FILESYSTEM, SANDBOX } = WORKSPACE_TOOLS
const READ = new Set<string>([
  FILESYSTEM.READ_FILE,
  FILESYSTEM.LIST_FILES,
  FILESYSTEM.GREP,
  FILESYSTEM.FILE_STAT,
  'web_search',
  'web_fetch',
  'recall',
  'skill',
  'skill_search',
  'skill_read',
])
const EDIT = new Set<string>([
  FILESYSTEM.WRITE_FILE,
  FILESYSTEM.EDIT_FILE,
  FILESYSTEM.MKDIR,
  FILESYSTEM.DELETE,
])
const EXECUTE = new Set<string>([
  SANDBOX.EXECUTE_COMMAND,
  SANDBOX.GET_PROCESS_OUTPUT,
  SANDBOX.KILL_PROCESS,
])

/**
 * The permission category of each tool the Builder has (card, U6): reading and the web are `read`,
 * writing files `edit`, commands and their processes `execute`. A tool not named here, an MCP
 * tool included, is `other`, which the rules deny, so a tool added later does nothing until it is
 * classified here.
 */
function categoryOf(toolName: string): ToolCategory {
  if (READ.has(toolName)) return 'read'
  if (EDIT.has(toolName)) return 'edit'
  if (EXECUTE.has(toolName)) return 'execute'
  return 'other'
}

/**
 * What every session starts with (S2, S14, card U6, never `yolo`): the machine is the Builder's to
 * read, write and run in, nothing else is. A tool the rules allow does not wait: the workspace's
 * tools and `web_fetch` answer for themselves that they need no approval, which the run's own
 * requirement yields to; `recall`, Memory's, is approved by the rule at once.
 */
const PERMISSION_RULES: PermissionRules = {
  categories: { read: 'allow', edit: 'allow', execute: 'allow', mcp: 'deny', other: 'deny' },
  tools: {},
}

/**
 * How the Builder's controller closes its tools, the one owner of the closed set: the mode offers
 * the three categories the rules allow and no other tool (`availableTools`, which the controller
 * narrows by the same rules), the resolver classifies each tool, and no session starts in `yolo`.
 * The account queue narrows the set the mode offers and never rebuilds it.
 */
export const TOOL_CLOSURE = {
  availableTools: [...READ, ...EDIT, ...EXECUTE],
  toolCategoryResolver: categoryOf,
  initialState: { yolo: false, permissionRules: PERMISSION_RULES },
}
