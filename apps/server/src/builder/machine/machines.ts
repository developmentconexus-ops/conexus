import type { CompanyId, ProjectId } from '@conexus/hub-api'
import { WORKSPACE_TOOLS, Workspace } from '@mastra/core/workspace'
import { eq } from 'drizzle-orm'
import type { Database } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import type { Sha } from '../git/public.ts'
import { MachineFilesystem } from './filesystem.ts'
import type { Kit, KitFactory, MachineApi } from './kit.ts'
import { SandboxId } from './kit.ts'
import { collected, collectScript, outFile, seedFile, seedScript, wakeScript } from './scripts.ts'
import { machine } from './tables.ts'

/** What Ana is told while the machine gets ready or saves (card, the stream's `machine` part). */
export type Phase = 'starting' | 'waking' | 'copying' | 'replaced' | 'resumed' | 'saving'

export type Machines = {
  /** The workspace of one turn: the machine is not touched until a tool needs it. */
  workspaceFor(input: {
    companyId: CompanyId
    projectId: ProjectId
    deadline: Date
    onPhase: (phase: Phase) => void
  }): Promise<Workspace>
  /**
   * One bundle of the whole tree on `base`, or why there is none. A turn that never needed the
   * machine is `unchanged` without waking it.
   */
  collect(input: { projectId: ProjectId; base: Sha }): Promise<Buffer | 'unchanged' | 'too-large'>
  /** Whether the Projeto's turn used the machine: only then is there anything to collect. */
  touched(projectId: ProjectId): boolean
  /** Ends the turn's use of the machine: it pauses and its last use is now. Safe to repeat. */
  release(projectId: ProjectId): Promise<void>
  list: MachineApi['list']
  kill: MachineApi['kill']
}

export type MachinesDeps = {
  database: Database
  kit: KitFactory
  api: MachineApi
  /** The Git's `main` as a bundle, for the seed. */
  seedOf(input: { companyId: CompanyId; projectId: ProjectId }): Promise<Buffer>
  /** The mark every machine of this installation carries. */
  mark: Record<string, string>
  log: FailureLog
  workdir?: string
  /** A folder the machine can write for the bundles that cross; `/tmp` on E2B. */
  tmp?: string
  /** The external budget of waking or creating a machine (code C57). */
  startMs?: number
}

type Session = {
  kit: Kit
  companyId: CompanyId
  projectId: ProjectId
  onPhase: (phase: Phase) => void
  /** Whether the Projeto had a machine when the turn began: it wakes, or starts. */
  known: boolean
  ready: Promise<void> | undefined
}

function isGone(error: unknown): boolean {
  return error instanceof Error && Reflect.get(error, 'code') === 'SANDBOX_REATTACH_FAILED'
}

async function within<T>(work: Promise<T>, ms: number): Promise<T> {
  const budget = AbortSignal.timeout(ms)
  return Promise.race([
    work,
    new Promise<never>((_, reject) =>
      budget.addEventListener('abort', () => reject(new Error('machine start timed out'))),
    ),
  ])
}

async function run(kit: Kit, script: string) {
  const result = await kit.sandbox.executeCommand?.('sh', ['-c', script])
  if (result === undefined) throw new Error('the machine cannot run commands')
  return result
}

class BuilderMachines implements Machines {
  private readonly deps: MachinesDeps
  private readonly workdir: string
  private readonly tmp: string
  private readonly startMs: number
  private readonly sessions = new Map<ProjectId, Session>()

  constructor(deps: MachinesDeps) {
    this.deps = deps
    this.workdir = deps.workdir ?? '/home/user/app'
    this.tmp = deps.tmp ?? '/tmp'
    this.startMs = deps.startMs ?? 120_000
  }

  list = () => this.deps.api.list()
  kill = (id: SandboxId) => this.deps.api.kill(id)

  private async known(companyId: CompanyId, projectId: ProjectId): Promise<SandboxId | undefined> {
    return this.deps.database.read({ kind: 'COMPANY', companyId, personId: null }, async (tx) => {
      const [row] = await tx
        .select({ sandboxId: machine.sandboxId })
        .from(machine)
        .where(eq(machine.projectId, projectId))
      return row === undefined ? undefined : SandboxId.parse(row.sandboxId)
    })
  }

  private async remember(session: Session, sandboxId: SandboxId) {
    const { companyId, projectId } = session
    const usedAt = new Date()
    await this.deps.database.command({ kind: 'COMPANY', companyId, personId: null }, (tx) =>
      tx
        .insert(machine)
        .values({ projectId, companyId, sandboxId, usedAt })
        .onConflictDoUpdate({ target: machine.projectId, set: { sandboxId, usedAt } }),
    )
  }

