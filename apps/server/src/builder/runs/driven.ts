import type { CompanyId, PersonId, ProjectId, RunId, VersionCheck } from '@conexus/hub-api'
import type { Mastra } from '@mastra/core/mastra'
import type { Workspace } from '@mastra/core/workspace'
import type { Phase } from '../machine/public.ts'

/** Where Mastra keeps each workspace it resolved, to stop them all at its shutdown. */
export type Registry = Pick<Mastra, 'removeWorkspace'>

/**
 * A run writing in its Projeto from this process: opened by the person's message or answer, closed
 * when Mastra's run ends, a question included. One per Projeto (data D15), held only in memory: a
 * restart runs nothing, so none is held after it.
 */
export type Driven = {
  runId: RunId
  companyId: CompanyId
  projectId: ProjectId
  personId: PersonId
  deadlineAt: Date
  workspace: Promise<Workspace> | undefined
  registry: Registry | undefined
  /** Where the machine's phases are told; the turn sets it, none until then. */
  onPhase: (phase: Phase) => void
  /** Ends the hour's timer. */
  stopDeadline: () => void
  /** What the end of the turn's check said last, for the version it saves. */
  check: VersionCheck | undefined
  /** How many times the end of the turn judged it, for the turn's line. */
  rounds: number
  /** A removal reached the run: nothing more of it is saved. */
  stopped: boolean
}
