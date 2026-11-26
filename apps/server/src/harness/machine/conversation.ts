import type { ConversationId } from '@conexus/hub-api'
import { CompanyId } from '@conexus/hub-api'
import type { RequestContext } from '@mastra/core/request-context'
import type { CodeModeTransport } from '@mastra/core/tools'
import type { Workspace, WorkspaceFilesystem } from '@mastra/core/workspace'
import { z } from 'zod'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure, logFailure } from '../../platform/failure.ts'
import { controllerIn } from '../memory/public.ts'
import { locate } from './conversation-file.ts'
import { MAX_BYTES } from './git-facts.ts'
import type { ConversationMachine, Kit } from './kit.ts'
import { MARK, readCapped } from './kit.ts'
import { createLanes } from './lanes.ts'
import type { NetworkedSession } from './network.ts'
import { isNetworkNotApplied, machineNetwork, networkNotApplied } from './network.ts'
import type { Phase } from './port.ts'
import { SandboxFilesystem } from './sandbox-filesystem/filesystem.ts'
import { execIn, within } from './session.ts'
import type { MachineSpec } from './spec.ts'
import { workspaceOf } from './workspace.ts'

/** Where the conversation's files live on its machine, made at the machine's start. */
const WORK_FOLDER = '/home/user/work'

/** The template's own folder of packages (`infra/e2b/template.ts`, `OPT`). */
const TOOLCHAIN = '/opt/conexus'

const START_MS = 120_000
const MKDIR_FAILED = 'the conversation folder could not be made'

/** What a start that must reattach a machine found by its id throws when E2B no longer has it. */
const ReattachFailed = z.object({ code: z.literal('SANDBOX_REATTACH_FAILED') })

type FileRead =
  | { kind: 'OK'; bytes: Buffer }
  | {
      kind: 'FILE_NOT_FOUND' | 'FILE_TOO_LARGE' | 'FILE_GONE' | 'MACHINE_UNAVAILABLE' | 'CANCELLED'
    }

/**
 * The conversations' machines, of the Assistant and of whoever else opens one in a conversation:
 * the Builder's kit without the app's seed, Git, check or pack. One owner (code C26) for start,
 * stop, kill and read.
 */
export type ConversationMachines = {
  /** Where the conversation's files are on its machine. */
  readonly folder: string
  /** Where the template keeps the packages of the tools the Hub runs there (TypeScript, esbuild, Biome). */
  readonly toolchain: string
  /** How an agent's program runs in the machine (step 24.4, U5). */
  readonly codeMode: CodeModeTransport
  /** The controller's workspace resolver; undefined outside a conversation, as the Builder's. */
  workspace(requestContext: RequestContext): Promise<Workspace | undefined>
  /**
   * The Hub ends: every machine a turn held pauses, each failure logged and a machine never started
   * left alone. A turn's end stops nothing: E2B pauses the machine on its own timeout.
   */
  stopAll(): Promise<void>
  /** The conversation is deleted: every machine it marked is killed (`MachineApi.kill`). */
  kill(conversationId: ConversationId): Promise<void>
  /**
   * Applies the conversation's two lists to its running machine now; false when that failed. True
   * also when no machine runs: its next start applies them.
   */
  reopen(conversationId: ConversationId): Promise<boolean>
  /** A company's list lost a domain: each running machine of it that the Hub holds takes its list again. Never rejects. */
  narrow(companyId: CompanyId): Promise<void>
  /**
   * The filesystem `show_file` locates a file in: a short-lived instance, so a link made after a
   * first look is looked at again.
   */
  serving(requestContext: RequestContext): WorkspaceFilesystem | undefined
  /**
   * The download: the machine the Hub holds (left to E2B's timeout), or, with no session, the one
   * the provider has under the conversation's mark, woken and paused again; it never makes a machine. One file inside
   * `WORK_FOLDER`, capped; `signal` stops the read when the browser leaves.
   */
  read(conversationId: ConversationId, path: string, signal: AbortSignal): Promise<FileRead>
  /** Where the conversation hears its machine's phases, until the returned function. */
  onPhase(conversationId: ConversationId, listener: (phase: Phase) => void): () => void
}

