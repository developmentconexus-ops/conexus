import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { after, test } from 'node:test'

const SCRIPT = resolve(import.meta.dirname, 'check-approval.ts')
const dirs: string[] = []
after(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true })
})

function git(dir: string, ...args: string[]): string {
  return execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@example.com', ...args], {
    cwd: dir,
    encoding: 'utf8',
    timeout: 120_000,
  }).trim()
}

function write(dir: string, path: string, content: string) {
  mkdirSync(dirname(join(dir, path)), { recursive: true })
  writeFileSync(join(dir, path), content)
}

function repository(): string {
  const dir = mkdtempSync(join(tmpdir(), 'conexus-approval-'))
  dirs.push(dir)
  git(dir, 'init', '-q', '-b', 'main')
  write(dir, 'docs/steps/e01-x.md', 'card\n')
  write(dir, 'docs/approvals.md', 'ledger\n')
  git(dir, 'add', '.')
  git(dir, 'commit', '-q', '-m', 'card')
  return dir
}

function run(dir: string, ...args: string[]) {
  return spawnSync('node', [SCRIPT, dir, ...args], { encoding: 'utf8', timeout: 120_000 })
}

function topic(dir: string, file: string) {
  git(dir, 'checkout', '-q', '-b', 'topic')
  write(dir, file, 'export {}\n')
  git(dir, 'add', '.')
  git(dir, 'commit', '-q', '-m', 'change')
}

test('um pull request de outro trilho não responde pelo cartão sem linha da fronteira', () => {
  for (const file of ['apps/web/src/ui/button.ts', 'apps/server/src/builder/assistant/a.ts']) {
    const dir = repository()
    topic(dir, file)
    assert.equal(run(dir, '--base', 'main').status, 0, file)
  }
})

test('um pull request que só muda scripts, fluxos ou arquivos da raiz responde por todos os cartões', () => {
  for (const file of ['scripts/x.ts', '.github/workflows/ci.yml', 'package.json']) {
    const dir = repository()
    topic(dir, file)
    const result = run(dir, '--base', 'main')
    assert.equal(result.status, 1, file)
    assert.match(result.stderr, /^approval-missing: /, file)
  }
})

test('mudar o cartão sem linha o põe a cargo do pull request, mesmo com documentos só', () => {
  const dir = repository()
  git(dir, 'checkout', '-q', '-b', 'topic')
  write(dir, 'docs/steps/e01-x.md', 'card changed\n')
  git(dir, 'commit', '-qam', 'card')
  assert.equal(run(dir, '--base', 'main').status, 0)
  write(dir, 'apps/server/src/main.ts', 'export {}\n')
  git(dir, 'add', '.')
  git(dir, 'commit', '-q', '-m', 'code')
  assert.equal(run(dir, '--base', 'main').status, 1)
})

test('um push à main, sem base, confere todos os cartões', () => {
  const dir = repository()
  assert.equal(run(dir).status, 1)
})
