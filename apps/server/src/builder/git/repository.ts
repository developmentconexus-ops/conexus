import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { CompanyId, ProjectId, RunId } from '@conexus/hub-api'
import type { FailureLog } from '../../platform/failure.ts'
import type { Result } from '../../platform/result.ts'
import type { Context } from './context.ts'
import { git, inMain, MAIN, MAX_BYTES, readRef, Sha, text } from './context.ts'
import { GitFault, runGit } from './exec.ts'
import type { FileRead, SaveRefusal, TreeFile } from './tree.ts'
import { fileOf, inspectTree, treeOf } from './tree.ts'

/** The ref a machine's bundle carries its one commit under. */
export const CANDIDATE_REF = 'refs/conexus/candidate'
const EMPTY_TREE = '4b825dc642cb6eb9a060e54bf8d69288fbee4904'
const NO_OBJECT = '0'.repeat(40)
const IDENTITY = ['-c', 'user.name=Conexus Builder', '-c', 'user.email=builder@conexus.invalid']

export type Repository = {
  /** Creates the repository with an empty first commit on `main` if it has none; answers `main`. */
  ensure(): Promise<Sha>
  main(): Promise<Sha>
  /** A bundle holding `main` only, for a machine to fetch as its seed. */
  bundleOfMain(): Promise<Buffer>
  /** A bundle holding a run's candidate, with its history, for the copy. */
  bundleOfRun(runId: RunId): Promise<Buffer>
  /** Which version a commit is: its depth in history, the empty first commit not counted. */
  versionAt(sha: Sha): Promise<number>
  /** Takes the one commit of a machine's bundle into the run's own ref, or says why not. */
  receive(input: { runId: RunId; bundle: Uint8Array; base: Sha }): Promise<Result<Sha, SaveRefusal>>
  /** Moves `main` from exactly `base` to `candidate`; `stale` when `main` is anywhere else. */
  advance(input: { candidate: Sha; base: Sha }): Promise<'advanced' | 'stale'>
  /** Whether `main` holds this commit in its history. */
  contains(sha: Sha): Promise<boolean>
  tree(sha: Sha): Promise<TreeFile[] | null>
  file(input: { sha: Sha; path: string; maxBytes: number }): Promise<FileRead>
  /** How many versions `main` holds: its commits but the empty first one. */
  version(): Promise<number>
  remove(): Promise<void>
}

async function ensure(context: Context): Promise<Sha> {
  await mkdir(join(context.dir, '..'), { recursive: true, mode: 0o700 })
  await runGit(['init', '--quiet', '--bare', '--template=', context.dir], {
    timeoutMs: context.timeoutMs,
    maxOutput: 1024,
  })
  await git(context, ['symbolic-ref', 'HEAD', MAIN])
  const existing = await readRef(context, MAIN)
  if (existing !== null) return existing
  await git(context, ['hash-object', '-t', 'tree', '-w', '--stdin'])
  const first = Sha.parse(
    await text(context, [...IDENTITY, 'commit-tree', EMPTY_TREE, '-m', 'Start the app']),
  )
  // Create-only: an ensure that got there first wins, and this one answers its `main`.
  await git(context, ['update-ref', MAIN, first, NO_OBJECT]).catch(async (error: unknown) => {
    if ((await readRef(context, MAIN)) === null) throw error
  })
  return main(context)
}

async function main(context: Context): Promise<Sha> {
  const found = await readRef(context, MAIN)
  if (found === null) throw new GitFault('failed', 'main is missing')
  return found
}

async function version(context: Context): Promise<number> {
  return Number(await text(context, ['rev-list', '--count', MAIN])) - 1
}

