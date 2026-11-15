import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { test } from 'node:test'
import { parse } from 'yaml'

type Step = { id?: string; run?: string }
const workflow: { jobs: { scope: { steps: Step[] } } } = parse(
  readFileSync(resolve(import.meta.dirname, '../.github/workflows/ci.yml'), 'utf8'),
)
const SCRIPT = workflow.jobs.scope.steps.find((step) => step.id === 'scope')?.run ?? ''

function git(dir: string, ...args: string[]): string {
  return execFileSync('git', ['-C', dir, '-c', 'user.name=t', '-c', 'user.email=t@t', ...args], {
    encoding: 'utf8',
  }).trim()
}

function commit(dir: string, files: Record<string, string>): string {
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true })
    writeFileSync(join(dir, path), content)
  }
  git(dir, 'add', '-A')
  git(dir, 'commit', '-q', '-m', 'x')
  return git(dir, 'rev-parse', 'HEAD')
}

function scope(dir: string, event: string, before: string, sha: string): string {
  const output = join(dir, '.scope-output')
  writeFileSync(output, '')
  execFileSync('bash', ['--noprofile', '--norc', '-e', '-c', SCRIPT], {
    cwd: dir,
    env: {
      PATH: process.env.PATH ?? '',
      EVENT: event,
      BASE_REF: 'main',
      BEFORE: before,
      SHA: sha,
      GITHUB_OUTPUT: output,
      GITHUB_STEP_SUMMARY: '/dev/null',
    },
  })
  return readFileSync(output, 'utf8').trim()
}

test('o scope lê o intervalo do push e só chama de documento o que a lista nomeia', () => {
  const dir = mkdtempSync(join(tmpdir(), 'conexus-scope-'))
  try {
    git(dir, 'init', '-q')
    const base = commit(dir, { 'docs/a.md': 'a', 'scripts/s.ts': 's' })
    const documents = commit(dir, { 'docs/b.md': 'b', 'AGENTS.md': 'x' })
    assert.equal(scope(dir, 'push', base, documents), 'code=false')
    const mixed = commit(dir, { 'docs/c.md': 'c', 'scripts/s.ts': 'changed' })
    assert.equal(scope(dir, 'push', documents, mixed), 'code=true')
    assert.equal(scope(dir, 'push', '0'.repeat(40), mixed), 'code=true')
    git(dir, 'mv', 'scripts/s.ts', 'docs/s.md')
    const renamed = commit(dir, {})
    assert.equal(scope(dir, 'push', mixed, renamed), 'code=true')
    assert.equal(scope(dir, 'schedule', base, documents), 'code=true')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
