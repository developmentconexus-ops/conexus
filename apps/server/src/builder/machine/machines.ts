import type { ConversationId } from '@conexus/hub-api'
import { WORKSPACE_TOOLS, Workspace } from '@mastra/core/workspace'
import { Failure } from '../../platform/failure.ts'
import type { Sha } from '../git/public.ts'
import type { TimedExec } from './check.ts'
import { CHECK_PROGRAM, checkIn } from './check.ts'
import type { Kit } from './kit.ts'
import {
  ALLOWED_HOSTS,
  APP_FOLDER,
  MARK,
  machineInstructions,
  NO_CONFLICTS,
  OUTPUT_MAX,
  readCapped,
} from './kit.ts'
import { packIn } from './pack.ts'
import type { Machines, MachinesDeps } from './port.ts'
import { SandboxFilesystem } from './sandbox-filesystem/filesystem.ts'
import type { Collected } from './scripts.ts'
import {
  changedScript,
  collected,
  collectScript,
  conflictsOf,
  markersScript,
  outFile,
  savedScript,
  seedFile,
  seedScript,
  syncScript,
} from './scripts.ts'
import type { Session } from './session.ts'
import { execIn, restoreFailure, within } from './session.ts'

class BuilderMachines implements Machines {
  private readonly deps: MachinesDeps
  private readonly workdir: string
  private readonly tmp: string
  private readonly startMs: number
  private readonly commandMs: number
  private readonly sessions = new Map<ConversationId, Session>()

  constructor(deps: MachinesDeps) {
    this.deps = deps
    this.workdir = deps.workdir ?? APP_FOLDER
    this.tmp = deps.tmp ?? '/tmp'
    this.startMs = deps.startMs ?? 120_000
    this.commandMs = deps.commandMs ?? 120_000
  }

  /** Every command the Hub runs in the machine has a budget, whatever the machine's own life: a stuck one must not hold the Projeto (code C57). */
  private async run(kit: Kit, script: string, timeoutMs: number = this.commandMs) {
    const result = await kit.sandbox.executeCommand?.('sh', ['-c', script], {
      maxRetainedBytes: OUTPUT_MAX,
      timeout: timeoutMs,
    })
    if (result === undefined) throw new Error('the machine cannot run commands')
    return result
  }

  /** The conversation is deleted: its session goes, and every machine it marked is killed. */
  kill = (conversationId: ConversationId) => {
    this.sessions.delete(conversationId)
    return this.deps.api.kill(conversationId)
  }

  /**
   * Wakes or creates the machine, once per session; the seed ran in `onStart` before this returns.
   * The first use of a turn on a machine already up reads again which files hold conflict markers:
   * the warning the model reads is of the tree as the turn finds it, not of the start that told it.
   */
  private async ensure(session: Session): Promise<Kit> {
    session.used = true
    if (session.ready === undefined) {
      const ready = this.boot(session)
      session.ready = ready
      session.markersRead = true
      // A start that failed is tried again by the next tool or turn, not kept rejected for good.
      ready.catch(() => {
        if (session.ready === ready) session.ready = undefined
      })
    } else if (!session.markersRead && session.refreshing === undefined) {
      const refreshing = this.refresh(session, session.ready)
      session.refreshing = refreshing
      // A read that failed is tried again by the next tool, like a start.
      refreshing.then(
        () => {
          session.markersRead = true
        },
        () => {
          if (session.refreshing === refreshing) session.refreshing = undefined
        },
      )
    }
    const kit = await session.ready
    await session.refreshing
    return kit
  }

  /** A start that ran meanwhile (a resume) told the conflicts itself, and its word is the later one. */
  private async refresh(session: Session, ready: Promise<Kit>) {
    const kit = await ready
    const result = await this.run(kit, markersScript(this.workdir))
    if (result.exitCode !== 0) throw new Error(`markers not read: ${result.stderr.slice(-500)}`)
    if (session.starts === 0) session.conflicts = conflictsOf(result.stdout)
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
    const seeded = await this.run(kit, seedScript(this.workdir, this.tmp))
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
    const synced = await this.run(kit, syncScript(this.workdir, this.tmp))
    if (synced.exitCode !== 0) {
      const cause = synced.stderr.slice(-500)
      this.deps.log.error({ conversationId, cause }, 'MACHINE_SYNC_FAILED')
      throw new Error(`sync failed: ${cause}`)
    }
    if (synced.stdout.split('\n').includes('UNSEEDED')) return this.seedSent(kit, session)
    this.conflicted(session, synced.stdout)
  }