async function advance(
  context: Context,
  { candidate, base }: { candidate: Sha; base: Sha },
): Promise<'advanced' | 'stale'> {
  const moved = await git(context, ['update-ref', MAIN, candidate, base]).then(
    () => true,
    async (error: unknown) => {
      // A failed update is read back: `main` at the candidate converged, anywhere else it moved.
      const now = await readRef(context, MAIN)
      if (now === candidate) return true
      if (now === base) throw error
      return false
    },
  )
  if (moved && (await version(context)) % context.gcEvery === 0) {
    await git(context, ['gc', '--quiet']).catch((error: unknown) =>
      context.log.error({ error: String(error) }, 'GIT_GC_FAILED'),
    )
  }
  return moved ? 'advanced' : 'stale'
}

async function fetchCandidate(
  context: Context,
  runId: RunId,
  bundle: Uint8Array,
): Promise<boolean> {
  // Beside the repository, on its volume: the container's /tmp is a small tmpfs.
  const directory = await mkdtemp(join(context.dir, 'incoming-'))
  try {
    const file = join(directory, 'candidate.bundle')
    await writeFile(file, bundle, { mode: 0o600 })
    const fetched = await git(
      context,
      [
        '-c',
        'transfer.fsckObjects=true',
        '-c',
        'fetch.fsckObjects=true',
        'fetch',
        '--quiet',
        '--no-tags',
        '--no-write-fetch-head',
        file,
        `+${CANDIDATE_REF}:${runRef(runId)}`,
      ],
      { answers: [128] },
    ).catch((error: unknown) => {
      if (error instanceof GitFault && error.kind === 'failed') return null
      throw error
    })
    return fetched !== null
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}

function runRef(runId: RunId): string {
  return `refs/conexus/runs/${runId}`
}

async function refuse(
  context: Context,
  runId: RunId,
  error: SaveRefusal,
): Promise<Result<Sha, SaveRefusal>> {
  await git(context, ['update-ref', '-d', runRef(runId)], { answers: [1] })
  return { ok: false, error }
}

async function receive(
  context: Context,
  { runId, bundle, base }: { runId: RunId; bundle: Uint8Array; base: Sha },
): Promise<Result<Sha, SaveRefusal>> {
  if (bundle.byteLength > MAX_BYTES) return refuse(context, runId, 'too-large')
  if (!(await fetchCandidate(context, runId, bundle))) return refuse(context, runId, 'corrupt')
  const ref = runRef(runId)
  const [commit = '', ...parents] = (
    await text(context, ['rev-list', '--parents', '-n', '1', ref])
  ).split(' ')
  const added = Number(await text(context, ['rev-list', '--count', ref, `^${base}`]))
  if (added !== 1) return refuse(context, runId, 'two-commits')
  if (parents.join('') !== base) return refuse(context, runId, 'wrong-parent')
  const reason = await inspectTree(context, ref)
  if (reason !== null) return refuse(context, runId, reason)
  return { ok: true, value: Sha.parse(commit) }
}

export function openRepository(input: {
  root: string
  companyId: CompanyId
  projectId: ProjectId
  log: FailureLog
  timeoutMs?: number
  gcEvery?: number
}): Repository {
  const context: Context = {
    dir: join(input.root, input.companyId, `${input.projectId}.git`),
    timeoutMs: input.timeoutMs ?? 60_000,
    gcEvery: input.gcEvery ?? 50,
    log: input.log,
  }
  return {
    ensure: () => ensure(context),
    main: () => main(context),
    bundleOfMain: async () =>
      (await git(context, ['bundle', 'create', '--quiet', '-', MAIN])).stdout,
    bundleOfRun: async (runId) =>
      (await git(context, ['bundle', 'create', '--quiet', '-', runRef(runId)])).stdout,
    versionAt: async (sha) => Number(await text(context, ['rev-list', '--count', sha])) - 1,
    receive: (received) => receive(context, received),
    advance: (moved) => advance(context, moved),
    contains: (sha) => inMain(context, sha),
    tree: (sha) => treeOf(context, sha),
    file: (read) => fileOf(context, read),
    version: () => version(context),
    remove: () => rm(context.dir, { recursive: true, force: true }),
  }
}
