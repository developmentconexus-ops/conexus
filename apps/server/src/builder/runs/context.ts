import type { CompanyId, PersonId, ProjectId, VersionCheck } from '@conexus/hub-api'
import type { Database } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import type { GitCopy, Repository } from '../git/public.ts'
import type { Machines } from '../machine/public.ts'

export type RunsDeps = {
  database: Database
  machines: Machines
  /** The Projeto's repository on the server's volume (decision 0051). */
  repository: (ids: { companyId: CompanyId; projectId: ProjectId }) => Repository
  copy: GitCopy
  /** Every Projeto with a repository on the volume: where the bucket may be behind. */
  repositories: () => Promise<{ companyId: CompanyId; projectId: ProjectId }[]>
  log: FailureLog
  /** How long a turn may run; an hour (card, limits) unless a test shortens it. */
  turnMs?: () => number
}

/** What the runs share: the ports and the Projetos written now. */
export type RunsContext = RunsDeps & {
  retry: { kick(): void }
  /** Whether a run of this process writes in the Projeto now. */
  writing(projectId: ProjectId): boolean
  /** Lets go of the runs a removal reaches: their timers stop, their workspace is forgotten, and nothing of them is saved. */
  stopWriting(scope: {
    companyId: CompanyId
    projectId?: ProjectId
    personId?: PersonId
  }): Promise<void>
}

/**
 * A saved version: its number, the paths in its tree, the paths the turn changed against its base,
 * and what the end of the turn's check said, when it gave a verdict.
 */
type SavedVersion = {
  number: number
  changed: boolean
  files: number
  changedFiles: number
  check?: VersionCheck
}

/** How a turn that may write ended, for the person: a version, nothing, or why not. */
export type Outcome =
  | { kind: 'saved'; version: SavedVersion }
  | { kind: 'unchanged' }
  | {
      kind: 'failed'
      code: 'SAVE_REFUSED' | 'GIT_RESTORE_NEEDED' | 'MACHINE_LOST' | 'MACHINE_UNAVAILABLE'
    }

/** A settled turn: its outcome, and how many times the end of the turn judged it. */
export type Settled = Outcome & { rounds: number }
