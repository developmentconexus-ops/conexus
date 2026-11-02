import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import type { CompanyId, ConversationId, ProjectId } from '@conexus/hub-api'
import type { Config } from '../../platform/config.ts'
import { silent } from '../../platform/test-database.ts'
import type { GitCopy, Repository, Sha } from '../git/public.ts'
import { openRepository, restoreGuarded } from '../git/public.ts'
import type { AssistantMachine } from '../machine/public.ts'
import { createMachines, MARK } from '../machine/public.ts'
import {
  findOf,
  INSTALLATION,
  killByMark,
  killStaleOf,
  localKit,
  newControl,
  TEMPLATE,
} from '../machine/test-machine.ts'

/** A bucket of memory: puts that fail on demand, and what it holds, by key. */
export function memoryCopy() {
  const held = new Map<string, { version: number; sha: Sha; bundle: Buffer }>()
  const refuse = { puts: 0, removes: 0 }
  const copy: GitCopy = {
    async put({ companyId, projectId, version, sha, bundle }) {
      if (refuse.puts > 0) {
        refuse.puts -= 1
        throw new Error('the bucket is out')
      }
      held.set(`${companyId}/${projectId}/${version}`, {
        version,
        sha,
        bundle: Buffer.from(bundle),
      })
    },
    async newestVersion(ids) {
      return (await copy.latest({ ...ids, maxBytes: Number.MAX_SAFE_INTEGER }))?.version ?? null
    },
    async latest({ companyId, projectId }) {
      const mine = [...held]
        .filter(([key]) => key.startsWith(`${companyId}/${projectId}/`))
        .map(([, copied]) => copied)
        .sort((a, b) => b.version - a.version)
      return mine[0] ?? null
    },
    async removeProject({ companyId, projectId }) {
      if (refuse.removes > 0) {
        refuse.removes -= 1
        throw new Error('the bucket is out')
      }
      for (const key of held.keys())
        if (key.startsWith(`${companyId}/${projectId}/`)) held.delete(key)
    },
  }
  return { copy, held, refuse }
}

/** What a test sets: where a save waits, and how many kills fail. */
type Knobs = {
  /** While set, a save waits before it checks the turn's commit in. */
  holdReceive: Promise<void> | undefined
  /** The next kills that fail, as an E2B that is out. */
  refuseKills: number
  /** While set, taking the version from the machine says it `arrived` and waits for `released`. */
  holdPack: { arrived: () => void; released: Promise<void> } | undefined
}

function newKnobs(): Knobs {
  return { holdReceive: undefined, refuseKills: 0, holdPack: undefined }
}

/** A repository whose save waits where a test says: before `receive`. */
function withKnobs(real: Repository, knobs: Knobs): Repository {
  return {
    ...real,
    async receive(input) {
      await knobs.holdReceive
      return real.receive(input)
    },
  }
}

/**
 * The Assistant's machines as doubles: a folder of this computer of their own, which a test steers
 * through `control` and whose killed conversations `killed` lists.
 */
export function testAssistantMachines(folder: string) {
  const assistantFolder = join(folder, 'assistant')
  const control = newControl()
  const killed: ConversationId[] = []
  // The installation's marks, as `builderPortsOf` makes them: the machines carry them and the kill looks for them.
  const mark = { [MARK.origin]: INSTALLATION, conexus_probe: 'marks' }
  const kill = killByMark(control, mark)
  const deps: AssistantMachine = {
    kit: localKit(assistantFolder, control),
    api: {
      kill: async (conversationId) => {
        killed.push(conversationId)
        return kill(conversationId)
      },
      killStale: killStaleOf(control),
      find: findOf(control),
    },
    template: TEMPLATE,
    installation: INSTALLATION,
    mark,
  }
  const tuning = { workFolder: join(assistantFolder, 'work'), startMs: 5_000 }
  return { deps, tuning, control, killed, folder: assistantFolder }
}

/** The Builder's Git and machines as doubles (T14): the repository is real, on the test config's
 * folder; the machine is a folder of this computer (`localKit`), whose start and outcome a test
 * sets through `control`; the bucket is `memoryCopy`.
 */
export function testBuilderPorts(
  config: Config,
  machineFolder = join(config.gitRoot, `conexus-machine-${randomUUID()}`),
) {
  const folder = machineFolder
  const control = newControl()
  const bucket = memoryCopy()
  // The conversations whose machines the provider was asked to kill.
  const killed: ConversationId[] = []
  const knobs = newKnobs()
  function repository(ids: { companyId: CompanyId; projectId: ProjectId }) {
    const real = openRepository({ root: config.gitRoot, ...ids, log: silent })
    return restoreGuarded(withKnobs(real, knobs), bucket.copy, ids)
  }
  function machinesOf() {
    const machines = createMachines({
      log: silent,
      kit: localKit(folder, control),
      api: {
        kill: async (conversationId) => {
          if (knobs.refuseKills > 0) {
            knobs.refuseKills -= 1
            throw new Error('E2B is out')
          }
          killed.push(conversationId)
          const started = control.names.includes(`conexus-${INSTALLATION}-${conversationId}`)
          if (started) control.killed = true
          return started ? 1 : 0
        },
        killStale: async () => 0,
      },
      mark: { conexus_origin: INSTALLATION },
      installation: INSTALLATION,
      template: TEMPLATE,
      seedOf: async (ids) => {
        const git = repository(ids)
        await git.ensure()
        return git.bundleOfMain()
      },
      workdir: join(folder, 'app'),
      tmp: folder,
      startMs: 5_000,
      // None until a test writes one there (`conversation-check.test.ts`): the check cannot run.
      checkProgram: join(folder, 'check'),
    })
    const pack = machines.pack.bind(machines)
    machines.pack = async (input) => {
      const held = knobs.holdPack
      held?.arrived()
      await held?.released
      return pack(input)
    }
    return machines
  }
  const assistantMachines = testAssistantMachines(folder)
  return {
    machinesOf,
    assistantMachine: assistantMachines.deps,
    assistantTuning: assistantMachines.tuning,
    assistantMachines,
    repository,
    copy: bucket.copy,
    bucket,
    control,
    knobs,
    killed,
    folder,
  }
}
