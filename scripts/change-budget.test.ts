import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { after, test } from 'node:test'

const SCRIPT = resolve(import.meta.dirname, 'change-budget.ts')
const dirs: string[] = []
after(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true })
})

function git(dir: string, ...args: string[]): string {
  const result = spawnSync(
    'git',
    ['-c', 'user.name=t', '-c', 'user.email=t@example.test', ...args],
    {
      cwd: dir,
      encoding: 'utf8',
    },
  )
  assert.equal(result.status, 0, result.stderr)
  return result.stdout.trim()
}

function write(dir: string, path: string, value: string) {
  mkdirSync(dirname(join(dir, path)), { recursive: true })
  writeFileSync(join(dir, path), value)
}

test('reports total and per-unit code changes, excluding tests and generated output', () => {
  const dir = mkdtempSync(join(tmpdir(), 'conexus-budget-'))
  dirs.push(dir)
  git(dir, 'init', '-q', '-b', 'main')
  write(
    dir,
    'docs/steps/e04.1-invite.md',
    [
      '## U1 Link',
      '### O raio da mudança',
      '| `apps/server/src/`, `packages/hub-api/src/` |',
      'U1 **1.700**',
      '',
    ].join('\n'),
  )
  write(dir, 'apps/server/src/handler.ts', 'old\n')
  git(dir, 'add', '.')
  git(dir, 'commit', '-qm', 'base')
  const base = git(dir, 'rev-parse', 'HEAD')
  write(dir, 'apps/server/src/handler.ts', 'one\ntwo\nthree\n')
  write(dir, 'apps/server/src/handler.test.ts', 'test\n'.repeat(8))
  write(dir, 'apps/server/dist/handler.js', 'generated\n'.repeat(4))
  git(dir, 'add', '.')
  git(dir, 'commit', '-qm', 'change')
  const result = spawnSync('node', [SCRIPT, '--base', base, '--root', dir], {
    encoding: 'utf8',
    timeout: 120_000,
  })
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /\| U1 \| 4 \| 1700 \|/)
  assert.match(result.stdout, /\| Total \| 4 \| — \|/)
})
