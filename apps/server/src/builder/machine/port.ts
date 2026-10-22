import type { CheckReport, PackageGrant } from '@conexus/app/check'
import type { CompanyId, ProjectId } from '@conexus/hub-api'
import type { Workspace } from '@mastra/core/workspace'
import type { InstallationId } from '../../platform/config-machine.ts'
import type { Database } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import type { Result } from '../../platform/result.ts'
import type { Sha } from '../git/public.ts'
import type { CheckPlatformFailed } from './check.ts'
import type { KitFactory, MachineApi, SandboxId } from './kit.ts'
import type { PackRefused, VersionFolder } from './pack.ts'

/** What Ana is told while the machine gets ready or saves (card, the stream's `machine` part). */
export type Phase = 'starting' | 'waking' | 'copying' | 'replaced' | 'saving'

export type Machines = {
  /**
   * The workspace of one turn: the machine is not touched until a tool needs it. A turn whose copy
   * of the program died (`resumed`) keeps the files the machine holds, to be saved; any other starts
   * from the Hub's `main`.
   */
  workspaceFor(input: {
    companyId: CompanyId
    projectId: ProjectId
    deadline: Date
    resumed?: boolean
    onPhase: (phase: Phase) => void
  }): Promise<Workspace>
  /**
   * One bundle of the whole tree on `base` with its file counts, or why there is none. A turn that
   * never needed the machine is `unchanged` without waking it; one whose machine died on the way
   * throws, for what it wrote is gone.
   */
  collect(input: { projectId: ProjectId; base: Sha }): Promise<Bundled | 'unchanged' | 'too-large'>
  /**
   * The check of the app folder (decision 0055), with the Projeto's grants; the starter's packages
   * are approved by the program itself. A machine that could not check is `CHECK_PLATFORM_FAILED`.
   */
  check(input: {
    projectId: ProjectId
    grants: readonly PackageGrant[]
  }): Promise<Result<CheckReport, CheckPlatformFailed>>
  /** Whether the turn changed the app folder from the `main` it started from; a machine the turn never woke did not. */
  changed(input: { projectId: ProjectId }): Promise<boolean>
  /** The version the last passing check left in the machine, read as the send takes it. */
  pack(input: { projectId: ProjectId }): Promise<Result<VersionFolder, PackRefused>>
  /** Whether the Projeto's turn used the machine, or its copy of the program died: then there may be something to collect. */
  touched(projectId: ProjectId): boolean
  /** Ends the turn's use of the machine: it pauses and its last use is now. Safe to repeat. */
  release(projectId: ProjectId): Promise<void>
  /** Forgets the turn's use of the machine without touching it: another copy of the program drives it now. */
  drop(projectId: ProjectId): void
  list: MachineApi['list']
  kill: MachineApi['kill']
  /** The Projeto's machine as recorded: its id and the last turn that used it. */
  rowOf(
    companyId: CompanyId,
    projectId: ProjectId,
  ): Promise<{ sandboxId: SandboxId; usedAt: Date } | undefined>
  /** Forgets the Projeto's machine record. */
  forget(companyId: CompanyId, projectId: ProjectId): Promise<void>
  /** The company's Projetos that have a machine recorded. */
  projectsOf(companyId: CompanyId): Promise<ProjectId[]>
}

/** A turn's tree as one bundle, with how many files the version holds and how many the turn changed. */
type Bundled = { bundle: Buffer; files: number; changedFiles: number }

export type MachinesDeps = {
  database: Database
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
