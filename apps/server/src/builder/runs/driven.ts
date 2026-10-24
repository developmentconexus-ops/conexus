import type { CompanyId, ProjectId, VersionCheck } from '@conexus/hub-api'
import type { Mastra } from '@mastra/core/mastra'
import type { Workspace } from '@mastra/core/workspace'
import type { Phase } from '../machine/public.ts'

/** Where Mastra keeps each workspace it resolved, to stop them all at its shutdown. */
export type Registry = Pick<Mastra, 'removeWorkspace'>

/** How a turn is stopped: `abort` as Parar does, `lost` once another copy took its lease. */
export type Stop = { abort: () => void; lost: () => void }

export function idleRun() {
  return {
    workspace: undefined,
    registry: undefined,
    onPhase: () => undefined,
    stopDeadline: () => undefined,
    stopWaiting: () => undefined,
    stopLease: () => undefined,
    waits: Promise.resolve(),
    lost: false,
    check: undefined,
    rounds: 0,
    resumed: false,
  }
}

/** A run this copy of the program drives: its Projeto, its timers and its workspace. */
export type Driven = {
  companyId: CompanyId
  projectId: ProjectId
  deadlineAt: Date
  workspace: Promise<Workspace> | undefined
  registry: Registry | undefined
  /** Where the machine's phases are told; the turn sets it, none until then. */
  onPhase: (phase: Phase) => void
  /** Ends the hour's timer; the lease goes on until the save is over. */
  stopDeadline: () => void
  /** Ends the question's clock, while the turn waits on an answer. */
  stopWaiting: () => void
  /** The `waiting` writes in flight, one after the other. */
  waits: Promise<void>
  stopLease: () => void
  lost: boolean
  /** What the end of the turn's check said last, for the version it saves. */
  check: VersionCheck | undefined
  /** How many times the end of the turn judged it, for the turn's line. */
  rounds: number
  /** The run came from another copy: its machine is woken as it stands, without the seed. */
  resumed: boolean
}
