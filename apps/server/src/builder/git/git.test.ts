import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { CompanyId, ProjectId, RunId } from '@conexus/hub-api'
import { CANDIDATE_REF, openRepository, restoreGuarded, Sha } from './public.ts'

const COMPANY = CompanyId.parse('companyAAAAAAAAAAAAAAAAAAAAAAAAA')
const PROJECT = ProjectId.parse('projectAAAAAAAAAAAAAAAAAAAAAAAAA')
const IDENTITY = {
  GIT_AUTHOR_NAME: 'Maquina',
  GIT_AUTHOR_EMAIL: 'maquina@example.test',
  GIT_COMMITTER_NAME: 'Maquina',
  GIT_COMMITTER_EMAIL: 'maquina@example.test',
}

function sh(cwd: string, ...args: string[]): string {
  return execFileSync('git', args, {
    cwd,
    env: { PATH: '/usr/bin:/bin', ...IDENTITY },
    encoding: 'utf8',
  })
}

function scratch(t: TestContext): string {
  const dir = mkdtempSync(join(tmpdir(), 'conexus-git-test-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  return dir
}

async function opened(t: TestContext, options: { timeoutMs?: number; gcEvery?: number } = {}) {
  const root = scratch(t)
  const errors: string[] = []
  const log = {
    info: () => undefined,
    error: (_: unknown, message: string) => errors.push(message),
  }
  const repository = openRepository({
    root,
    companyId: COMPANY,
    projectId: PROJECT,
    log,
    ...options,
  })
  return { root, errors, repository, base: await repository.ensure() }
}

type Machine = { dir: string; head: () => string }

/** What the machine does: fetches the seed, edits, commits, and bundles the one commit on the base. */
async function machine(t: TestContext, seed: Buffer) {
  const dir = scratch(t)
  writeFileSync(join(dir, '.seed.bundle'), seed)
  sh(dir, 'init', '-q', '-b', 'work')
  sh(dir, 'fetch', '-q', '.seed.bundle', 'refs/heads/main:refs/remotes/seed/main')
  sh(dir, 'checkout', '-q', '-B', 'main', 'refs/remotes/seed/main')
  return { dir, head: () => sh(dir, 'rev-parse', 'HEAD').trim() } satisfies Machine
}

function commit(dir: string, message = 'turno'): void {
  sh(dir, 'add', '-A', '--', '.', ':(exclude).seed.bundle')
  sh(dir, 'commit', '-q', '--allow-empty', '-m', message)
}

function bundle(dir: string, base: string): Buffer {
  sh(dir, 'update-ref', CANDIDATE_REF, 'HEAD')
  const file = join(dir, 'out.bundle')
  sh(dir, 'bundle', 'create', '-q', file, CANDIDATE_REF, `^${base}`)
  return readFileSync(file)
}

const RUN = RunId.parse('00000000-0000-4000-8000-000000000001')

test('git: o turno que mudou arquivos vira uma versão, e a aba lê só o que o main guarda', async (t) => {
  const { repository, base } = await opened(t)
  assert.equal(await repository.version(), 0)
  const box = await machine(t, await repository.bundleOfMain())
  writeFileSync(join(box.dir, 'a.ts'), 'export const a = 1\n')
  writeFileSync(join(box.dir, 'logo.bin'), Buffer.from([0, 1, 2, 255]))
  mkdirSync(join(box.dir, 'src'), { recursive: true })
  writeFileSync(join(box.dir, 'src', 'b.ts'), 'x'.repeat(2_000))
  commit(box.dir)
  const received = await repository.receive({ runId: RUN, bundle: bundle(box.dir, base), base })
  assert.ok(received.ok)
  const candidate = received.value
  assert.equal(candidate, box.head())
  assert.equal(await repository.contains(candidate), false)
  assert.deepEqual(await repository.file({ sha: candidate, path: 'a.ts', maxBytes: 100 }), {
    kind: 'not-found',
  })
  assert.equal(await repository.advance({ candidate, base }), 'advanced')
  assert.equal(await repository.advance({ candidate, base }), 'advanced')
  assert.equal(await repository.main(), candidate)
  assert.equal(await repository.version(), 1)
  assert.equal(await repository.contains(candidate), true)
  assert.deepEqual(await repository.file({ sha: candidate, path: 'a.ts', maxBytes: 100 }), {
    kind: 'text',
    text: 'export const a = 1\n',
  })
  assert.deepEqual(await repository.file({ sha: candidate, path: 'logo.bin', maxBytes: 100 }), {
    kind: 'not-text',
  })
  assert.deepEqual(await repository.file({ sha: candidate, path: 'src/b.ts', maxBytes: 100 }), {
    kind: 'too-large',
  })
  assert.deepEqual(await repository.file({ sha: candidate, path: 'nada.ts', maxBytes: 100 }), {
    kind: 'not-found',
  })
  const turn = new Set(['a.ts', 'logo.bin', 'src/b.ts'])
  const tree = (await repository.tree(candidate)) ?? []
  assert.deepEqual(
    tree.filter((file) => turn.has(file.path)),
    [
      { path: 'a.ts', bytes: 19 },
      { path: 'logo.bin', bytes: 4 },
      { path: 'src/b.ts', bytes: 2_000 },
    ],
  )
  assert.ok(tree.some((file) => file.path === 'src/main.tsx'))
  assert.equal(await repository.tree(Sha.parse('1'.repeat(40))), null)
})

test('git: a base velha não move o main; o main nunca anda para trás', async (t) => {
  const { repository, base } = await opened(t)
  const first = await machine(t, await repository.bundleOfMain())
  writeFileSync(join(first.dir, 'a.ts'), '1\n')
  commit(first.dir)
  const second = await machine(t, await repository.bundleOfMain())
  writeFileSync(join(second.dir, 'b.ts'), '2\n')
  commit(second.dir)
  const one = await repository.receive({ runId: RUN, bundle: bundle(first.dir, base), base })
  const other = RunId.parse('00000000-0000-4000-8000-000000000002')
  const two = await repository.receive({ runId: other, bundle: bundle(second.dir, base), base })
  assert.ok(one.ok && two.ok)
  assert.equal(await repository.advance({ candidate: one.value, base }), 'advanced')
  assert.equal(await repository.advance({ candidate: two.value, base }), 'stale')
  assert.equal(await repository.main(), one.value)
})

test('git: o gc que falha é anotado e o main segue onde a versão o deixou', async (t) => {
  const { repository, base, root, errors } = await opened(t, { gcEvery: 1 })
  writeFileSync(join(root, COMPANY, `${PROJECT}.git`, 'config'), '[gc]\n\tpruneExpire = nao\n', {
    flag: 'a',
  })
  const box = await machine(t, await repository.bundleOfMain())
  writeFileSync(join(box.dir, 'a.ts'), '1\n')
  commit(box.dir)
  const received = await repository.receive({ runId: RUN, bundle: bundle(box.dir, base), base })
  assert.ok(received.ok)
  assert.equal(await repository.advance({ candidate: received.value, base }), 'advanced')
  assert.deepEqual(errors, ['GIT_GC_FAILED'])
  assert.equal(await repository.main(), received.value)
})

async function refusal(t: TestContext, prepare: (box: Machine, base: string) => Buffer | void) {
  const { repository, base } = await opened(t)
  const box = await machine(t, await repository.bundleOfMain())
  const given = prepare(box, base)
  const sent = given ?? bundle(box.dir, base)
  const result = await repository.receive({ runId: RUN, bundle: sent, base })
  assert.equal(await repository.main(), base)
  return { result, repository, base }
}

test('git: dois commits, pai errado, não regular, corrompido, 2.000 arquivos e 64 MiB são recusados, e o main não muda', async (t) => {
  const cases: Record<string, (box: Machine, base: string) => Buffer | void> = {
    'two-commits': (box) => {
      writeFileSync(join(box.dir, 'a'), '1')
      commit(box.dir)
      writeFileSync(join(box.dir, 'b'), '2')
      commit(box.dir)
    },
    'wrong-parent': (box, base) => {
      sh(box.dir, 'checkout', '-q', '--orphan', 'other')
      writeFileSync(join(box.dir, 'a'), '1')
      commit(box.dir)
      return bundle(box.dir, base)
    },
    'not-regular': (box) => {
      symlinkSync('/etc/passwd', join(box.dir, 'link'))
      commit(box.dir)
    },
    'too-many-files': (box) => {
      for (let n = 0; n <= 2_000; n++) writeFileSync(join(box.dir, `f${n}`), `${n}`)
      commit(box.dir)
    },
    'too-large': (box) => {
      writeFileSync(join(box.dir, 'big'), Buffer.alloc(65 * 1024 * 1024))
      commit(box.dir)
    },
    corrupt: () => Buffer.from('# v2 git bundle\nnot a bundle at all'),
  }
  for (const [name, prepare] of Object.entries(cases)) {
    const { result } = await refusal(t, prepare)
    assert.deepEqual(result, { ok: false, error: name }, name)
  }
})

test('git: um git que passa do prazo é morto e a falha diz que foi o prazo', async (t) => {
  const { root, repository, base } = await opened(t)
  const box = await machine(t, await repository.bundleOfMain())
  writeFileSync(join(box.dir, 'grande'), randomBytes(40 * 1024 * 1024))
  commit(box.dir)
  const slow = openRepository({
    root,
    companyId: COMPANY,
    projectId: PROJECT,
    log: { info: () => undefined, error: () => undefined },
    timeoutMs: 1,
  })
  const started = Date.now()
  await assert.rejects(
    slow.receive({ runId: RUN, bundle: bundle(box.dir, base), base }),
    (error: unknown) => error instanceof Error && Reflect.get(error, 'kind') === 'timeout',
  )
  assert.ok(Date.now() - started < 5_000)
  assert.equal(await repository.main(), base)
})

test('git: remover apaga o repositório, e ensure o refaz vazio', async (t) => {
  const { repository } = await opened(t)
  await repository.remove()
  await assert.rejects(repository.main())
  await repository.ensure()
  assert.equal(await repository.version(), 0)
})

test('git: o histórico passa de 64 MiB e a semente e a cópia seguem', async (t) => {
  const { repository, base } = await opened(t)
  const box = await machine(t, await repository.bundleOfMain())
  let parent = base
  for (const [index, run] of [
    '00000000-0000-4000-8000-000000000011',
    '00000000-0000-4000-8000-000000000012',
    '00000000-0000-4000-8000-000000000013',
  ].entries()) {
    writeFileSync(join(box.dir, `v${index}.bin`), randomBytes(30 * 1024 * 1024))
    rmSync(join(box.dir, `v${index - 1}.bin`), { force: true })
    rmSync(join(box.dir, 'out.bundle'), { force: true })
    commit(box.dir)
    const received = await repository.receive({
      runId: RunId.parse(run),
      bundle: bundle(box.dir, parent),
      base: parent,
    })
    assert.ok(received.ok)
    assert.equal(await repository.advance({ candidate: received.value, base: parent }), 'advanced')
    parent = received.value
  }
  const seed = await repository.bundleOfMain()
  assert.ok(seed.byteLength > 64 * 1024 * 1024)
  const copy = await repository.bundleOfRun(RunId.parse('00000000-0000-4000-8000-000000000013'))
  assert.ok(copy.byteLength > 64 * 1024 * 1024)
  const fresh = await machine(t, seed)
  assert.equal(fresh.head(), parent)
})

test('git: ler não cria o repositório, e ler durante o ensure não falha', async (t) => {
  const root = scratch(t)
  const repository = openRepository({
    root,
    companyId: COMPANY,
    projectId: PROJECT,
    log: { info: () => undefined, error: () => undefined },
  })
  assert.equal(await repository.head(), null)
  assert.equal(await repository.tree(Sha.parse('1'.repeat(40))), null)
  assert.deepEqual(
    await repository.file({ sha: Sha.parse('1'.repeat(40)), path: 'a.ts', maxBytes: 100 }),
    { kind: 'not-found' },
  )
  assert.equal(existsSync(join(root, COMPANY)), false)
  const reads = Array.from({ length: 200 }, () => repository.head())
  const ensures = Array.from({ length: 8 }, () => repository.ensure())
  const [heads, mains] = await Promise.all([Promise.all(reads), Promise.all(ensures)])
  assert.equal(new Set(mains).size, 1)
  assert.ok(heads.every((found) => found === null || found === mains[0]))
  assert.equal(await repository.head(), mains[0])
})

test('git: sem Git no disco e com cópia, ensure recusa e não recria vazio; sem cópia cria, e com o Git no disco segue', async (t) => {
  const root = scratch(t)
  const ids = { companyId: COMPANY, projectId: PROJECT }
  const folder = join(root, COMPANY, `${PROJECT}.git`)
  let copied: number | null = 3
  const repository = restoreGuarded(
    openRepository({ root, ...ids, log: { info: () => undefined, error: () => undefined } }),
    { newestVersion: async () => copied },
    ids,
  )
  await assert.rejects(repository.ensure(), { code: 'GIT_RESTORE_NEEDED' })
  assert.equal(existsSync(folder), false, 'no empty repository was made')
  assert.equal(await repository.head(), null)
  copied = null
  const first = await repository.ensure()
  assert.equal(await repository.version(), 0)
  copied = 3
  assert.equal(await repository.ensure(), first, 'a Git on the disk is never refused')
})