/** What a test changes of the machines: the folder and the toolchain on this computer, and a shorter start. */
export type MachineTuning = { workFolder: string; toolchain: string; startMs: number }

const ON_E2B: MachineTuning = { workFolder: WORK_FOLDER, toolchain: TOOLCHAIN, startMs: START_MS }

type Deps = ConversationMachine & { log: FailureLog }

type Session = NetworkedSession & {
  /** `conexus-<installation>-<conversationId>`, the provider's key to the machine. */
  name: string
  files: SandboxFilesystem
  /**
   * The conversation's workspace for the turn: the controller asks for it at every step, and the
   * machine is one.
   */
  workspace: Workspace | undefined
  /**
   * Built with the workspace: building it asks the provider nothing, and only its start finds the
   * machine.
   */
  ready: Promise<Kit> | undefined
  /** The provider's start, kept past the start's deadline: the pause waits for it (code C57). */
  starting: Promise<unknown> | undefined
  /**
   * The provider's id of the machine a download found: its start reattaches it, never makes one.
   */
  found: string | undefined
}

class Machines implements ConversationMachines {
  private readonly deps: Deps
  private readonly spec: MachineSpec
  readonly folder: string
  readonly toolchain: string
  readonly codeMode: CodeModeTransport
  private readonly startMs: number
  private readonly sessions = new Map<ConversationId, Session>()
  /**
   * Each conversation's line (code C65): a turn's opening of its workspace, its pause, a download,
   * `reopen` and `narrow` run one after another, so neither a download nor the next turn starts a
   * machine while one is being paused. The turn's start itself is not in the line: a download
   * during the turn reads the turn's own session, whose start it shares. Every change of a
   * machine's list also waits in the list's own queue (`network.ts`), apart, because a download
   * holds the conversation's line while its machine's start applies the list.
   */
  private readonly inLane = createLanes<ConversationId>()
  private readonly phases = new Map<ConversationId, (phase: Phase) => void>()
  private readonly network: ReturnType<typeof machineNetwork>

  /**
   * What the model is told of the machine in place of the provider's own words; its files and its
   * network are in the user's fixed message (the Assistant's `assistant.md`).
   */
  private readonly told: string

  constructor(spec: MachineSpec, deps: Deps, tuning: MachineTuning) {
    this.spec = spec
    this.deps = deps
    this.codeMode = deps.codeMode
    this.folder = tuning.workFolder
    this.toolchain = tuning.toolchain
    this.startMs = tuning.startMs
    this.told = `The conversation's own Linux machine. Commands start in ${this.folder}.`
    const { opened } = spec.network
    this.network = machineNetwork({
      ...{ opened, log: deps.log, sessions: this.sessions, amongPauses: this.inLane },
    })
  }

  /**
   * Wakes or creates the machine, once per session; with `replace`, a machine from another
   * template is killed first. A change of its list that failed is made again before each use; a
   * retry that fails holds no tool back, and the machine keeps the list it had.
   */
  private async ensure(session: Session): Promise<Kit> {
    session.ready ??= this.boot(session)
    const kit = await session.ready
    if (session.networkStale !== undefined) {
      await this.network.changeRunning(session, session.networkStale)
    }
    return kit
  }

  reopen = (conversationId: ConversationId) => this.network.reopen(conversationId)

  narrow = (companyId: CompanyId) => this.network.narrow(companyId)

  private async boot(session: Session): Promise<Kit> {
    const { conversationId } = session
    const { api, template, log } = this.deps
    const { otherTemplate } = this.spec
    this.phases.get(conversationId)?.('starting')
    // A machine found by its id is of the Hub's template: only a turn's start clears an older one.
    // Either way the provider's list comes first and a failed one stops the start: E2B's own lookup
    // swallows it and makes an empty machine in place of the one it could not see.
    const listed =
      session.found !== undefined
        ? undefined
        : otherTemplate === 'replace'
          ? api.killStale(conversationId, template)
          : api.find(conversationId, undefined)
    const starting = Promise.resolve(listed).then(() => session.kit.sandbox.start?.())
    session.starting = starting
    try {
      await within(starting, this.startMs)
    } catch (cause) {
      session.ready = undefined
      if (ReattachFailed.safeParse(cause).success) throw new Failure('FILE_GONE', { cause })
      const reason = isNetworkNotApplied(cause) ? 'NETWORK' : 'START'
      log.error(
        { conversationId, reason, cause: String(cause).slice(0, 500) },
        'MACHINE_UNAVAILABLE',
      )
      throw new Failure('MACHINE_UNAVAILABLE', { cause })
    }
    log.info({ conversationId }, 'MACHINE_STARTED')
    return session.kit
  }

