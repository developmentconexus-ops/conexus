import type { ConversationId } from '@conexus/hub-api'
import { ConversationId as ConversationIdSchema } from '@conexus/hub-api'
import type { RequestContext } from '@mastra/core/request-context'
import type { WorkspaceFilesystem } from '@mastra/core/workspace'
import { FileNotFoundError, WORKSPACE_TOOLS, Workspace } from '@mastra/core/workspace'
import { z } from 'zod'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import { MAX_BYTES } from '../git/public.ts'
import type { AssistantMachine, Kit } from '../machine/public.ts'
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

/** The hosts the Assistant's machine may reach: the package registries, for pip and npm (decision 0059). */
export const ASSISTANT_HOSTS = ['registry.npmjs.org', 'pypi.org', 'files.pythonhosted.org']

const START_MS = 120_000
const MKDIR_FAILED = 'the conversation folder could not be made'

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
  /** The turn ended: the machine stops (E2B pauses it); a machine never started is left alone. */
  stop(conversationId: ConversationId): Promise<void>
  /** The Hub ends: every machine of a turn in flight stops. */
  stopAll(): Promise<void>
  /** The conversation is deleted: every machine it marked is killed (`MachineApi.kill`). */
  kill(conversationId: ConversationId): Promise<void>
  /** The filesystem `show_file` locates a file in: a short-lived instance, so a link made after a first look is looked at again. */
  serving(requestContext: RequestContext): WorkspaceFilesystem | undefined
  /** The download: wakes the machine and reads one file inside `WORK_FOLDER`, capped; `signal` stops the read when the browser leaves. */
  read(conversationId: ConversationId, path: string, signal: AbortSignal): Promise<FileRead>
}

type Deps = AssistantMachine & { log: FailureLog; scopeOf: ScopeOf }

/** Where a path the model or the person names lands in the conversation's folder, or why it does not. */
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
  /** The conversation's workspace for the turn: the controller asks for it at every step, and the machine is one. */
  workspace: Workspace | undefined
  /** Built with the workspace: building it asks the provider nothing, and only its start finds the machine. */
  ready: Promise<Kit> | undefined
  /** The first start made a new machine: whatever the conversation wrote before is gone. */
  created: boolean | undefined
}

const Controller = z.object({ sessionId: ConversationIdSchema })

class Machines implements AssistantMachines {
  private readonly deps: Deps
  readonly folder: string
  private readonly sessions = new Map<ConversationId, Session>()
  /** The pauses in flight, which the Hub's end waits for (code C62). */
  private readonly pausing = new Set<Promise<void>>()

  /** What the model is told of the machine in place of the provider's own words; its files and its network are in the fixed message (`assistant.md`). */
  private readonly told: string

  constructor(deps: Deps) {
    this.deps = deps
    this.folder = deps.workFolder ?? WORK_FOLDER
    this.told = `The conversation's own Linux machine. Commands start in ${this.folder}.`
  }

  /** Wakes or creates the machine, once per session; a machine from another template is killed first. */
  private ensure(session: Session): Promise<Kit> {
    session.ready ??= this.boot(session)
    return session.ready
  }

  private async boot(session: Session): Promise<Kit> {
    const { conversationId } = session
    const { api, template, log } = this.deps
    try {
      await within(
        api.killStale(conversationId, template).then(() => session.kit.sandbox.start?.()),
        this.deps.startMs ?? START_MS,
      )
    } catch (cause) {
      session.ready = undefined
      log.error({ reason: 'START', cause: String(cause).slice(0, 500) }, 'MACHINE_UNAVAILABLE')
      throw new Failure('MACHINE_UNAVAILABLE', { cause })
    }
    log.info({ conversationId }, 'MACHINE_STARTED')
    return session.kit
  }

  /**
   * Mastra's `onStart`: the folder exists, and a machine found again has the network narrowed again.
   * The folder is where commands start, and the template does not make it: the `mkdir` starts at
   * the root, for E2B refuses a command whose folder does not exist.
   */
  private async started(session: Session, outcome: string | undefined): Promise<void> {
    session.created ??= outcome !== 'connected'
    if (outcome === 'connected') await session.kit.closeNetwork()
    const made = await session.kit.sandbox.executeCommand?.('mkdir', ['-p', this.folder], {
      cwd: '/',
    })
    if (made === undefined || made.exitCode !== 0) throw new Error(MKDIR_FAILED)
  }

  /** The conversation's files, through its machine; the symlink check also starts the machine for the first native write. */
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

  /** A filesystem that has checked nothing yet, to serve one file: the check is made once per instance, so a long-lived one would not see a link made later. */
  private shortLived(session: Session): SandboxFilesystem {
    return this.filesystem(session.conversationId, session.kit, () => this.ensure(session))
  }

  /** The conversation's machine, built and not touched: the provider finds it by name when a tool needs it. */
  private open(conversationId: ConversationId, marks: Record<string, string>): Session {
    const { installation, template, mark } = this.deps
    const name = `conexus-${installation}-${conversationId}`
    const kit: Kit = this.deps.kit({
      id: name,
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
      created: undefined,
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
  }

  private async pause(session: Session): Promise<void> {
    if (session.ready === undefined) return
    await Promise.allSettled([session.ready])
    await session.kit.sandbox.stop?.()
  }

  async stop(conversationId: ConversationId): Promise<void> {
    const session = this.sessions.get(conversationId)
    this.sessions.delete(conversationId)
    if (session === undefined) return
    const pausing = this.pause(session)
    this.pausing.add(pausing)
    try {
      await pausing
    } finally {
      this.pausing.delete(pausing)
    }
  }

  /** Stops every machine of a turn in flight and waits for the pauses already begun, whose own callers log their failures. */
  async stopAll(): Promise<void> {
    await Promise.all([...this.sessions.keys()].map((each) => this.stop(each)))
    await Promise.allSettled([...this.pausing])
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

  async read(conversationId: ConversationId, path: string, signal: AbortSignal): Promise<FileRead> {
    // A turn in flight holds the conversation's machine; else the download wakes it by name and lets it sleep again.
    const held = this.sessions.get(conversationId)
    const session = held ?? this.open(conversationId, {})
    try {
      await this.ensure(session)
    } catch (error) {
      if (error instanceof Failure && error.code === 'MACHINE_UNAVAILABLE') {
        return { kind: 'MACHINE_UNAVAILABLE' }
      }
      throw error
    }
    // A new machine under a download is not the one the files were written on: it is not kept.
    if (held === undefined && session.created === true) {
      await this.deps.api.kill(conversationId)
      return { kind: 'FILE_GONE' }
    }
    try {
      const found = await locate(this.shortLived(session), path)
      if (found.kind !== 'FILE') return { kind: 'FILE_NOT_FOUND' }
      if (found.bytes > MAX_BYTES) return { kind: 'FILE_TOO_LARGE' }
      const bytes = await readCapped(session.kit.transport, found.path, signal)
      if (bytes === 'cancelled') return { kind: 'CANCELLED' }
      return bytes === 'too-large' ? { kind: 'FILE_TOO_LARGE' } : { kind: 'OK', bytes }
    } finally {
      if (held === undefined) await this.pause(session)
    }
  }
}

export function createAssistantMachines(deps: Deps): AssistantMachines {
  return new Machines(deps)
}
