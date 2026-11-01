import { posix } from 'node:path'
import type { ConversationId } from '@conexus/hub-api'
import { ConversationId as ConversationIdSchema } from '@conexus/hub-api'
import type { RequestContext } from '@mastra/core/request-context'
import type { WorkspaceFilesystem } from '@mastra/core/workspace'
import { FileNotFoundError, WORKSPACE_TOOLS, Workspace } from '@mastra/core/workspace'
import { z } from 'zod'
import type { InstallationId, MachineTemplate } from '../../platform/config-machine.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import { MAX_BYTES } from '../git/public.ts'
import type { Kit, KitFactory, MachineApi } from '../machine/public.ts'
import { execIn, MARK, readCapped, SandboxFilesystem, within } from '../machine/public.ts'
import { sessionScope } from './context.ts'

/** Where the conversation's files live on its machine, made at the machine's start. */
export const WORK_FOLDER = '/home/user/work'

/** The hosts the Assistant's machine may reach: the package registries, for pip and npm (decision 0051). */
export const ASSISTANT_HOSTS = ['registry.npmjs.org', 'pypi.org', 'files.pythonhosted.org']

const START_MS = 120_000
const MKDIR_FAILED = 'the conversation folder could not be made'
const ESCAPES = 'Path escapes workspace root'

type FileRead =
  | { kind: 'OK'; bytes: Buffer }
  | { kind: 'FILE_NOT_FOUND' | 'FILE_TOO_LARGE' | 'FILE_GONE' | 'MACHINE_UNAVAILABLE' }

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
  /** The download: wakes the machine and reads one file inside `WORK_FOLDER`, capped. */
  read(conversationId: ConversationId, path: string): Promise<FileRead>
}

type Deps = {
  kit: KitFactory
  api: MachineApi
  template: MachineTemplate
  installation: InstallationId
  log: FailureLog
  /** Where the files live; `WORK_FOLDER` on E2B. */
  workFolder?: string
  startMs?: number
}

/** Where a path the model or the person names lands in the conversation's folder, or why it does not. */
export type Located =
  | { kind: 'FILE'; path: string; name: string; bytes: number }
  | { kind: 'OUTSIDE' | 'NOT_FOUND' }

/**
 * Finds one file of the conversation's folder: the path read against the folder, refused when it
 * leaves it (a `..`, another root or a symlink out, which the filesystem's own check catches), and
 * measured. A folder, or a path that does not exist, is `NOT_FOUND`.
 */
export async function locate(
  files: WorkspaceFilesystem,
  folder: string,
  path: string,
): Promise<Located> {
  const abs = posix.resolve(folder, path)
  if (abs !== folder && !abs.startsWith(`${folder}/`)) return { kind: 'OUTSIDE' }
  try {
    const found = await files.stat(abs)
    if (found.type !== 'file') return { kind: 'NOT_FOUND' }
    return { kind: 'FILE', path: abs, name: found.name, bytes: found.size }
  } catch (error) {
    if (error instanceof FileNotFoundError) return { kind: 'NOT_FOUND' }
    if (error instanceof Error && error.message.startsWith(ESCAPES)) return { kind: 'OUTSIDE' }
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

  /** What the model is told of the machine in place of the provider's own words; the person's files and the network are in the fixed message. */
  private readonly told: string

  constructor(deps: Deps) {
    this.deps = deps
    this.folder = deps.workFolder ?? WORK_FOLDER
    this.told = `The conversation's own Linux machine. Commands start in ${this.folder}; its network reaches only ${ASSISTANT_HOSTS.join(', ')}.`
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

  /** Mastra's `onStart`: the folder exists, and a machine found again has the network narrowed again. */
  private async started(session: Session, outcome: string | undefined): Promise<void> {
    session.created ??= outcome !== 'connected'
    if (outcome === 'connected') await session.kit.closeNetwork()
    const made = await session.kit.sandbox.executeCommand?.('mkdir', ['-p', this.folder])
    if (made === undefined || made.exitCode !== 0) throw new Error(MKDIR_FAILED)
  }

  /** The conversation's machine, built and not touched: the provider finds it by name when a tool needs it. */
  private open(conversationId: ConversationId, marks: Record<string, string>): Session {
    const { installation, template } = this.deps
    const name = `conexus-${installation}-${conversationId}`
    const kit: Kit = this.deps.kit({
      id: name,
      allowOut: ASSISTANT_HOSTS,
      metadata: {
        [MARK.origin]: installation,
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
      files: new SandboxFilesystem({
        id: `conexus-fs-${conversationId}`,
        sandbox: execIn(kit, () => this.ensure(session)),
        workdir: this.folder,
        verifySymlinks: true,
      }),
    }
    return session
  }

  async workspace(requestContext: RequestContext): Promise<Workspace | undefined> {
    const scope = await sessionScope(requestContext)
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
    if (session !== undefined) await this.pause(session)
  }

  async stopAll(): Promise<void> {
    await Promise.all([...this.sessions.keys()].map((each) => this.stop(each)))
  }

  async kill(conversationId: ConversationId): Promise<void> {
    this.sessions.delete(conversationId)
    await this.deps.api.kill(conversationId)
  }

  async read(conversationId: ConversationId, path: string): Promise<FileRead> {
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
      const found = await locate(session.files, this.folder, path)
      if (found.kind !== 'FILE') return { kind: 'FILE_NOT_FOUND' }
      if (found.bytes > MAX_BYTES) return { kind: 'FILE_TOO_LARGE' }
      const bytes = await readCapped(session.kit.transport, found.path)
      return bytes === 'too-large' ? { kind: 'FILE_TOO_LARGE' } : { kind: 'OK', bytes }
    } finally {
      if (held === undefined) await this.pause(session)
    }
  }
}

export function createAssistantMachines(deps: Deps): AssistantMachines {
  return new Machines(deps)
}
