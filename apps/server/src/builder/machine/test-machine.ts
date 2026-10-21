import { createReadStream, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import type { TestContext } from 'node:test'
import { CompanyId, ProjectId } from '@conexus/hub-api'
import { LocalSandbox } from '@mastra/core/workspace'
import { createTestDatabase } from '../../platform/test-database.ts'
import { openRepository } from '../git/public.ts'
import type { Kit, KitFactory } from './kit.ts'
import { SandboxId } from './kit.ts'
import type { Phase } from './public.ts'
import { createMachines } from './public.ts'

/** What the provider does, for a test to choose: the outcome of a start, and how the start goes. */
export type Control = {
  outcome: 'created' | 'connected'
  start: 'ok' | 'gone' | 'hang' | 'unreachable'
  /** Whether the provider still holds the recorded machine. */
  exists: boolean
  networkClosed: number
  /** How long the machine takes to come up after it says it runs, as E2B's start does. */
  upMs: number
  /** Starts the latest machine again as the provider does after it died: its `onStart` runs once more. */
  restart: () => Promise<void>
  /** The ids the machines asked the provider to reattach. */
  reattached: (string | undefined)[]
  /** The deadline each machine was asked for. */
  deadlines: Date[]
  /** What another process in the machine does right after each command the Hub runs there. */
  afterCommand: () => void
  /** What another process in the machine does to a file just before the Hub reads it. */
  beforeRead: (path: string) => void
}

export function newControl(): Control {
  return {
    outcome: 'created',
    start: 'ok',
    exists: true,
    networkClosed: 0,
    upMs: 0,
    restart: async () => undefined,
    reattached: [],
    deadlines: [],
    afterCommand: () => undefined,
    beforeRead: () => undefined,
  }
}

/** A machine that is a folder of this computer: E2B's start, its outcome and its failures made by hand. */
export function localKit(folder: string, control: Control): KitFactory {
  return (options): Kit => {
    mkdirSync(folder, { recursive: true })
    control.deadlines.push(options.deadline)
    control.reattached.push(options.sandboxId)
    const sandbox = new LocalSandbox({
      workingDirectory: folder,
      onStart: async (started) => {
        await new Promise((up) => setTimeout(up, control.upMs))
        await options.onStart({ ...started, outcome: control.outcome })
      },
    })
    control.restart = () => Promise.resolve(options.onStart({ sandbox, outcome: control.outcome }))
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
      if (control.start === 'hang') return new Promise<never>(() => undefined)
      if (control.start === 'gone')
        throw Object.assign(new Error('gone'), { code: 'SANDBOX_REATTACH_FAILED' })
      if (control.start === 'unreachable') throw new Error('502 Bad Gateway')
      return start(...args)
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
      sandboxId: () => SandboxId.parse('local-machine'),
      closeNetwork: async () => {
        control.networkClosed += 1
      },
    }
  }
}

export const COMPANY = CompanyId.parse('companyAAAAAAAAAAAAAAAAAAAAAAAAA')
export const PROJECT = ProjectId.parse('projectAAAAAAAAAAAAAAAAAAAAAAAAA')
const LOG = { info: () => undefined, error: () => undefined }
const SEED = `
  insert into auth."user"(id, name, email) values ('person-a', 'Ana', 'ana@example.test');
  insert into auth.company(id, name, slug, created_at, attempt_key) values
    ('${COMPANY}', 'Empresa A', 'key-a', now(), 'key-a');
  insert into auth.member(id, company_id, user_id, role, created_at) values
    ('member-a', '${COMPANY}', 'person-a', 'member', now());
  insert into projects.project(id, company_id, name, attempt_key, created_at) values
    ('${PROJECT}', '${COMPANY}', 'Encomendas', 'a', now());`

/** A company with one Projeto, its Git, and the machines of a local machine the test steers. */
export async function world(t: TestContext, startMs = 5_000) {
  const { database, asOwner } = await createTestDatabase(t)
  await asOwner(SEED)
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
  const machines = createMachines({
    database,
    kit: localKit(folder, control),
    api: { list: async () => [], kill: async () => undefined, exists: async () => control.exists },
    seedOf: () => repository.bundleOfMain(),
    mark: { conexus_origin: 'hub.example.test' },
    log: LOG,
    workdir: join(folder, 'app'),
    tmp: folder,
    startMs,
  })
  const phases: Phase[] = []
  function open() {
    return machines.workspaceFor({
      companyId: COMPANY,
      projectId: PROJECT,
      deadline: new Date(Date.now() + 3_600_000),
      onPhase: (phase) => phases.push(phase),
    })
  }
  return { asOwner, machines, repository, base, control, phases, open, folder }
}
