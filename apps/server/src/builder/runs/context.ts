import type {
  CompanyId,
  ConversationEvent,
  ConversationId,
  PersonId,
  ProjectId,
  RunId,
} from '@conexus/hub-api'
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
  /** How long a question waits for its answer; thirty minutes (card) unless a test shortens it. */
  questionMs?: () => number
  /** How often a turn's lease is renewed; every 30 seconds unless a test shortens it. */
  renewMs?: () => number
  /** How long a stopping copy waits for its turns before it lets go of their leases; 8 seconds unless a test shortens it. */
  yieldMs?: () => number
}

/** What a restart told the stream of the turn it ended: each event with its place in the run. */
export type Restart = {
  companyId: CompanyId
  personId: PersonId
  conversationId: ConversationId
  runId: RunId
  said: { n: number; event: ConversationEvent }[]
}

/** What the runs share: the ports and the rows. */
export type RunsContext = RunsDeps & {
  store: RunStore
  retry: { kick(): void }
  /** Lets go of a run this copy drives: its timers stop and its workspace is forgotten. */
  stopped(runId: RunId): Promise<void>
  /** Hands what a restart told a turn to its conversation, for its open streams and its thread. */
  restarted(restart: Restart): Promise<void>
}

/** A saved version: its number, the paths in its tree, and the paths the turn changed against its base. */
type SavedVersion = { number: number; changed: boolean; files: number; changedFiles: number }

/** How a turn that may write ended, for the person: a version, nothing, or why not. */
export type Outcome =
  | { kind: 'saved'; version: SavedVersion }
  | { kind: 'unchanged' }
  | {
      kind: 'failed'
      code: 'SAVE_REFUSED' | 'GIT_RESTORE_NEEDED' | 'MACHINE_LOST' | 'MACHINE_UNAVAILABLE'
    }
