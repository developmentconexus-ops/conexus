import type {
  FileContent,
  ReadOptions,
  Workspace,
  WorkspaceFilesystem,
} from '@mastra/core/workspace'
import { WORKSPACE_TOOLS } from '@mastra/core/workspace'

/**
 * A file tool's call as Mastra makes it: the workspace's `beforeToolCall` hook runs first and wakes
 * the machine, then the machine's own file API answers.
 */
export function fileTools(workspace: Workspace) {
  async function onTool<T>(call: (files: WorkspaceFilesystem) => Promise<T>): Promise<T> {
    await workspace.getToolsConfig()?.hooks?.beforeToolCall?.({
      toolName: WORKSPACE_TOOLS.FILESYSTEM.READ_FILE,
      workspaceToolName: WORKSPACE_TOOLS.FILESYSTEM.READ_FILE,
      input: {},
      context: {},
    })
    const { filesystem } = workspace
    if (filesystem === undefined) throw new Error('the workspace has no filesystem')
    return call(filesystem)
  }
  return {
    exists: (path: string) => onTool((files) => files.exists(path)),
    readFile: (path: string, options?: ReadOptions) =>
      onTool((files) => files.readFile(path, options)),
    writeFile: (path: string, content: FileContent) =>
      onTool((files) => files.writeFile(path, content)),
  }
}
