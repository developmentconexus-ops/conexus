import { execFileSync } from 'node:child_process'
import {
  createReadStream,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import type { TestContext } from 'node:test'
import { CompanyId, ConversationId, ProjectId } from '@conexus/hub-api'
import { RequestContext } from '@mastra/core/request-context'
import type { Workspace, WorkspaceSandbox } from '@mastra/core/workspace'
import { LocalSandbox } from '@mastra/core/workspace'
import { E2bApiKey, InstallationId, MachineTemplate } from '../../platform/config-machine.ts'
import { Failure } from '../../platform/failure.ts'
import { openRepository } from '../git/public.ts'
import type { Kit, KitFactory } from './kit.ts'
import type { Phase } from './public.ts'
import { createMachines } from './public.ts'

/** A seed the Git refuses to make, because its copy holds a version the disk lost. */
export function restoreRefused(): Promise<Buffer> {
  return Promise.reject(new Failure('GIT_RESTORE_NEEDED'))
}

export const INSTALLATION = InstallationId.parse('testinstallation0')
export const OTHER_INSTALLATION = InstallationId.parse('otherinstallation0')
/** The template the Hub runs, and the one a Release left behind. */
export const TEMPLATE = MachineTemplate.parse('conexus-builder:1111111')
export const OLD_TEMPLATE = MachineTemplate.parse('conexus-builder:0000000')

/** What the provider does, for a test to choose: the outcome of a start, and how the start goes. */
export type Control = {
  outcome: 'created' | 'connected'
  start: 'ok' | 'hang' | 'unreachable'
  /** The names of the machines the provider holds, which Mastra finds by name. */
  discoverable: string[]
  /** The template each machine the provider holds was made from, by name; unlisted is the Hub's. */
  templates: Record<string, string>
  /** The names the Hub killed for coming from another template. */
  replaced: string[]
  /** The names the Hub's machines found and attached. */
  attached: string[]
  networkClosed: number
  /** How long the machine takes to come up after it says it runs, as E2B's start does. */
  upMs: number
  /** Starts the latest machine again as the provider does after it died: its `onStart` runs once more. */
  restart: () => Promise<void>
  /** The name of each machine started: the provider finds an existing one by it alone. */
  names: string[]
  /** The hosts each machine started may reach. */
  allowOut: (readonly string[])[]
  /** The mark each machine started carries. */
  marks: Record<string, string>[]
  /** The latest machine started, to watch its status as a test needs. */
  sandbox: WorkspaceSandbox | undefined
  /** How many times a machine was paused. */
  stops: number
  /** The provider killed the machine: pausing it fails as E2B's does, until a start makes a new one. */
  killed: boolean
  /** What another process in the machine does right after each command the Hub runs there. */
  afterCommand: () => void
  /** What another process in the machine does to a file just before the Hub reads it. */
  beforeRead: (path: string) => void
}

export function newControl(): Control {
  return {
    outcome: 'created',
    start: 'ok',
    discoverable: [],
    templates: {},
    replaced: [],
    attached: [],
    networkClosed: 0,
    upMs: 0,
    restart: async () => undefined,
    names: [],
    allowOut: [],
    marks: [],
    sandbox: undefined,
    stops: 0,
    killed: false,
    afterCommand: () => undefined,
    beforeRead: () => undefined,
  }
}

/**
 * A machine that is a folder of this computer: E2B's start, its outcome and its failures made by
 * hand. Building it asks the provider nothing, as E2B's does not; its start finds it by name.
 */
export function localKit(folder: string, control: Control): KitFactory {
  return (options): Kit => {
    const sandbox = new LocalSandbox({
      workingDirectory: options.workingDirectory,
      instructions: options.instructions,
      onStart: async (started) => {
        await new Promise((up) => setTimeout(up, control.upMs))
        const outcome = control.discoverable.includes(options.id) ? 'connected' : control.outcome
        if (outcome === 'connected') control.attached.push(options.id)
        await options.onStart({ ...started, outcome })
      },
    })
    const execute = sandbox.executeCommand?.bind(sandbox)
    if (execute !== undefined) {
      sandbox.executeCommand = async (...args) => {
        const result = await execute(...args)
        control.afterCommand()
        return result
      }
    }
    const start = sandbox.start.bind(sandbox)
    sandbox.start = async (...args) => {
      mkdirSync(folder, { recursive: true })
      control.names.push(options.id)
      control.marks.push(options.metadata)
      control.allowOut.push(options.allowOut)
      control.sandbox = sandbox
      control.restart = () =>
        Promise.resolve(options.onStart({ sandbox, outcome: control.outcome }))
      if (control.start === 'hang') return new Promise<never>(() => undefined)
      if (control.start === 'unreachable') throw new Error('502 Bad Gateway')
      control.killed = false
      return start(...args)
    }
    const stop = sandbox.stop.bind(sandbox)
    sandbox.stop = async () => {
      if (control.killed) throw new Error('Sandbox local-machine not found')
      control.stops += 1
      return stop()
    }
    return {
      sandbox,
      transport: {
        write: async (path, bytes) => {
          mkdirSync(dirname(path), { recursive: true })
          writeFileSync(path, bytes)
        },
        read: async (path) => {
          control.beforeRead(path)
          return createReadStream(path)
        },
      },
      closeNetwork: async () => {
        control.networkClosed += 1
      },
    }
  }
}

export const COMPANY = CompanyId.parse('companyAAAAAAAAAAAAAAAAAAAAAAAAA')
export const PROJECT = ProjectId.parse('projectAAAAAAAAAAAAAAAAAAAAAAAAA')
export const CONVERSATION = ConversationId.parse('00000000-0000-4000-8000-00000000000a')
export const OTHER_CONVERSATION = ConversationId.parse('00000000-0000-4000-8000-00000000000b')
const LOG = { info: () => undefined, error: () => undefined }

/** A Projeto's Git, and the machines of a local machine the test steers. */
export async function world(
  t: TestContext,
  startMs = 5_000,
  installation = INSTALLATION,
  seedOf?: () => Promise<Buffer>,
  options: Readonly<{ checkProgram?: string; commandMs?: number }> = {},
) {
  const folder = mkdtempSync(join(tmpdir(), 'conexus-machine-'))
  t.after(() => rmSync(folder, { recursive: true, force: true }))
  const repository = openRepository({
    root: join(folder, 'git'),
    companyId: COMPANY,
    projectId: PROJECT,
    log: LOG,
  })
  const base = await repository.ensure()
  const control = newControl()
  /** What the machines logged as errors, by message. */
  const errors: string[] = []
  const machines = createMachines({
    kit: localKit(folder, control),
    api: {
      kill: async () => 0,
      // The provider's list by the conversation's mark, as E2B's: every machine of another template goes.
      killStale: async (conversationId, template) => {
        const stale = control.discoverable.filter(
          (name) =>
            name.endsWith(conversationId) && (control.templates[name] ?? TEMPLATE) !== template,
        )
        control.discoverable = control.discoverable.filter((name) => !stale.includes(name))
        control.replaced.push(...stale)
        return stale.length
      },
    },
    seedOf: seedOf ?? (() => repository.bundleOfMain()),
    mark: { conexus_origin: installation },
    installation,
    template: TEMPLATE,
    log: { info: () => undefined, error: (_fields, message) => errors.push(message) },
    workdir: join(folder, 'app'),
    tmp: folder,
    startMs,
    ...options,
  })
  const phases: Phase[] = []
  function open(conversationId = CONVERSATION) {
    return machines.workspaceFor({
      companyId: COMPANY,
      projectId: PROJECT,
      conversationId,
      onPhase: (phase) => phases.push(phase),
    })
  }
  return { machines, repository, base, control, phases, errors, open, folder }
}

/** The workspace's machine, started as a tool's first call starts it. */
export async function sandboxOf(workspace: Workspace) {
  const sandbox = await workspace.resolveSandbox({ requestContext: new RequestContext() })
  if (sandbox?.executeCommand === undefined) throw new Error('the machine cannot run commands')
  return { executeCommand: sandbox.executeCommand.bind(sandbox) }
}

/**
 * Another conversation of the Projeto saved a version: `main` in the Git at `gitDir` moves to a
 * commit that writes `path`, or deletes it when `content` is null, one no machine of this
 * conversation received.
 */
export function moveMain(gitDir: string, path: string, content: string | null) {
  const work = mkdtempSync(join(tmpdir(), 'conexus-other-'))
  try {
    execFileSync('git', ['clone', '--quiet', gitDir, work])
    mkdirSync(dirname(join(work, path)), { recursive: true })
    if (content === null) rmSync(join(work, path))
    else writeFileSync(join(work, path), content)
    function git(...args: string[]) {
      execFileSync('git', ['-C', work, ...args])
    }
    git('add', '--all')
    git('-c', 'user.name=Outra', '-c', 'user.email=outra@conexus.invalid', 'commit', '-qm', 'outra')
    git('push', '--quiet', 'origin', 'HEAD:main')
  } finally {
    rmSync(work, { recursive: true, force: true })
  }
}

// biome-ignore lint/style/noProcessEnv: the switches of the real-E2B opt-in cases, not the app's configuration
const { CONEXUS_E2B_KEY_FILE: KEY_FILE, CONEXUS_E2B_TEMPLATE: REAL_TEMPLATE } = process.env

/** The founder's E2B account and the published template, for the opt-in cases that need the real provider; none unless both are set. */
export function realE2b() {
  if (KEY_FILE === undefined || REAL_TEMPLATE === undefined) return undefined
  return {
    e2bApiKey: E2bApiKey.parse(readFileSync(KEY_FILE, 'utf8').trim()),
    machineTemplate: MachineTemplate.parse(REAL_TEMPLATE),
  }
}
