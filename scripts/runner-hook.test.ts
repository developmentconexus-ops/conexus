import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { after, test } from 'node:test'

const HOOK = resolve(import.meta.dirname, '../infra/runner-job-started.sh')
const dir = mkdtempSync(join(tmpdir(), 'conexus-hook-'))
after(() => rmSync(dir, { recursive: true, force: true }))

function git(cwd: string, ...args: string[]): string {
  const run = spawnSync(
    'git',
    ['-c', 'user.name=test', '-c', 'user.email=test@example.invalid', ...args],
    { cwd, encoding: 'utf8', env: { PATH: process.env.PATH, HOME: dir } },
  )
  assert.equal(run.status, 0, run.stderr)
  return run.stdout.trim()
}

// GitHub's side: main with two commits and a branch off the first. The server's mirror is cloned
// from main alone, then main gets a third commit the mirror has not fetched yet.
const origin = join(dir, 'origin')
git(dir, 'init', '--quiet', '--initial-branch=main', origin)
git(origin, 'commit', '--quiet', '--allow-empty', '-m', 'one')
const first = git(origin, 'rev-parse', 'HEAD')
git(origin, 'commit', '--quiet', '--allow-empty', '-m', 'two')
const onMain = git(origin, 'rev-parse', 'HEAD')
git(origin, 'switch', '--quiet', '--create', 'side', first)
git(origin, 'commit', '--quiet', '--allow-empty', '-m', 'off main')
const offMain = git(origin, 'rev-parse', 'HEAD')
git(origin, 'switch', '--quiet', 'main')
const mirror = join(dir, 'main.git')
git(
  dir,
  'clone',
  '--quiet',
  '--bare',
  '--single-branch',
  '--branch',
  'main',
  `file://${origin}`,
  mirror,
)
git(mirror, 'fetch', '--quiet', 'origin', 'refs/heads/side:refs/heads/side')
git(origin, 'commit', '--quiet', '--allow-empty', '-m', 'three')
const newOnMain = git(origin, 'rev-parse', 'HEAD')

function hook(event: string, ref: string, sha: string, at = mirror) {
  const run = spawnSync('bash', [HOOK, at], {
    encoding: 'utf8',
    timeout: 20_000,
    env: {
      PATH: process.env.PATH,
      HOME: dir,
      GITHUB_EVENT_NAME: event,
      GITHUB_REF: ref,
      GITHUB_SHA: sha,
    },
  })
  return { status: run.status, stderr: run.stderr }
}

const accepted = { status: 0, stderr: '' }

test('um Release de um commit de main é aceito, também o que o espelho ainda não tinha', () => {
  assert.deepEqual(hook('release', 'refs/tags/v0.8.0', onMain), accepted)
  assert.deepEqual(hook('release', 'refs/tags/v0.8.1', newOnMain), accepted)
})

test('um disparo manual de main é aceito', () => {
  assert.deepEqual(hook('workflow_dispatch', 'refs/heads/main', newOnMain), accepted)
})

test('um Release de um commit fora de main é recusado', () => {
  assert.deepEqual(hook('release', 'refs/tags/v0.8.0', offMain), {
    status: 1,
    stderr: `refused: the commit ${offMain} is not on main\n`,
  })
  const unknown = 'f'.repeat(40)
  assert.deepEqual(hook('release', 'refs/tags/v0.8.0', unknown), {
    status: 1,
    stderr: `refused: the commit ${unknown} is not on main\n`,
  })
})

test('um disparo manual de main num commit fora de main é recusado', () => {
  assert.deepEqual(hook('workflow_dispatch', 'refs/heads/main', offMain), {
    status: 1,
    stderr: `refused: the commit ${offMain} is not on main\n`,
  })
})

test('sem espelho, ou sem conseguir buscar main, tudo é recusado', () => {
  const absent = join(dir, 'absent.git')
  assert.deepEqual(hook('release', 'refs/tags/v0.8.0', onMain, absent), {
    status: 1,
    stderr: `refused: no mirror of main at ${absent}\n`,
  })
  const broken = join(dir, 'broken.git')
  git(dir, 'clone', '--quiet', '--bare', `file://${origin}`, broken)
  git(broken, 'remote', 'set-url', 'origin', `file://${join(dir, 'gone')}`)
  assert.deepEqual(hook('workflow_dispatch', 'refs/heads/main', onMain, broken), {
    status: 1,
    stderr: `refused: could not fetch main into ${broken}\n`,
  })
})

test('um commit que não é um nome de commit é recusado', () => {
  assert.deepEqual(hook('release', 'refs/tags/v0.8.0', '--all'), {
    status: 1,
    stderr: "refused: '--all' is not a commit\n",
  })
  assert.deepEqual(hook('release', 'refs/tags/v0.8.0', ''), {
    status: 1,
    stderr: "refused: '' is not a commit\n",
  })
})

test('um push é recusado, mesmo em main', () => {
  assert.deepEqual(hook('push', 'refs/heads/main', onMain), {
    status: 1,
    stderr: "refused: a 'push' event does not reach this runner\n",
  })
})

test('um pull request é recusado', () => {
  assert.deepEqual(hook('pull_request', 'refs/pull/9/merge', onMain), {
    status: 1,
    stderr: "refused: a 'pull_request' event does not reach this runner\n",
  })
})

test('um evento sem nome é recusado', () => {
  assert.deepEqual(hook('', '', ''), {
    status: 1,
    stderr: "refused: a '' event does not reach this runner\n",
  })
})

test('um disparo manual de outro ramo é recusado', () => {
  assert.deepEqual(hook('workflow_dispatch', 'refs/heads/feat/x', onMain), {
    status: 1,
    stderr: 'refused: a manual run of refs/heads/feat/x is not main\n',
  })
  assert.deepEqual(hook('workflow_dispatch', 'refs/tags/v0.8.0', onMain), {
    status: 1,
    stderr: 'refused: a manual run of refs/tags/v0.8.0 is not main\n',
  })
})