  /**
   * Mastra's `onStart`: the machine takes its list before anything runs on it. The template does
   * not make the folder, and the `mkdir` starts at the root: E2B refuses a command whose folder
   * does not exist.
   */
  private async started(session: Session): Promise<void> {
    if (!(await this.network.change(session, 'START'))) throw networkNotApplied()
    const made = await session.kit.sandbox.executeCommand?.('mkdir', ['-p', this.folder], {
      cwd: '/',
    })
    if (made === undefined || made.exitCode !== 0) throw new Error(MKDIR_FAILED)
  }

  /**
   * The conversation's files, through its machine; the symlink check also starts the machine for
   * the first native write.
   */
  private filesystem(
    conversationId: ConversationId,
    kit: Kit,
    ensure: () => Promise<Kit>,
  ): SandboxFilesystem {
    return new SandboxFilesystem({
      id: `conexus-fs-${conversationId}`,
      sandbox: execIn(kit, ensure),
      workdir: this.folder,
      verifySymlinks: true,
    })
  }

  /**
   * A filesystem that has checked nothing yet, to serve one file: the check is made once per
   * instance, so a long-lived one would not see a link made later.
   */
  private shortLived(session: Session): SandboxFilesystem {
    return this.filesystem(session.conversationId, session.kit, () => this.ensure(session))
  }

  /**
   * The conversation's machine, built and not touched: the provider finds it by name when a tool
   * needs it, or, `found`, by the id a download found it at.
   */
  private open(
    conversationId: ConversationId,
    marks: Record<string, string>,
    found?: string,
  ): Session {
    const { installation, template, mark } = this.deps
    const name = `conexus-${installation}-${conversationId}`
    const kit: Kit = this.deps.kit({
      id: name,
      ...(found === undefined ? {} : { foundAs: found }),
      allowOut: this.spec.network.hosts,
      metadata: {
        ...mark,
        ...marks,
        [MARK.conversation]: conversationId,
        [MARK.template]: template,
      },
      workingDirectory: this.folder,
      onStart: () => this.started(session),
    })
    const session: Session = {
      conversationId,
      companyId: CompanyId.optional().parse(marks[MARK.company]),
      networkStale: undefined,
      name,
      kit,
      ready: undefined,
      starting: undefined,
      found,
      workspace: undefined,
      files: this.filesystem(conversationId, kit, () => this.ensure(session)),
    }
    return session
  }

  async workspace(requestContext: RequestContext): Promise<Workspace | undefined> {
    const marks = await this.spec.marks(requestContext)
    const conversationId = controllerIn(requestContext).sessionId
    if (marks === undefined || conversationId === undefined) return undefined
    const held = this.sessions.get(conversationId)?.workspace
    if (held !== undefined) return held
    return this.inLane(conversationId, async () => {
      const opened = this.sessions.get(conversationId)?.workspace
      if (opened !== undefined) return opened
      const session = this.open(conversationId, marks)
      this.sessions.set(conversationId, session)
      session.workspace = workspaceOf({
        name: session.name,
        ensure: () => this.ensure(session),
        instructions: () => this.told,
        filesystem: session.files,
        neverAsks: true,
        ...(this.spec.readMedia === undefined ? {} : { readMedia: this.spec.readMedia }),
      })
      return session.workspace
    })
  }

  /**
   * Pauses the machine once its start has settled, a start past its deadline included; one that
   * failed made none.
   */
  private async pause(session: Session): Promise<void> {
    if (session.starting === undefined) return
    const [start] = await Promise.allSettled([session.starting])
    if (start.status === 'rejected') return
    await session.kit.sandbox.stop?.()
  }

