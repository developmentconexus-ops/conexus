import type { CompanyId, ProjectId } from '@conexus/hub-api'
import { WORKSPACE_TOOLS, Workspace } from '@mastra/core/workspace'
import { Failure } from '../../platform/failure.ts'
import type { Sha } from '../git/public.ts'
import type { TimedExec } from './check.ts'
import { CHECK_PROGRAM, checkIn } from './check.ts'
import { MachineFilesystem } from './filesystem.ts'
import type { Kit, SandboxId } from './kit.ts'
import { APP_FOLDER, MARK, OUTPUT_MAX, readCapped } from './kit.ts'
import { packIn } from './pack.ts'
import type { Machines, MachinesDeps, Phase } from './port.ts'
import { MachineRows } from './rows.ts'
import type { Collected } from './scripts.ts'
import { collected, collectScript, keepScript, outFile, seedFile, seedScript } from './scripts.ts'

type Session = {
  kit: Kit
  companyId: CompanyId
  projectId: ProjectId
  onPhase: (phase: Phase) => void
  /** Whether the Projeto had a machine recorded when the turn began: it wakes, or starts. */
  known: boolean
  /** The recorded machine is gone from the provider: the turn starts a new one from `main`. */
  replaced: boolean
  /** A turn whose copy of the program died: the machine's files are kept as they are. */
  resumed: boolean
  /** How many times the machine started in this turn: a second `created` is a machine that died. */
  starts: number
  /** The machine died mid-turn, and what the turn wrote on it is gone. */
  lost: boolean
  ready: Promise<void> | undefined
}

function isGone(error: unknown): boolean {
  return error instanceof Error && Reflect.get(error, 'code') === 'SANDBOX_REATTACH_FAILED'
}

