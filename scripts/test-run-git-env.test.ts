import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { after, test } from 'node:test'

const RUNNER = resolve(import.meta.dirname, 'test-run.ts')
const dirs: string[] = []
after(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true })
})

function clean(): Record<string, string | undefined> {
  return Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('GIT_')))
}

function git(cwd: string, ...args: string[]): string {
  const run = spawnSync('git', args, { cwd, encoding: 'utf8', env: clean() })
  assert.equal(run.status, 0, run.stderr)
  return run.stdout
}

function state(repo: string): string {
  return [
    git(repo, 'for-each-ref', '--format=%(refname) %(objectname)'),
    git(repo, 'config', '--local', '--list'),
    git(repo, 'symbolic-ref', 'HEAD'),
  ].join('\n')
}

test('os testes que o test-run roda não escrevem no repositório de quem o chama, mesmo com GIT_DIR herdado', () => {
  const dir = mkdtempSync(join(tmpdir(), 'conexus-test-run-'))
  dirs.push(dir)
  const real = join(dir, 'real')
  git(dir, 'init', '-q', '-b', 'main', real)
  git(
    real,
    '-c',
    'user.name=t',
    '-c',
    'user.email=t@t',
    'commit',
    '-q',
    '--allow-empty',
    '-m',
    'one',
  )
  const suite = join(dir, 'suite')
  mkdirSync(suite)
  writeFileSync(
    join(suite, 'scratch.test.ts'),
    `import { execFileSync } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
test('cria um repositório de teste', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'scratch-'))
  const run = (...args: string[]) => execFileSync('git', args, { cwd, stdio: 'ignore' })
  run('init', '-q', '-b', 'scratch')
  run('-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '--allow-empty', '-m', 'x')
  run('branch', 'other')
  run('config', 'core.bare', 'true')
})
`,
  )
  const before = state(real)
  const run = spawnSync(process.execPath, [RUNNER, join(suite, 'scratch.test.ts')], {
    encoding: 'utf8',
    env: {
      ...clean(),
      NODE_TEST_CONTEXT: undefined,
      GIT_DIR: join(real, '.git'),
      GIT_WORK_TREE: real,
    },
  })
  assert.equal(run.status, 0, run.stdout + run.stderr)
  assert.equal(state(real), before)
})
