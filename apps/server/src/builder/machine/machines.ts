import type { CompanyId, ConversationId, ProjectId } from '@conexus/hub-api'
import { WORKSPACE_TOOLS, Workspace } from '@mastra/core/workspace'
import { Failure } from '../../platform/failure.ts'
import type { Sha } from '../git/public.ts'
import type { TimedExec } from './check.ts'
import { CHECK_PROGRAM, checkIn } from './check.ts'
import type { Conflicts, Kit } from './kit.ts'
import {
  APP_FOLDER,
  MARK,
  machineInstructions,
  NO_CONFLICTS,
  OUTPUT_MAX,
  readCapped,
} from './kit.ts'
import { packIn } from './pack.ts'
import type { Machines, MachinesDeps, Phase } from './port.ts'
import { SandboxFilesystem } from './sandbox-filesystem/filesystem.ts'
import type { SandboxExec } from './sandbox-filesystem/shell.ts'
import type { Collected } from './scripts.ts'
import {
  changedScript,
  collected,
  collectScript,
  conflictsOf,
  keepScript,
  outFile,
  seedFile,
  seedScript,
  syncScript,
} from './scripts.ts'

type Session = {
  companyId: CompanyId
  projectId: ProjectId
  conversationId: ConversationId
  onPhase: (phase: Phase) => void
  /** Built with the workspace: building it asks the provider nothing, and only its start finds the machine. */
  kit: Kit
  /** How many times the machine started in this turn: a second `created` is a machine that died. */
  starts: number
  /** The machine died mid-turn, and what the turn wrote on it is gone. */
  lost: boolean
  /** What the start found of work not yet saved meeting a newer version, told to the model for the turn. */
  conflicts: Conflicts
  ready: Promise<Kit> | undefined
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
  private readonly workdir: string
  private readonly tmp: string
  private readonly startMs: number
  private readonly sessions = new Map<ConversationId, Session>()

  constructor(deps: MachinesDeps) {
    this.deps = deps
    this.workdir = deps.workdir ?? APP_FOLDER
    this.tmp = deps.tmp ?? '/tmp'
    this.startMs = deps.startMs ?? 120_000
  }

  kill = (conversationId: ConversationId) => this.deps.api.kill(conversationId)

  /** Wakes or creates the machine, once per workspace; the seed ran in `onStart` before this returns. */
  private ensure(session: Session): Promise<Kit> {
    session.ready ??= this.boot(session)
    return session.ready
  }

  /**
   * Starts the conversation's machine: the provider finds it by name, or makes one (`onStart`). A
   * machine paused from another template, the one before a Release, is killed first, so the start
   * makes a new one from the Hub's template and seeds it as any new machine.
   */
  private async boot(session: Session): Promise<Kit> {
    session.onPhase('starting')
    const stale = this.deps.api.killStale(session.conversationId, this.deps.template)
    try {
      await within(
        stale.then(() => session.kit.sandbox.start?.()),
        this.startMs,
      )
    } catch (cause) {
      const restore = restoreFailure(cause)
      if (restore !== undefined) throw restore
      this.deps.log.error(
        { reason: 'START', cause: String(cause).slice(0, 500) },
        'MACHINE_UNAVAILABLE',
      )
      throw new Failure('MACHINE_UNAVAILABLE', { cause })
    }
    this.deps.log.info({ conversationId: session.conversationId }, 'MACHINE_STARTED')
    return session.kit
  }

  /** The Hub's `main` crosses as a bundle, for the seed or the sync. */
  private async sendMain(kit: Kit, session: Session) {
    const { onPhase, companyId, projectId } = session
    onPhase('copying')
    await kit.transport.write(seedFile(this.tmp), await this.deps.seedOf({ companyId, projectId }))
  }

  /** A new machine's app folder holds `main` as the Hub has it. */
  private async seed(kit: Kit, session: Session) {
    await this.sendMain(kit, session)
    await this.seedSent(kit, session)
  }

  private async seedSent(kit: Kit, session: Session) {
    const seeded = await run(kit, seedScript(this.workdir, this.tmp))
    if (seeded.exitCode !== 0) throw new Error(`seed failed: ${seeded.stderr.slice(-500)}`)
    this.conflicted(session, seeded.stdout)
  }

  /** The conflicts the start found, as the model reads them at every step of the turn. */
  private conflicted(session: Session, stdout: string) {
    session.conflicts = conflictsOf(stdout)
    const { markers, deleted, replaced, tooManyFiles, tooLarge } = session.conflicts
    const files = markers.length + deleted.length + replaced.length
    if (files > 0)
      this.deps.log.info({ conversationId: session.conversationId, files }, 'MACHINE_CONFLICTS')
    if (tooManyFiles || tooLarge)
      this.deps.log.info(
        { conversationId: session.conversationId, tooManyFiles, tooLarge },
        'MACHINE_UNSAVED_OVERSIZE',
      )
  }

  /**
   * A machine found again keeps its folder and brings `main` into it (Mastra's `onStart`: a
   * reconnect only checks once-per-machine setup). Work the Hub has not saved stays, merged
   * onto `main`; the files it conflicts in are told to the model. One whose seed never finished is
   * seeded. A sync that fails names its cause and fails the start: the folder is left as it was.
   */
  private async sync(kit: Kit, session: Session) {
    const { conversationId } = session
    await this.sendMain(kit, session)
    const synced = await run(kit, syncScript(this.workdir, this.tmp))
    if (synced.exitCode !== 0) {
      const cause = synced.stderr.slice(-500)
      this.deps.log.error({ conversationId, cause }, 'MACHINE_SYNC_FAILED')
      throw new Error(`sync failed: ${cause}`)
    }
    if (synced.stdout.split('\n').includes('UNSEEDED')) return this.seedSent(kit, session)
    this.conflicted(session, synced.stdout)
  }

  /** The files stay as they are; the repository must still be there. */
  private async keep(kit: Kit) {
    const kept = await run(kit, keepScript(this.workdir))
    if (kept.exitCode !== 0) throw new Error(`the kept tree is gone: ${kept.stderr.slice(-500)}`)
  }

  /**
   * What the machine holds once it is up. One found by name keeps its folder and brings `main` in.
   * A later start in the same turn is Mastra reconnecting a machine that paused or dropped
   * (`retryOnDead`): it keeps what the turn wrote. A new one is seeded; a second new one in the same
   * turn is a machine that died, and what the turn wrote on it is gone.
   */
  private async onStart(session: Session, outcome: string | undefined) {
    const { conversationId, kit } = session
    session.starts += 1
    if (outcome === 'connected') {
      await kit.closeNetwork()
      return session.starts === 1 ? this.sync(kit, session) : this.keep(kit)
    }
    if (session.starts > 1) {
      session.lost = true
      this.deps.log.error({ conversationId }, 'MACHINE_DIED')
    }
    await this.seed(kit, session)
  }

  /** The file tools' view of the machine: its commands, which wake it first, and its own file API. */
  private execIn(session: Session): SandboxExec {
    const { sandbox } = session.kit
    return {
      id: sandbox.id,
      get filesystem() {
        return sandbox.filesystem
      },
      executeCommand: async (command, args, options) => {
        await this.ensure(session)
        const result = await sandbox.executeCommand?.(command, args, options)
        if (result === undefined) throw new Error('the machine cannot run commands')
        return result
      },
    }
  }

  async workspaceFor(input: Parameters<Machines['workspaceFor']>[0]) {
    const { companyId, projectId, conversationId, onPhase } = input
    const name = `conexus-${this.deps.installation}-${conversationId}`
    const kit = this.deps.kit({
      id: name,
      metadata: {
        ...this.deps.mark,
        [MARK.company]: companyId,
        [MARK.project]: projectId,
        [MARK.conversation]: conversationId,
        [MARK.template]: this.deps.template,
      },
      workingDirectory: this.workdir,
      instructions: machineInstructions(this.workdir),
      onStart: ({ outcome }) => this.onStart(session, outcome),
    })
    const session: Session = {
      ...{ companyId, projectId, conversationId, onPhase, kit },
      ...{ starts: 0, lost: false, conflicts: NO_CONFLICTS, ready: undefined },
    }
    this.sessions.set(conversationId, session)
    return new Workspace({
      sandbox: async () => (await this.ensure(session)).sandbox,
      sandboxCacheKey: () => name,
      // Read at every step: the conflicts are known once a tool has started the machine.
      instructions: { dynamicSandbox: () => machineInstructions(this.workdir, session.conflicts) },
      filesystem: new SandboxFilesystem({
        id: `conexus-fs-${conversationId}`,
        sandbox: this.execIn(session),
        workdir: this.workdir,
      }),
      tools: {
        hooks: {
          beforeToolCall: async () => {
            await this.ensure(session)
          },
        },
        [WORKSPACE_TOOLS.FILESYSTEM.AST_EDIT]: { enabled: false },
      },
    })
  }

  async collect({ conversationId, base }: { conversationId: ConversationId; base: Sha }) {
    const session = this.sessions.get(conversationId)
    if (session?.ready === undefined) return 'unchanged'
    const kit = await this.ensure(session)
    if (session.lost) throw new Error('the machine died in the turn')
    session.onPhase('saving')
    const result = await run(kit, collectScript(this.workdir, this.tmp, base))
    if (result.exitCode !== 0) throw new Error(`collect failed: ${result.stderr.slice(-500)}`)
    const found: Collected = collected(result.stdout)
    if (found.kind !== 'bundle') return found.kind
    const bundle = await readCapped(kit.transport, outFile(this.tmp))
    if (bundle === 'too-large') return bundle
    return { bundle, files: found.files, changedFiles: found.changedFiles }
  }

  async check({ conversationId }: Parameters<Machines['check']>[0]) {
    const session = this.sessions.get(conversationId)
    if (session === undefined) return { ok: false, error: 'CHECK_PLATFORM_FAILED' } as const
    const kit = await this.ensure(session)
    const program = this.deps.checkProgram ?? CHECK_PROGRAM
    const exec: TimedExec = (script, timeoutMs) => run(kit, script, timeoutMs)
    return checkIn({ exec, program, workdir: this.workdir, log: this.deps.log })
  }

  /** A machine whose comparison fails is taken as changed: the check that follows says why it cannot run. */
  async changed({ conversationId }: { conversationId: ConversationId }) {
    const session = this.sessions.get(conversationId)
    if (session === undefined || !this.touched(conversationId)) return false
    const kit = await this.ensure(session)
    const result = await run(kit, changedScript(this.workdir))
    return result.exitCode !== 0 || result.stdout.trim() !== 'UNCHANGED'
  }

  async pack({ conversationId }: { conversationId: ConversationId }) {
    const session = this.sessions.get(conversationId)
    if (session === undefined) throw new Error('no turn holds the machine to pack')
    const kit = await this.ensure(session)
    return packIn((script) => run(kit, script), this.workdir)
  }

  touched(conversationId: ConversationId) {
    return this.sessions.get(conversationId)?.ready !== undefined
  }

  /**
   * The turn is over and the machine pauses with its folder as the turn left it: what the Hub did
   * not save stays for the next start to merge (no reference discards a session's unsaved work). A
   * start still running settles first; its failure was the turn's to hear.
   */
  async release(conversationId: ConversationId) {
    const session = this.sessions.get(conversationId)
    this.sessions.delete(conversationId)
    if (session?.ready === undefined) return
    await Promise.allSettled([session.ready])
    await session.kit.sandbox.stop?.()
  }
}

export function createMachines(deps: MachinesDeps): Machines {
  return new BuilderMachines(deps)
}
