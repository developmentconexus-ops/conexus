import type { ConversationId } from '@conexus/hub-api'
import { ConversationId as ConversationIdSchema } from '@conexus/hub-api'
import type { RequestContext } from '@mastra/core/request-context'
import type { WorkspaceFilesystem } from '@mastra/core/workspace'
import { FileNotFoundError, WORKSPACE_TOOLS, Workspace } from '@mastra/core/workspace'
import { z } from 'zod'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure, logFailure } from '../../platform/failure.ts'
import { MAX_BYTES } from '../git/public.ts'
import type { AssistantMachine, Kit, Phase } from '../machine/public.ts'
import {
  execIn,
  MARK,
  PathEscapesError,
  readCapped,
  SandboxFilesystem,
  within,
} from '../machine/public.ts'
import type { ScopeOf } from './context.ts'

/** Where the conversation's files live on its machine, made at the machine's start. */
const WORK_FOLDER = '/home/user/work'

/**
 * The hosts the Assistant's machine may reach: the package registries, for pip and npm (decision
 * 0059).
 */
export const ASSISTANT_HOSTS = ['registry.npmjs.org', 'pypi.org', 'files.pythonhosted.org']

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
 * The conversations' machines: the Builder's kit without the app's seed, Git, check or pack; the
 * network reaches only `ASSISTANT_HOSTS`. One owner (code C26) for start, stop, kill and read.
 */
export type AssistantMachines = {
  /** Where the conversation's files are on its machine. */
  readonly folder: string
  /** The controller's workspace resolver; undefined outside a conversation, as the Builder's. */
  workspace(requestContext: RequestContext): Promise<Workspace | undefined>
  /**
   * The turn ended: the machine stops (E2B pauses it); a machine never started is left alone. It
   * never rejects: a pause that fails is logged, and the provider's own timeout pauses the machine.
   */
  stop(conversationId: ConversationId): Promise<void>
  /** The Hub ends: every machine of a turn in flight stops, each failure logged. */
  stopAll(): Promise<void>
  /** The conversation is deleted: every machine it marked is killed (`MachineApi.kill`). */
  kill(conversationId: ConversationId): Promise<void>
  /**
   * The filesystem `show_file` locates a file in: a short-lived instance, so a link made after a
   * first look is looked at again.
   */
  serving(requestContext: RequestContext): WorkspaceFilesystem | undefined
  /**
   * The download: the machine the turn holds, or the one the provider has under the
   * conversation's mark, woken and paused again; it never makes a machine. One file inside
   * `WORK_FOLDER`, capped; `signal` stops the read when the browser leaves.
   */
  read(conversationId: ConversationId, path: string, signal: AbortSignal): Promise<FileRead>
  /** Where the conversation hears its machine's phases, until the returned function. */
  onPhase(conversationId: ConversationId, listener: (phase: Phase) => void): () => void
}

/** What a test changes of the machines: the folder on this computer, and a shorter start. */
export type MachineTuning = { workFolder: string; startMs: number }

const ON_E2B: MachineTuning = { workFolder: WORK_FOLDER, startMs: START_MS }

type Deps = AssistantMachine & { log: FailureLog; scopeOf: ScopeOf }

/**
 * Where a path the model or the person names lands in the conversation's folder, or why it does
 * not.
 */
export type Located =
  | { kind: 'FILE'; path: string; name: string; bytes: number }
  | { kind: 'OUTSIDE' | 'NOT_FOUND' }

/**
 * Finds one file of the conversation's folder, where the file tools put it: the filesystem
 * resolves the path (`/relatorio.md` is `relatorio.md` of the folder), refuses what leaves it (a
 * `..` or a symlink out, `PathEscapesError`) and measures it. A folder, or a path that does not
 * exist, is `NOT_FOUND`.
 */
export async function locate(files: WorkspaceFilesystem, path: string): Promise<Located> {
  try {
    const found = await files.stat(path)
    const abs = files.resolveAbsolutePath?.(path)
    if (found.type !== 'file' || abs === undefined) return { kind: 'NOT_FOUND' }
    return { kind: 'FILE', path: abs, name: found.name, bytes: found.size }
  } catch (error) {
    if (error instanceof FileNotFoundError) return { kind: 'NOT_FOUND' }
    if (error instanceof PathEscapesError) return { kind: 'OUTSIDE' }
    throw error
  }
}

