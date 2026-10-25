import type { CheckReport } from '@conexus/app/check'
import type { CompanyId, ConversationId, MachinePhase, ProjectId } from '@conexus/hub-api'
import type { Workspace } from '@mastra/core/workspace'
import type { InstallationId } from '../../platform/config-machine.ts'
import type { FailureLog } from '../../platform/failure.ts'
import type { Result } from '../../platform/result.ts'
import type { Sha } from '../git/public.ts'
import type { CheckPlatformFailed } from './check.ts'
import type { KitFactory, MachineApi } from './kit.ts'
import type { PackRefused, VersionFolder } from './pack.ts'

/** What Ana is told while the machine gets ready or saves (card, the stream's `machine` part). */
export type Phase = MachinePhase

export type Machines = {
  /**
   * The workspace of one turn of the conversation: its machine, found by the conversation's name, is
   * not touched until a tool needs it, and starts from the Hub's `main`.
   */
  workspaceFor(input: {
    companyId: CompanyId
    projectId: ProjectId
    conversationId: ConversationId
    onPhase: (phase: Phase) => void
  }): Promise<Workspace>
  /**
   * One bundle of the whole tree on `base` with its file counts, or why there is none. A turn that
   * never needed the machine is `unchanged` without waking it; one whose machine died on the way
   * throws, for what it wrote is gone.
   */
  collect(input: {
    conversationId: ConversationId
    base: Sha
  }): Promise<Bundled | 'unchanged' | 'too-large'>
  /**
   * The check of the app folder (decision 0055). A machine that could not check is
   * `CHECK_PLATFORM_FAILED`.
   */
  check(input: {
    conversationId: ConversationId
  }): Promise<Result<CheckReport, CheckPlatformFailed>>
  /** Whether the turn changed the app folder from the `main` it started from; a machine the turn never woke did not. */
  changed(input: { conversationId: ConversationId }): Promise<boolean>
  /** The version the last passing check left in the machine, read as the send takes it. */
  pack(input: { conversationId: ConversationId }): Promise<Result<VersionFolder, PackRefused>>
  /** Whether the conversation's turn used the machine: then there may be something to collect. */
  touched(conversationId: ConversationId): boolean
  /** Ends the turn's use of the machine: it pauses. Safe to repeat. */
  release(conversationId: ConversationId): Promise<void>
  kill: MachineApi['kill']
}

/** A turn's tree as one bundle, with how many files the version holds and how many the turn changed. */
type Bundled = { bundle: Buffer; files: number; changedFiles: number }

export type MachinesDeps = {
  kit: KitFactory
  api: MachineApi
  /** The Git's `main` as a bundle, for the seed. */
  seedOf(input: { companyId: CompanyId; projectId: ProjectId }): Promise<Buffer>
  /** The mark every machine of this installation carries. */
  mark: Record<string, string>
  /** This installation's id, in every machine's name: Mastra attaches by name alone (S36). */
  installation: InstallationId
  log: FailureLog
  workdir?: string
  /** A folder the machine can write for the bundles that cross; `/tmp` on E2B. */
  tmp?: string
  /** The check program, `/opt/conexus/check` in the template. */
  checkProgram?: string
  /** The external budget of waking or creating a machine (code C57). */
  startMs?: number
}
