import type { CompanyId, ProjectId, RunId } from '@conexus/hub-api'
import type { Database } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import type { GitCopy, Repository } from '../git/public.ts'
import type { Machines } from '../machine/public.ts'
import type { RunStore } from './store.ts'

export type RunsDeps = {
  database: Database
  machines: Machines
  /** The Projeto's repository on the server's volume (decision 0051). */
  repository: (ids: { companyId: CompanyId; projectId: ProjectId }) => Repository
  copy: GitCopy
  log: FailureLog
  /** How long a turn may run; an hour (card, limits) unless a test shortens it. */
  turnMs?: () => number
}

/** What the runs share: the ports and the rows. */
export type RunsContext = RunsDeps & {
  store: RunStore
  retry: { kick(): void }
  /** Lets go of a run this copy drives: its timers stop and its workspace is forgotten. */
  stopped(runId: RunId): Promise<void>
}

/** A saved version: its number, the paths in its tree, and the paths the turn changed against its base. */
export type SavedVersion = { number: number; changed: boolean; files: number; changedFiles: number }

/** How a turn that may write ended, for the person: a version, nothing, or why not. */
export type Outcome =
  | { kind: 'saved'; version: SavedVersion }
  | { kind: 'unchanged' }
  | { kind: 'failed'; code: 'SAVE_REFUSED' | 'MACHINE_LOST' }
