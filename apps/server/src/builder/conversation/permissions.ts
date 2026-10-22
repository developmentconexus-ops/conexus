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
// The controller's tools that talk to the person: the questions, the plan and the task list.
const TALK = new Set<string>([
  'ask_user',
  'submit_plan',
  'task_write',
  'task_update',
  'task_complete',
  'task_check',
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
 * How the Builder's controller closes its tools, the one owner of the closed set, as Mastra Code
 * closes its own (`mastracode/sdk/src/index.ts:858,1331`): the mode offers the four groups and no
 * other tool (`availableTools`, which the controller enforces when a tool is called), a session
 * starts in `yolo` so nothing waits to be approved (decision 0053), and the controller's own
 * tools are off (`disableBuiltinTools`). The account queue narrows the set the mode offers and
 * never rebuilds it.
 */
export const TOOL_CLOSURE = {
  availableTools: [...READ, ...EDIT, ...EXECUTE, ...TALK],
  initialState: { yolo: true },
}