  /** Wakes or creates the machine, once per workspace; the seed ran in `onStart` before this returns. */
  private ensure(session: Session): Promise<void> {
    session.ready ??= this.boot(session)
    return session.ready
  }

  private async boot(session: Session) {
    session.onPhase(session.known ? 'waking' : 'starting')
    try {
      await within(session.kit.sandbox.start?.() ?? Promise.resolve(), this.startMs)
    } catch (cause) {
      this.deps.log.error({ reason: isGone(cause) ? 'GONE' : 'START' }, 'MACHINE_UNAVAILABLE')
      throw new Failure('MACHINE_UNAVAILABLE', { cause })
    }
    const id = session.kit.sandboxId()
    if (id !== undefined) await this.remember(session, id)
    this.deps.log.info({ projectId: session.projectId }, 'MACHINE_STARTED')
  }

  private async onStart(session: Session, wasKnown: boolean, outcome: string | undefined) {
    const { kit, onPhase, companyId, projectId } = session
    if (outcome === 'connected') {
      await kit.closeNetwork()
      await run(kit, wakeScript(this.workdir))
      return
    }
    if (wasKnown) {
      this.deps.log.info({ projectId }, 'MACHINE_REPLACED')
      onPhase('replaced')
    }
    onPhase('copying')
    await kit.transport.write(seedFile(this.tmp), await this.deps.seedOf({ companyId, projectId }))
    const seeded = await run(kit, seedScript(this.workdir, this.tmp))
    if (seeded.exitCode !== 0) throw new Error(`seed failed: ${seeded.stderr.slice(-500)}`)
  }

  async workspaceFor(input: Parameters<Machines['workspaceFor']>[0]) {
    const { companyId, projectId, onPhase } = input
    const sandboxId = await this.known(companyId, projectId)
    const holder: { session?: Session } = {}
    const kit = this.deps.kit({
      id: `conexus-${projectId}`,
      sandboxId,
      deadline: input.deadline,
      metadata: { ...this.deps.mark, conexus_company: companyId, conexus_project: projectId },
      onStart: async ({ outcome }) => {
        if (holder.session !== undefined)
          await this.onStart(holder.session, sandboxId !== undefined, outcome)
      },
    })
    const known = sandboxId !== undefined
    const session: Session = { kit, companyId, projectId, onPhase, known, ready: undefined }
    holder.session = session
    this.sessions.set(projectId, session)
    return new Workspace({
      sandbox: kit.sandbox,
      filesystem: new MachineFilesystem({
        id: `conexus-fs-${projectId}`,
        root: this.workdir,
        transport: kit.transport,
        exec: async (script) => {
          await this.ensure(session)
          return run(kit, script)
        },
      }),
      tools: {
        hooks: { beforeToolCall: () => this.ensure(session) },
        [WORKSPACE_TOOLS.FILESYSTEM.WRITE_FILE]: { requireReadBeforeWrite: true },
        [WORKSPACE_TOOLS.FILESYSTEM.EDIT_FILE]: { requireReadBeforeWrite: true },
        [WORKSPACE_TOOLS.FILESYSTEM.AST_EDIT]: { enabled: false },
      },
    })
  }

  async collect({ projectId, base }: { projectId: ProjectId; base: Sha }) {
    const session = this.sessions.get(projectId)
    if (session?.ready === undefined) return 'unchanged'
    await this.ensure(session)
    session.onPhase('saving')
    const result = await run(session.kit, collectScript(this.workdir, this.tmp, base))
    if (result.exitCode !== 0) throw new Error(`collect failed: ${result.stderr.slice(-500)}`)
    const outcome = collected(result.stdout)
    return outcome === 'bundle' ? session.kit.transport.read(outFile(this.tmp)) : outcome
  }

  touched(projectId: ProjectId) {
    return this.sessions.get(projectId)?.ready !== undefined
  }

  async release(projectId: ProjectId) {
    const session = this.sessions.get(projectId)
    this.sessions.delete(projectId)
    if (session?.ready === undefined) return
    const id = session.kit.sandboxId()
    await session.kit.sandbox.stop?.()
    if (id !== undefined) await this.remember(session, id)
  }
}

export function createMachines(deps: MachinesDeps): Machines {
  return new BuilderMachines(deps)
}
