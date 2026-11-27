import {
  ASSISTANT_TOOL,
  CONVERSATION_TOOL,
  MACHINE_TOOL,
  SKILL_TOOLS,
  SUBAGENT_TOOL,
  TASK_TOOLS,
  WORKSPACE_TOOL,
} from '@conexus/hub-api'
import { ASK_USER_TOOL } from '../../harness/spec/public.ts'
import { TOOLS_OF, TYPED_READ_NAMES, TYPED_READS } from '../../harness/tools/public.ts'
import { COMPANY_MEMORY_TOOLS } from './company-memory.ts'

/** The `ToolSearchProcessor`'s own tool, by the id Mastra gives it. */
const SEARCH_TOOLS = 'search_tools'
/** The memory's own tools, by the ids `@mastra/memory` gives them (`listTools`). */
const MEMORY_TOOLS = ['recall', 'updateWorkingMemory'] as const
/**
 * The closed set the mode offers the model (criterion 12), which the controller enforces; the
 * typed reads come only once a search loads them, and the controller's own tools it holds are
 * `ask_user`, the task list and one subagent type, `pesquisar` (`research.ts`).
 */
export const AVAILABLE_TOOLS: readonly string[] = [
  ...new Set([
    ...Object.values(WORKSPACE_TOOL),
    ...MEMORY_TOOLS,
    ...COMPANY_MEMORY_TOOLS,
    SEARCH_TOOLS,
    ...TOOLS_OF.assistant.filter((name) => name !== TYPED_READS),
    ...TYPED_READ_NAMES,
    ...Object.values(ASSISTANT_TOOL),
    MACHINE_TOOL.requestNetwork,
    CONVERSATION_TOOL.webFetch,
    CONVERSATION_TOOL.webSearch,
    ...SKILL_TOOLS,
    ASK_USER_TOOL,
    SUBAGENT_TOOL,
    ...TASK_TOOLS,
  ]),
]