  /** The pause, its failure logged: the provider's own timeout pauses the machine then. */
  private async pauseLogged(session: Session): Promise<void> {
    try {
      await this.pause(session)
    } catch (cause) {
      const failure = new Failure('MACHINE_UNAVAILABLE', { cause, details: { reason: 'STOP' } })
      logFailure(this.deps.log, failure, { conversationId: session.conversationId })
    }
  }

  private stop(conversationId: ConversationId): Promise<void> {
    const session = this.sessions.get(conversationId)
    this.sessions.delete(conversationId)
    if (session === undefined) return Promise.resolve()
    return this.inLane(conversationId, () => this.pauseLogged(session))
  }

  async stopAll(): Promise<void> {
    await Promise.all([...this.sessions.keys()].map((each) => this.stop(each)))
  }

  serving(requestContext: RequestContext): WorkspaceFilesystem | undefined {
    const conversationId = controllerIn(requestContext).sessionId
    const session = conversationId === undefined ? undefined : this.sessions.get(conversationId)
    return session === undefined ? undefined : this.shortLived(session)
  }

  async kill(conversationId: ConversationId): Promise<void> {
    this.sessions.delete(conversationId)
    await this.deps.api.kill(conversationId)
  }

  read(conversationId: ConversationId, path: string, signal: AbortSignal): Promise<FileRead> {
    return this.inLane(conversationId, async () => {
      // The Hub holds the conversation's machine from its first turn on, running or paused by E2B's
      // own timeout (a tool that finds it paused resumes it): the download reads it there, and
      // pauses nothing. Without a session (the Hub restarted) the provider's list finds it.
      const held = this.sessions.get(conversationId)
      if (held !== undefined) return this.readFrom(held, path, signal)
      const found = await this.found(conversationId)
      if (found === 'UNAVAILABLE') return { kind: 'MACHINE_UNAVAILABLE' }
      if (found === undefined) return { kind: 'FILE_GONE' }
      const session = this.open(conversationId, {}, found)
      try {
        return await this.readFrom(session, path, signal)
      } finally {
        await this.pauseLogged(session)
      }
    })
  }

  /** The machine the provider has for the conversation, by its mark; a failed list is no answer. */
  private async found(conversationId: ConversationId): Promise<string | 'UNAVAILABLE' | undefined> {
    try {
      const { api, template } = this.deps
      const { otherTemplate } = this.spec
      return await api.find(conversationId, otherTemplate === 'replace' ? template : undefined)
    } catch (cause) {
      const failure = new Failure('MACHINE_UNAVAILABLE', { cause, details: { reason: 'FIND' } })
      logFailure(this.deps.log, failure, { conversationId })
      return 'UNAVAILABLE'
    }
  }

  private async readFrom(session: Session, path: string, signal: AbortSignal): Promise<FileRead> {
    try {
      await this.ensure(session)
    } catch (error) {
      if (error instanceof Failure) {
        if (error.code === 'MACHINE_UNAVAILABLE' || error.code === 'FILE_GONE') {
          return { kind: error.code }
        }
      }
      throw error
    }
    const found = await locate(this.shortLived(session), path)
    if (found.kind !== 'FILE') return { kind: 'FILE_NOT_FOUND' }
    if (found.bytes > MAX_BYTES) return { kind: 'FILE_TOO_LARGE' }
    const bytes = await readCapped(session.kit.transport, found.path, signal)
    if (bytes === 'cancelled') return { kind: 'CANCELLED' }
    return bytes === 'too-large' ? { kind: 'FILE_TOO_LARGE' } : { kind: 'OK', bytes }
  }

  onPhase(conversationId: ConversationId, listener: (phase: Phase) => void): () => void {
    this.phases.set(conversationId, listener)
    return () => {
      if (this.phases.get(conversationId) === listener) this.phases.delete(conversationId)
    }
  }
}

/**
 * The conversations' machines; `tuning` is a test's, which runs them as folders of this computer.
 */
export function createConversationMachines(
  spec: MachineSpec,
  deps: Deps,
  tuning: MachineTuning = ON_E2B,
): ConversationMachines {
  return new Machines(spec, deps, tuning)
}
