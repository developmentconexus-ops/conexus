import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import type { CompanyId, ProjectId } from '@conexus/hub-api'
import type { Config } from '../../platform/config.ts'
import type { Database } from '../../platform/database.ts'
import { silent } from '../../platform/test-database.ts'
import type { GitCopy, Sha } from '../git/public.ts'
import { openRepository } from '../git/public.ts'
import type { MachineApi } from '../machine/public.ts'
import { createMachines } from '../machine/public.ts'
import { localKit, newControl } from '../machine/test-machine.ts'

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

/** What a test sets: how long a turn may run, how often its lease is renewed, and how a save is cut. */
type Knobs = {
  turnMs: number
  renewMs: number
  dies: { receive: number; advance: number }
  /** While set, a save waits before it moves `main`. */
  holdAdvance: Promise<void> | undefined
}

function newKnobs(): Knobs {
  return {
    turnMs: 3_600_000,
    renewMs: 30_000,
    dies: { receive: 0, advance: 0 },
    holdAdvance: undefined,
  }
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
  const killed: string[] = []
  const listed: Awaited<ReturnType<MachineApi['list']>> = []
  const knobs = newKnobs()
  function repository(ids: { companyId: CompanyId; projectId: ProjectId }) {
    const real = openRepository({ root: config.gitRoot, ...ids, log: silent })
    function dies(step: 'receive' | 'advance') {
      if (knobs.dies[step] === 0) return
      knobs.dies[step] -= 1
      throw new Error('the process died')
    }
    return {
      ...real,
      async receive(input: Parameters<typeof real.receive>[0]) {
        dies('receive')
        return real.receive(input)
      },
      async advance(input: Parameters<typeof real.advance>[0]) {
        await knobs.holdAdvance
        dies('advance')
        return real.advance(input)
      },
    }
  }
  function machinesOf(database: Database) {
    return createMachines({
      database,
      log: silent,
      kit: localKit(folder, control),
      api: {
        exists: async () => control.exists,
        list: async () => listed,
        kill: async (id) => {
          killed.push(id)
        },
      },
      mark: { conexus_origin: 'hub.example.test' },
      seedOf: async (ids) => {
        const git = repository(ids)
        await git.ensure()
        return git.bundleOfMain()
      },
      workdir: join(folder, 'app'),
      tmp: folder,
      startMs: 5_000,
    })
  }
  function turnMs() {
    return knobs.turnMs
  }
  function renewMs() {
    return knobs.renewMs
  }
  return {
    machinesOf,
    repository,
    copy: bucket.copy,
    turnMs,
    renewMs,
    bucket,
    control,
    knobs,
    killed,
    listed,
    folder,
  }
}
