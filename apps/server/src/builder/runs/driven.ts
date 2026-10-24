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

/** Where Mastra keeps each workspace it resolved, to stop them all at its shutdown. */
export type Registry = Pick<Mastra, 'removeWorkspace'>

/** A Projeto's machine as Mastra works in it, open until the run that holds the Projeto lets go. */
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
