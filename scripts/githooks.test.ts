import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { after, test } from 'node:test'
import { runCommand } from './command.ts'

const ROOT = resolve(import.meta.dirname, '..')
const HOOK = join(ROOT, '.githooks/pre-push')
const ZERO = '0'.repeat(40)
const dirs: string[] = []
after(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true })
})

function folder(): string {
  const dir = mkdtempSync(join(tmpdir(), 'conexus-hooks-'))
  dirs.push(dir)
  return dir
}

function push(stdin: string, failing?: string) {
  const dir = folder()
  const bin = join(dir, 'bin')
  mkdirSync(bin)
  const log = join(dir, 'npm.log')
  writeFileSync(
    join(bin, 'npm'),
    `#!/bin/sh\necho "$@" >> "${log}"\n[ "$*" = "run ${failing}" ] && exit 1\nexit 0\n`,
  )
  chmodSync(join(bin, 'npm'), 0o755)
  const run = spawnSync('sh', [HOOK], {
    input: stdin,
    encoding: 'utf8',
    env: { ...process.env, PATH: `${bin}:${process.env.PATH}` },
  })
  const calls = (() => {
    try {
      return readFileSync(log, 'utf8').trim().split('\n')
    } catch {
      return []
    }
  })()
  return { status: run.status, calls }
}

test('o pre-push é executável e roda o check e os testes dos scripts, nesta ordem', () => {
  assert.ok(statSync(HOOK).mode & 0o111)
  const run = push(`refs/heads/a ${'1'.repeat(40)} refs/heads/a ${ZERO}\n`)
  assert.equal(run.status, 0)
  assert.deepEqual(run.calls, ['run check', 'run test:scripts'])
})

test('o check vermelho segura o push e os testes dos scripts nem começam', () => {
  const run = push(`refs/heads/a ${'1'.repeat(40)} refs/heads/a ${ZERO}\n`, 'check')
  assert.equal(run.status, 1)
  assert.deepEqual(run.calls, ['run check'])
})

test('os testes dos scripts vermelhos seguram o push', () => {
  const run = push(`refs/heads/a ${'1'.repeat(40)} refs/heads/a ${ZERO}\n`, 'test:scripts')
  assert.equal(run.status, 1)
})

test('apagar um branch remoto não roda nada', () => {
  const run = push(`(delete) ${ZERO} refs/heads/a ${'1'.repeat(40)}\n`)
  assert.equal(run.status, 0)
  assert.deepEqual(run.calls, [])
})

test('o instalador liga o core.hooksPath de um checkout e diz quando não há checkout', () => {
  const repo = folder()
  runCommand('git', ['init', '-q'], { cwd: repo })
  const on = spawnSync('node', [join(ROOT, 'scripts/install-hooks.ts'), repo], { encoding: 'utf8' })
  assert.equal(on.status, 0, on.stderr)
  assert.equal(
    runCommand('git', ['config', '--local', 'core.hooksPath'], { cwd: repo }).trim(),
    '.githooks',
  )
  const bare = spawnSync('node', [join(ROOT, 'scripts/install-hooks.ts'), folder()], {
    encoding: 'utf8',
  })
  assert.equal(bare.status, 0)
  assert.match(bare.stdout, /was not turned on/)
})