/** The Git's missing copy-backed repository, wherever Mastra's start wrapped it: it is no machine fault. */
function restoreFailure(error: unknown): Failure | undefined {
  for (let at = error; at instanceof Error; at = at.cause) {
    if (at instanceof Failure && at.code === 'GIT_RESTORE_NEEDED') return at
  }
  return undefined
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

async function run(kit: Kit, script: string, timeoutMs?: number) {
  const result = await kit.sandbox.executeCommand?.('sh', ['-c', script], {
    maxRetainedBytes: OUTPUT_MAX,
    ...(timeoutMs === undefined ? {} : { timeout: timeoutMs }),
  })
  if (result === undefined) throw new Error('the machine cannot run commands')
  return result
}

class BuilderMachines implements Machines {
  private readonly deps: MachinesDeps
  private readonly rows: MachineRows
  private readonly workdir: string
  private readonly tmp: string
  private readonly startMs: number
  private readonly sessions = new Map<ProjectId, Session>()

  constructor(deps: MachinesDeps) {
    this.deps = deps
    this.rows = new MachineRows(deps.database)
    this.workdir = deps.workdir ?? APP_FOLDER
    this.tmp = deps.tmp ?? '/tmp'
    this.startMs = deps.startMs ?? 120_000
  }

  list = () => this.deps.api.list()
  kill = (id: SandboxId) => this.deps.api.kill(id)
  rowOf = (companyId: CompanyId, projectId: ProjectId) => this.rows.of(companyId, projectId)
  forget = (companyId: CompanyId, projectId: ProjectId) => this.rows.forget(companyId, projectId)
  projectsOf = (companyId: CompanyId) => this.rows.projectsOf(companyId)

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
      const restore = restoreFailure(cause)
      if (restore !== undefined) throw restore
      this.deps.log.error({ reason: isGone(cause) ? 'GONE' : 'START' }, 'MACHINE_UNAVAILABLE')
      throw new Failure('MACHINE_UNAVAILABLE', { cause })
    }
    const { companyId, projectId } = session
    const sandboxId = session.kit.sandboxId()
    if (sandboxId !== undefined) await this.rows.remember({ companyId, projectId, sandboxId })
    this.deps.log.info({ projectId }, 'MACHINE_STARTED')
  }

  /** The app folder holds `main` as the Hub has it: its bundle crosses, then the seed script runs. */
  private async seed(session: Session) {
    const { kit, onPhase, companyId, projectId } = session
    onPhase('copying')
    await kit.transport.write(seedFile(this.tmp), await this.deps.seedOf({ companyId, projectId }))
    const seeded = await run(kit, seedScript(this.workdir, this.tmp))
    if (seeded.exitCode !== 0) throw new Error(`seed failed: ${seeded.stderr.slice(-500)}`)
  }

  /**
   * What the machine holds once it is up. A woken one goes back to the Hub's `main`, unless the turn's
   * copy of the program died, which keeps its files. A later start in the same turn is Mastra
   * reconnecting a machine that paused or dropped (`retryOnDead`): it keeps what the turn wrote. A new
   * one is seeded; a second new one in the same turn is a machine that died, and what the turn wrote
   * on it is gone.
   */
  private async onStart(session: Session, outcome: string | undefined) {
    const { kit, onPhase, projectId } = session
    session.starts += 1
    if (outcome === 'connected') {
      await kit.closeNetwork()
      if (!session.resumed && session.starts === 1) return this.seed(session)
      const kept = await run(kit, keepScript(this.workdir))
      if (kept.exitCode !== 0) throw new Error(`the kept tree is gone: ${kept.stderr.slice(-500)}`)
      return
    }
    if (session.starts > 1) {
      session.lost = true
      this.deps.log.error({ projectId }, 'MACHINE_DIED')
    } else if (session.replaced) {
      this.deps.log.info({ projectId }, 'MACHINE_REPLACED')
      onPhase('replaced')
    }
    await this.seed(session)
  }

  /** Whether the provider still holds the recorded machine for this name; a provider that does not answer in time is `MACHINE_UNAVAILABLE`. */
  private async alive(id: SandboxId, name: string): Promise<boolean> {
    try {
      return await within(this.deps.api.holds(id, name), this.startMs)
    } catch (cause) {
      this.deps.log.error({ reason: 'START' }, 'MACHINE_UNAVAILABLE')
      throw new Failure('MACHINE_UNAVAILABLE', { cause })
    }
  }

  async workspaceFor(input: Parameters<Machines['workspaceFor']>[0]) {
    const { companyId, projectId, onPhase } = input
    const recorded = (await this.rows.of(companyId, projectId))?.sandboxId
    const name = `conexus-${this.deps.installation}-${companyId}-${projectId}`
    const gone = recorded !== undefined && !(await this.alive(recorded, name))
    const sandboxId = gone ? undefined : recorded
    const holder: { session?: Session } = {}
    const kit = this.deps.kit({
      id: name,
      sandboxId,
      deadline: input.deadline,
      metadata: { ...this.deps.mark, [MARK.company]: companyId, [MARK.project]: projectId },
      onStart: async ({ outcome }) => {
        if (holder.session !== undefined) await this.onStart(holder.session, outcome)
      },
    })
    const session: Session = {
      ...{ kit, companyId, projectId, onPhase },
      ...{ known: recorded !== undefined, replaced: gone, resumed: input.resumed === true },
      ...{ starts: 0, lost: false, ready: undefined },
    }
    holder.session = session
    this.sessions.set(projectId, session)
    return new Workspace({
      sandbox: kit.sandbox,
      filesystem: new MachineFilesystem({
        id: `conexus-fs-${projectId}`,
        root: this.workdir,
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
    if (session === undefined || (session.ready === undefined && !session.resumed)) {
      return 'unchanged'
    }
    await this.ensure(session)
    if (session.lost) throw new Error('the machine died in the turn')
    session.onPhase('saving')
    const result = await run(session.kit, collectScript(this.workdir, this.tmp, base))
    if (result.exitCode !== 0) throw new Error(`collect failed: ${result.stderr.slice(-500)}`)
    const found: Collected = collected(result.stdout)
    if (found.kind !== 'bundle') return found.kind
    const bundle = await readCapped(session.kit.transport, outFile(this.tmp))
    if (bundle === 'too-large') return bundle
    return { bundle, files: found.files, changedFiles: found.changedFiles }
  }

  async check({ projectId, grants }: Parameters<Machines['check']>[0]) {
    const session = this.sessions.get(projectId)
    if (session === undefined) return { ok: false, error: 'CHECK_PLATFORM_FAILED' } as const
    await this.ensure(session)
    const program = this.deps.checkProgram ?? CHECK_PROGRAM
    const exec: TimedExec = (script, timeoutMs) => run(session.kit, script, timeoutMs)
    return checkIn({ exec, program, workdir: this.workdir, grants, log: this.deps.log })
  }

  async pack({ projectId }: { projectId: ProjectId }) {
    const session = this.sessions.get(projectId)
    if (session === undefined) throw new Error('no turn holds the machine to pack')
    await this.ensure(session)
    return packIn((script) => run(session.kit, script), this.workdir)
  }

  touched(projectId: ProjectId) {
    const session = this.sessions.get(projectId)
    return session !== undefined && (session.ready !== undefined || session.resumed)
  }

  async release(projectId: ProjectId) {
    const session = this.sessions.get(projectId)
    this.sessions.delete(projectId)
    if (session?.ready === undefined) return
    const id = session.kit.sandboxId()
    await session.kit.sandbox.stop?.()
    if (id !== undefined) {
      await this.rows.remember({ companyId: session.companyId, projectId, sandboxId: id })
    }
  }

  drop(projectId: ProjectId) {
    this.sessions.delete(projectId)
  }
}

export function createMachines(deps: MachinesDeps): Machines {
  return new BuilderMachines(deps)
}
