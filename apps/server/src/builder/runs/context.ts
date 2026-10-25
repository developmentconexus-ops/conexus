import type {
  CompanyId,
  ConversationId,
  PersonId,
  ProjectId,
  RunId,
  VersionCheck,
} from '@conexus/hub-api'
import type { Mastra } from '@mastra/core/mastra'
import type { Workspace } from '@mastra/core/workspace'
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
}

/** What the runs share: the ports and the copies' retry. */
export type RunsContext = RunsDeps & { retry: { kick(): void } }

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

/** Where Mastra keeps each workspace it resolved, to stop them all at its shutdown. */
export type Registry = Pick<Mastra, 'removeWorkspace'>

/** A conversation's machine as Mastra works in it, open until the conversation's run lets go. */
export type Opened = { workspace: Promise<Workspace>; registry: Registry | undefined }

/**
 * The run writing in its Projeto from this process, held by its conversation: taken as Mastra's run
 * reads its input, let go once the run's end saved it. One per Projeto (data D15), held only in
 * memory: a restart runs nothing, so none is held after it.
 */
export type Driven = {
  runId: RunId
  companyId: CompanyId
  projectId: ProjectId
  personId: PersonId
  conversationId: ConversationId
  /** What the end of the turn's check said last, for the version it saves. */
  check: VersionCheck | undefined
  /** How many times the end of the turn judged it, for the turn's line. */
  rounds: number
  /** A removal reached the run: nothing more of it is saved. */
  stopped: boolean
  /** What the run keeps open while it writes, let go when it ends. */
  ends: Array<() => void>
  /** The run's end in progress: its save and the machine let go. */
  saving: Promise<unknown> | undefined
}
