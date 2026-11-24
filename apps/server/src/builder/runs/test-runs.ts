import { randomUUID } from 'node:crypto'
import { lstatSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { VERSION_FOLDER } from '@conexus/app/check'
import type { AppSessionToken, CompanyId, ConversationId, ProjectId } from '@conexus/hub-api'
import { AppSessionToken as AppSessionTokenSchema } from '@conexus/hub-api'
import type { Conference } from '../../hub/apps/public.ts'
import { folder as version } from '../../hub/apps/test-version-folder.ts'
import type { Config } from '../../platform/config.ts'
import type { Result } from '../../platform/result.ts'
import { silent } from '../../platform/test-database.ts'
import type { GitCopy, Repository } from '../git/public.ts'
import { openRepository, restoreGuarded } from '../git/public.ts'
import type { BrowserReport, ConferPlatformFailed, Sha } from '../machine/public.ts'
import { createMachines } from '../machine/public.ts'
import { testConversationMachines } from '../machine/test-conversation-machines.ts'
import { INSTALLATION, localKit, newControl, TEMPLATE } from '../machine/test-machine.ts'
import type { BuilderConfer } from './context.ts'

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
  /** What `confer.open` answers: the conference opens by default. */
  opening: Result<Conference, ConferPlatformFailed>
  /** What the machine's browser saw: a clean screen by default. */
  seeing: Result<BrowserReport, ConferPlatformFailed>
  /** The sessions the check opened and ended, the times its browser ran, and the most sessions open at once. */
  conferred: {
    opened: AppSessionToken[]
    ended: AppSessionToken[]
    browsed: number
    peak: number
  }
}

const SESSION = AppSessionTokenSchema.parse('c'.repeat(43))

function newKnobs(): Knobs {
  return {
    holdReceive: undefined,
    refuseKills: 0,
    holdPack: undefined,
    opening: {
      ok: true,
      value: { kind: 'OPENED', url: new URL('https://conferencia.test/'), session: SESSION },
    },
    seeing: {
      ok: true,
      value: { kind: 'CLEAN', shot: 'node_modules/.conexus/tela.png', console: [] },
    },
    conferred: { opened: [], ended: [], browsed: 0, peak: 0 },
  }
}

/**
 * What the template's check leaves in the app folder when it passes, for a check program of a
 * test that leaves nothing of its own: a version the turn's browser check can pack.
 */
function leaveVersion(app: string): void {
  const root = join(app, VERSION_FOLDER)
  if (lstatSync(root, { throwIfNoEntry: false }) !== undefined) return
  const { manifest, files } = version()
  const left = files.map(({ path, base64 }) => ({ path, bytes: Buffer.from(base64, 'base64') }))
  left.push({ path: 'manifest.json', bytes: Buffer.from(JSON.stringify(manifest)) })
  for (const { path, bytes } of left) {
    mkdirSync(dirname(join(root, path)), { recursive: true })
    writeFileSync(join(root, path), bytes)
  }
}

/** The Hub's conference as a double: it answers `knobs.opening` and keeps the sessions it opened and ended. */
function conferOf(knobs: Knobs): BuilderConfer {
  return {
    async open() {
      const { opening } = knobs
      if (opening.ok && opening.value.kind === 'OPENED') {
        const { conferred } = knobs
        conferred.opened.push(opening.value.session)
        conferred.peak = Math.max(conferred.peak, conferred.opened.length - conferred.ended.length)
      }
      return opening
    },
    async end({ session }) {
      knobs.conferred.ended.push(session)
    },
  }
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

/** The machines' pack, check and browser as the tests drive them: the pack waits where a test says, a passing check leaves a version, the browser sees what `knobs` say. */
function doubled(machines: ReturnType<typeof createMachines>, knobs: Knobs, folder: string): void {
  const pack = machines.pack.bind(machines)
  machines.pack = async (input) => {
    // The send's pack: the check's own comes before any conference opened.
    const held = knobs.conferred.opened.length > 0 ? knobs.holdPack : undefined
    held?.arrived()
    await held?.released
    return pack(input)
  }
  const check = machines.check.bind(machines)
  machines.check = async (input) => {
    const checked = await check(input)
    if (checked.ok && checked.value.ok) leaveVersion(join(folder, 'app'))
    return checked
  }
  machines.confer = async () => {
    knobs.conferred.browsed += 1
    await new Promise((later) => setTimeout(later, 20))
    return knobs.seeing
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
    doubled(machines, knobs, folder)
    return machines
  }
  const conversationMachines = testConversationMachines(folder)
  return {
    machinesOf,
    confer: conferOf(knobs),
    conversationMachine: conversationMachines.deps,
    machineTuning: conversationMachines.tuning,
    conversationMachines,
    repository,
    copy: bucket.copy,
    bucket,
    control,
    knobs,
    killed,
    folder,
  }
}
