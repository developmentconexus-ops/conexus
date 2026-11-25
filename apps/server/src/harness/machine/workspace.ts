import { WORKSPACE_TOOLS, Workspace } from '@mastra/core/workspace'
import { NEVER_ASKS } from '../spec/public.ts'
import type { Kit } from './kit.ts'
import type { SandboxFilesystem } from './sandbox-filesystem/filesystem.ts'

/** What differs between the workspaces of the machines the Hub makes; the rest is `workspaceOf`'s. */
type WorkspaceParts = {
  /** The provider's key to the machine. */
  name: string
  /** Wakes or creates the machine, once per session. */
  ensure(): Promise<Kit>
  /** What the model is told of the machine, read at every step. */
  instructions: () => string
  filesystem: SandboxFilesystem
  /**
   * The agents' controller asks for every tool without a rule of its own (step 24.5): the
   * Computador's never ask.
   */
  neverAsks: boolean
  /** The media types `read_file` hands the model as media; absent, Mastra's default. */
  readMedia?: readonly string[]
}

/** The one place a `Workspace` is made over a machine: the Builder's and the conversations'. */
export function workspaceOf(parts: WorkspaceParts): Workspace {
  return new Workspace({
    sandbox: async () => (await parts.ensure()).sandbox,
    sandboxCacheKey: () => parts.name,
    instructions: { dynamicSandbox: parts.instructions },
    filesystem: parts.filesystem,
    tools: {
      ...(parts.neverAsks ? { requireApproval: NEVER_ASKS } : {}),
      hooks: {
        beforeToolCall: async () => {
          await parts.ensure()
        },
      },
      [WORKSPACE_TOOLS.FILESYSTEM.AST_EDIT]: { enabled: false },
      [WORKSPACE_TOOLS.SANDBOX.EXECUTE_COMMAND]: { requireDescription: true },
      ...(parts.readMedia === undefined
        ? {}
        : { [WORKSPACE_TOOLS.FILESYSTEM.READ_FILE]: { mediaTypes: [...parts.readMedia] } }),
    },
  })
}