  /**
   * What the machine holds once it is up, at every start Mastra's `onStart` hook runs: one found by
   * name, or one E2B paused that a tool resumed (`retryOnDead`), keeps its folder and brings `main`
   * in, with the work the Hub has not saved kept on it. A new one is seeded; a second new one in the
   * same turn is a machine that died, and what the turn wrote on it is gone.
   */
  private async onStart(session: Session, outcome: string | undefined) {
    const { conversationId, kit } = session
    session.starts += 1
    if (outcome === 'connected') {
      await kit.closeNetwork()
      return this.sync(kit, session)
    }
    if (session.starts > 1) {
      session.lost = true
      this.deps.log.error({ conversationId }, 'MACHINE_DIED')
    }
    await this.seed(kit, session)
  }

  /** The conversation's machine, built and not touched: building it asks the provider nothing. */
  private open(input: Parameters<Machines['workspaceFor']>[0], name: string): Session {
    const { companyId, projectId, conversationId, onPhase } = input
    const kit = this.deps.kit({
      id: name,
      allowOut: ALLOWED_HOSTS,
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
      ...{
        starts: 0,
        used: false,
        markersRead: false,
        refreshing: undefined,
        lost: false,
        conflicts: NO_CONFLICTS,
        ready: undefined,
      },
    }
    return session
  }

  async workspaceFor(input: Parameters<Machines['workspaceFor']>[0]) {
    const { companyId, projectId, conversationId, onPhase } = input
    const name = `conexus-${this.deps.installation}-${conversationId}`
    const session = this.sessions.get(conversationId) ?? this.open(input, name)
    // A turn takes the conversation's machine over with its own phases; the work it counts starts from nothing.
    Object.assign(session, {
      ...{ companyId, projectId, onPhase },
      ...{ starts: 0, used: false, markersRead: false, refreshing: undefined, lost: false },
    })
    this.sessions.set(conversationId, session)
    return new Workspace({
      sandbox: async () => (await this.ensure(session)).sandbox,
      sandboxCacheKey: () => name,
      // Read at every step: the conflicts are known once a tool has started the machine.
      instructions: { dynamicSandbox: () => machineInstructions(this.workdir, session.conflicts) },
      filesystem: new SandboxFilesystem({
        id: `conexus-fs-${conversationId}`,
        sandbox: execIn(session.kit, () => this.ensure(session)),
        workdir: this.workdir,
      }),
      tools: {
        hooks: {
          beforeToolCall: async () => {
            await this.ensure(session)
          },
        },
        [WORKSPACE_TOOLS.FILESYSTEM.AST_EDIT]: { enabled: false },
        [WORKSPACE_TOOLS.SANDBOX.EXECUTE_COMMAND]: { requireDescription: true },
      },
    })
  }

  async collect({ conversationId, base }: { conversationId: ConversationId; base: Sha }) {
    const session = this.sessions.get(conversationId)
    if (session?.used !== true) return 'unchanged'
    const kit = await this.ensure(session)
    if (session.lost) throw new Failure('MACHINE_LOST')
    session.onPhase('saving')
    const result = await this.run(kit, collectScript(this.workdir, this.tmp, base))
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
    const exec: TimedExec = (script, timeoutMs) => this.run(kit, script, timeoutMs)
    return checkIn({ exec, program, workdir: this.workdir, log: this.deps.log })
  }

  async saved({ conversationId, version }: Parameters<Machines['saved']>[0]) {
    const session = this.sessions.get(conversationId)
    if (session === undefined) throw new Error('no turn holds the machine that saved')
    const kit = await this.ensure(session)
    const moved = await this.run(kit, savedScript(this.workdir, version))
    if (moved.exitCode !== 0) throw new Error(`base not moved: ${moved.stderr.slice(-500)}`)
  }

  /** A machine whose comparison fails is taken as changed: the check that follows says why it cannot run. */
  async changed({ conversationId }: { conversationId: ConversationId }) {
    const session = this.sessions.get(conversationId)
    if (session === undefined || !this.touched(conversationId)) return false
    const kit = await this.ensure(session)
    const result = await this.run(kit, changedScript(this.workdir))
    return result.exitCode !== 0 || result.stdout.trim() !== 'UNCHANGED'
  }

  async pack({ conversationId }: { conversationId: ConversationId }) {
    const session = this.sessions.get(conversationId)
    if (session === undefined) throw new Error('no turn holds the machine to pack')
    const kit = await this.ensure(session)
    return packIn((script) => this.run(kit, script), this.workdir)
  }

  touched(conversationId: ConversationId) {
    return this.sessions.get(conversationId)?.used === true
  }

  /**
   * The turn is over: the session stays, as the Factory keeps a session's machine, and nothing is
   * stopped. E2B pauses the machine on its own timeout (`machine/e2b.ts`), with its folder as the
   * turn left it, and the next tool resumes it. A start still running settles first; its failure
   * was the turn's to hear.
   */
  async release(conversationId: ConversationId) {
    const ready = this.sessions.get(conversationId)?.ready
    if (ready !== undefined) await Promise.allSettled([ready])
  }
}

export function createMachines(deps: MachinesDeps): Machines {
  return new BuilderMachines(deps)
}
