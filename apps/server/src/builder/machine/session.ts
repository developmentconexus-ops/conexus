import type { CompanyId, ConversationId, ProjectId } from '@conexus/hub-api'
import { Failure } from '../../platform/failure.ts'
import type { Conflicts, Kit } from './kit.ts'
import type { Phase } from './port.ts'
import type { SandboxExec } from './sandbox-filesystem/shell.ts'

export type Session = {
  companyId: CompanyId
  projectId: ProjectId
  conversationId: ConversationId
  onPhase: (phase: Phase) => void
  /** Built with the workspace: building it asks the provider nothing, and only its start finds the machine. */
  kit: Kit
  /** How many times the machine started in this turn: a second `created` is a machine that died. */
  starts: number
  /** The turn needed the machine: a session outlives its turns, so `ready` alone no longer says it. */
  used: boolean
  /** The turn's first use of a machine already up reads the markers again; every use waits for it. */
  refreshing: Promise<void> | undefined
  /** The machine died mid-turn, and what the turn wrote on it is gone. */
  lost: boolean
  /** What the start found of work not yet saved meeting a newer version, told to the model for the turn. */
  conflicts: Conflicts
  ready: Promise<Kit> | undefined
}

/** The Git's missing copy-backed repository, wherever Mastra's start wrapped it: it is no machine fault. */
export function restoreFailure(error: unknown): Failure | undefined {
  for (let at = error; at instanceof Error; at = at.cause) {
    if (at instanceof Failure && at.code === 'GIT_RESTORE_NEEDED') return at
  }
  return undefined
}

export async function within<T>(work: Promise<T>, ms: number): Promise<T> {
  const budget = AbortSignal.timeout(ms)
  return Promise.race([
    work,
    new Promise<never>((_, reject) =>
      budget.addEventListener('abort', () => reject(new Error('machine start timed out'))),
    ),
  ])
}

/**
 * The file tools' view of a machine: its commands, which wake it first (`ensure`), and its own file
 * API. The Builder's machines and the Assistant's both build their `SandboxFilesystem` on it.
 */
export function execIn(kit: Kit, ensure: () => Promise<unknown>): SandboxExec {
  const { sandbox } = kit
  return {
    id: sandbox.id,
    get filesystem() {
      return sandbox.filesystem
    },
    executeCommand: async (command, args, options) => {
      await ensure()
      const result = await sandbox.executeCommand?.(command, args, options)
      if (result === undefined) throw new Error('the machine cannot run commands')
      return result
    },
  }
}