type Session = {
  conversationId: ConversationId
  /** `conexus-<installation>-<conversationId>`, the provider's key to the machine. */
  name: string
  kit: Kit
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

const Controller = z.object({ sessionId: ConversationIdSchema })

class Machines implements AssistantMachines {
  private readonly deps: Deps
  readonly folder: string
  private readonly startMs: number
  private readonly sessions = new Map<ConversationId, Session>()
  /** The pauses in flight, which the Hub's end waits for (code C62). */
  private readonly pausing = new Set<Promise<void>>()
  /**
   * Each conversation's line (code C65): a turn's start, its pause and a download run one after
   * another, so a download never starts a machine beside the turn's, nor reads one being paused.
   */
  private readonly lanes = new Map<ConversationId, Promise<unknown>>()
  private readonly phases = new Map<ConversationId, (phase: Phase) => void>()

  /**
   * What the model is told of the machine in place of the provider's own words; its files and its
   * network are in the fixed message (`assistant.md`).
   */
  private readonly told: string

  constructor(deps: Deps, tuning: MachineTuning) {
    this.deps = deps
    this.folder = tuning.workFolder
    this.startMs = tuning.startMs
    this.told = `The conversation's own Linux machine. Commands start in ${this.folder}.`
  }

  /** Runs `work` once every earlier step of the conversation's line has settled. */
  private inLane<T>(conversationId: ConversationId, work: () => Promise<T>): Promise<T> {
    const run = Promise.allSettled([this.lanes.get(conversationId)]).then(work)
    const settled = Promise.allSettled([run])
    this.lanes.set(conversationId, settled)
    void settled.then(() => {
      if (this.lanes.get(conversationId) === settled) this.lanes.delete(conversationId)
    })
    return run
  }

  /**
   * Wakes or creates the machine, once per session; a machine from another template is killed
   * first.
   */
  private ensure(session: Session): Promise<Kit> {
    session.ready ??= this.boot(session)
    return session.ready
  }

  private async boot(session: Session): Promise<Kit> {
    const { conversationId } = session
    const { api, template, log } = this.deps
    this.phases.get(conversationId)?.('starting')
    // A machine found by its id is of the Hub's template: only a turn's start clears an older one.
    const stale = session.found === undefined ? api.killStale(conversationId, template) : undefined
    const starting = Promise.resolve(stale).then(() => session.kit.sandbox.start?.())
    session.starting = starting
    try {
      await within(starting, this.startMs)
    } catch (cause) {
      session.ready = undefined
      if (ReattachFailed.safeParse(cause).success) throw new Failure('FILE_GONE', { cause })
      log.error(
        { conversationId, reason: 'START', cause: String(cause).slice(0, 500) },
        'MACHINE_UNAVAILABLE',
      )
      throw new Failure('MACHINE_UNAVAILABLE', { cause })
    }
    log.info({ conversationId }, 'MACHINE_STARTED')
    return session.kit
  }

  /**
   * Mastra's `onStart`: the folder exists, and a machine found again has the network narrowed
   * again.
   * The folder is where commands start, and the template does not make it: the `mkdir` starts at
   * the root, for E2B refuses a command whose folder does not exist.
   */
  private async started(session: Session, outcome: string | undefined): Promise<void> {
    if (outcome === 'connected') await session.kit.closeNetwork()
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
      allowOut: ASSISTANT_HOSTS,
      metadata: {
        ...mark,
        ...marks,
        [MARK.conversation]: conversationId,
        [MARK.template]: template,
      },
      workingDirectory: this.folder,
      instructions: this.told,
      onStart: ({ outcome }) => this.started(session, outcome),
    })
    const session: Session = {
      conversationId,
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
    const scope = await this.deps.scopeOf(requestContext)
    const controller = Controller.safeParse(requestContext.get('controller'))
    if (scope === undefined || !controller.success) return undefined
    const { sessionId: conversationId } = controller.data
    const held = this.sessions.get(conversationId)?.workspace
    if (held !== undefined) return held
    return this.inLane(conversationId, async () => {
      const opened = this.sessions.get(conversationId)?.workspace
      if (opened !== undefined) return opened
      const session = this.open(conversationId, {
        [MARK.company]: scope.companyId,
        ...(scope.place.kind === 'PROJECT' ? { [MARK.project]: scope.place.projectId } : {}),
      })
      this.sessions.set(conversationId, session)
      session.workspace = new Workspace({
        sandbox: async () => (await this.ensure(session)).sandbox,
        sandboxCacheKey: () => session.name,
        instructions: { dynamicSandbox: () => this.told },
        filesystem: session.files,
        tools: {
          hooks: {
            beforeToolCall: async () => {
              await this.ensure(session)
            },
          },
          [WORKSPACE_TOOLS.FILESYSTEM.AST_EDIT]: { enabled: false },
        },
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

  stop(conversationId: ConversationId): Promise<void> {
    const session = this.sessions.get(conversationId)
    this.sessions.delete(conversationId)
    if (session === undefined) return Promise.resolve()
    const pausing = this.inLane(conversationId, () => this.pauseLogged(session))
    this.pausing.add(pausing)
    return pausing.finally(() => this.pausing.delete(pausing))
  }

  /** Stops every machine of a turn in flight and waits for the pauses already begun. */
  async stopAll(): Promise<void> {
    await Promise.all([...this.sessions.keys()].map((each) => this.stop(each)))
    await Promise.all([...this.pausing])
  }

  serving(requestContext: RequestContext): WorkspaceFilesystem | undefined {
    const controller = Controller.safeParse(requestContext.get('controller'))
    const session = controller.success ? this.sessions.get(controller.data.sessionId) : undefined
    return session === undefined ? undefined : this.shortLived(session)
  }

  async kill(conversationId: ConversationId): Promise<void> {
    this.sessions.delete(conversationId)
    await this.deps.api.kill(conversationId)
  }

  read(conversationId: ConversationId, path: string, signal: AbortSignal): Promise<FileRead> {
    return this.inLane(conversationId, async () => {
      // A turn in flight holds the conversation's machine: the download reads it there.
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
      return await this.deps.api.find(conversationId, this.deps.template)
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
export function createAssistantMachines(
  deps: Deps,
  tuning: MachineTuning = ON_E2B,
): AssistantMachines {
  return new Machines(deps, tuning)
}
