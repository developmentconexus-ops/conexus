import type { WORKSPACE_TOOL } from '@conexus/hub-api'
import { BUILDER_TOOL, CARD_TOOLS, SKILL_TOOLS, TASK_TOOLS } from '@conexus/hub-api'
import { WORKSPACE_TOOLS } from '@mastra/core/workspace'

const { FILESYSTEM, SANDBOX } = WORKSPACE_TOOLS

/** The names the screen keys its rows by are Mastra's own: a rename in Mastra fails here (code C27). */
const SAME_NAMES = {
  readFile: FILESYSTEM.READ_FILE,
  writeFile: FILESYSTEM.WRITE_FILE,
  editFile: FILESYSTEM.EDIT_FILE,
  listFiles: FILESYSTEM.LIST_FILES,
  delete: FILESYSTEM.DELETE,
  fileStat: FILESYSTEM.FILE_STAT,
  mkdir: FILESYSTEM.MKDIR,
  grep: FILESYSTEM.GREP,
  executeCommand: SANDBOX.EXECUTE_COMMAND,
  getProcessOutput: SANDBOX.GET_PROCESS_OUTPUT,
  killProcess: SANDBOX.KILL_PROCESS,
} as const satisfies typeof WORKSPACE_TOOL

const READ = new Set<string>([
  SAME_NAMES.readFile,
  SAME_NAMES.listFiles,
  SAME_NAMES.grep,
  SAME_NAMES.fileStat,
  BUILDER_TOOL.webSearch,
  BUILDER_TOOL.webFetch,
  BUILDER_TOOL.recall,
  ...SKILL_TOOLS,
])
// The controller's tools that talk to the person: the questions, the plan and the task list.
const TALK = new Set<string>([...Object.values(CARD_TOOLS), ...TASK_TOOLS])
const EDIT = new Set<string>([
  SAME_NAMES.writeFile,
  SAME_NAMES.editFile,
  SAME_NAMES.mkdir,
  SAME_NAMES.delete,
])
const EXECUTE = new Set<string>([
  SAME_NAMES.executeCommand,
  SAME_NAMES.getProcessOutput,
  SAME_NAMES.killProcess,
  BUILDER_TOOL.check,
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
