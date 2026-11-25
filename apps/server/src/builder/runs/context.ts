import type { CheckReport } from '@conexus/app/check'
import type {
  AppSessionToken,
  CompanyId,
  ConversationId,
  PersonId,
  PreviewData,
  ProjectId,
  RunId,
  VersionCheck,
} from '@conexus/hub-api'
import type { Mastra } from '@mastra/core/mastra'
import type { Workspace } from '@mastra/core/workspace'
import type {
  BrowserReport,
  ConferPlatformFailed,
  Machines,
  VersionFolder,
} from '../../harness/machine/public.ts'
import type { Conference } from '../../hub/apps/public.ts'
import type { Database } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import type { Result } from '../../platform/result.ts'
import type { GitCopy, Repository } from '../git/public.ts'

/**
 * Sends a turn's version to the Projeto's app as the person of the turn (step 14.1): whether it
 * reached the app, or nothing once the Projeto is gone.
 */
type BuilderSend = (input: {
  companyId: CompanyId
  projectId: ProjectId
  personId: PersonId
  runId: RunId
  number: number
  folder: VersionFolder
}) => Promise<PreviewData | undefined>

/**
 * Opens the Projeto's app for the check's browser as the person of the turn, with the version the
 * machine just built, and ends the session it gave once the browser is done.
 */
export type BuilderConfer = {
  open(input: {
    companyId: CompanyId
    projectId: ProjectId
    personId: PersonId
    folder: VersionFolder
  }): Promise<Result<Conference, ConferPlatformFailed>>
  end(input: { session: AppSessionToken }): Promise<void>
}

/**
 * What the check of a turn found: the machine's check failed (the browser never ran), the app did
 * not open for the browser, the Projeto has no address to open, or the browser saw the entry screen.
 */
export type BuilderCheck =
  | { kind: 'MACHINE_FAILED'; machine: CheckReport }
  | {
      kind: 'CONFERENCE_REFUSED'
      machine: CheckReport
      conference: Exclude<Conference, { kind: 'OPENED' | 'NO_ADDRESS' }>
    }
  | { kind: 'NO_ADDRESS'; machine: CheckReport }
  | { kind: 'SEEN'; machine: CheckReport; browser: BrowserReport }

export type RunsDeps = {
  database: Database
  machines: Machines
  /** The Projeto's repository on the server's volume (decision 0051). */
  repository: (ids: { companyId: CompanyId; projectId: ProjectId }) => Repository
  copy: GitCopy
  /** Every Projeto with a repository on the volume: where the bucket may be behind. */
  repositories: () => Promise<{ companyId: CompanyId; projectId: ProjectId }[]>
  log: FailureLog
  send: BuilderSend
  confer: BuilderConfer
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

/** What a round of the end of the turn is about: tasks left open, or the check of the app. */
export type RoundKind = 'open' | 'check'

/**
 * A settled turn: its outcome, how many times the end of the turn judged it, and whether its
 * version reached the app, when it was sent.
 */
export type Settled = Outcome & { rounds: number; preview?: PreviewData }

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
  /** How many times the end of the turn judged it, by what it judged: each has its own limit. */
  rounds: Record<RoundKind, number>
  /** A removal reached the run: nothing more of it is saved. */
  stopped: boolean
  /** What the run keeps open while it writes, let go when it ends. */
  ends: Array<() => void>
  /** The run's last check: the next waits for it, as they share the machine's network and browser and the Hub's test environment. */
  checking: Promise<unknown>
  /** The run's end in progress: its save and the machine let go. */
  saving: Promise<unknown> | undefined
}
