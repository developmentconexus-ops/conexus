import type {
  FileContent,
  ReadOptions,
  Workspace,
  WorkspaceFilesystem,
} from '@mastra/core/workspace'
import { WORKSPACE_TOOLS } from '@mastra/core/workspace'

type FileTool =
  | typeof WORKSPACE_TOOLS.FILESYSTEM.FILE_STAT
  | typeof WORKSPACE_TOOLS.FILESYSTEM.READ_FILE
  | typeof WORKSPACE_TOOLS.FILESYSTEM.WRITE_FILE

/**
 * A file tool's call as Mastra makes it: the workspace's `beforeToolCall` hook runs first, with the
 * tool's name, and wakes the machine; then the machine's own file API answers (`wrapWithToolHooks`,
 * `@mastra/core` 1.83.0 `dist/workspace-BAqspXXH.js:8852-8863`).
 */
export function fileTools(workspace: Workspace) {
  async function onTool<T>(
    tool: FileTool,
    call: (files: WorkspaceFilesystem) => Promise<T>,
  ): Promise<T> {
    await workspace.getToolsConfig()?.hooks?.beforeToolCall?.({
      toolName: tool,
      workspaceToolName: tool,
      input: {},
      context: {},
    })
    const { filesystem } = workspace
    if (filesystem === undefined) throw new Error('the workspace has no filesystem')
    return call(filesystem)
  }
  return {
    exists: (path: string) =>
      onTool(WORKSPACE_TOOLS.FILESYSTEM.FILE_STAT, (files) => files.exists(path)),
    readFile: (path: string, options?: ReadOptions) =>
      onTool(WORKSPACE_TOOLS.FILESYSTEM.READ_FILE, (files) => files.readFile(path, options)),
    writeFile: (path: string, content: FileContent) =>
      onTool(WORKSPACE_TOOLS.FILESYSTEM.WRITE_FILE, (files) => files.writeFile(path, content)),
  }
}
