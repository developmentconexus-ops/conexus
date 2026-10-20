import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import type { TestContext } from 'node:test'
import { test } from 'node:test'

const REMOVALS = resolve(import.meta.dirname, 'removals.ts')

function removalsAt(cwd: string, ...args: string[]) {
  const { NODE_TEST_CONTEXT: _outer, ...env } = process.env
  return spawnSync('node', [REMOVALS, ...args], { cwd, encoding: 'utf8', timeout: 120_000, env })
}

function git(dir: string, ...args: string[]): void {
  spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...args], { cwd: dir })
}

// A pull request runs the rows its diff touches (removals-select.ts), nothing when it touches none.
function pairRepo(t: TestContext): string {
  const dir = mkdtempSync(join(tmpdir(), 'conexus-removals-base-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const pair = ['one', 'two'].map((name) => ({
    id: name,
    file: `${name}.ts`,
    find: 'LIMIT = 10',
    replace: 'LIMIT = 11',
    test: { cwd: '.', file: `${name}.test.ts`, name: 'o limite é 10' },
  }))
  const files: Record<string, string> = { 'scripts/removals.json': JSON.stringify(pair) }
  for (const { id } of pair) {
    files[`${id}.ts`] = 'export const LIMIT = 10\n'
    files[`${id}.test.ts`] = [
      "import assert from 'node:assert/strict'",
      "import { test } from 'node:test'",
      `import { LIMIT } from './${id}.ts'`,
      "test('o limite é 10', () => assert.equal(LIMIT, 10))",
      '',
    ].join('\n')
  }
  files['README.md'] = 'a\n'
  for (const [name, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, name)), { recursive: true })
    writeFileSync(join(dir, name), content)
  }
  git(dir, 'init', '--quiet', '--initial-branch=main')
  git(dir, 'add', '.')
  git(dir, 'commit', '--quiet', '-m', 'base')
  git(dir, 'checkout', '--quiet', '-b', 'change')
  return dir
}

function commitAll(dir: string): void {
  git(dir, 'add', '.')
  git(dir, 'commit', '--quiet', '-m', 'c')
}

test('uma mudança sem proteção: o plano é vazio e a fatia diz que não há o que rodar', (t) => {
  const dir = pairRepo(t)
  writeFileSync(join(dir, 'README.md'), 'b\n')
  commitAll(dir)
  assert.equal(
    removalsAt(dir, '--base', 'main', '--plan').stdout,
    '{"selected":0,"total":2,"shards":0}\n',
  )
  const slice = removalsAt(dir, '--base', 'main', '--shard', '1/4')
  assert.match(slice.stdout, /^nothing to run: no removal row is affected\n$/)
  assert.equal(slice.status, 0)
})

test('uma mudança num arquivo protegido roda a linha dele e só ela', (t) => {
  const dir = pairRepo(t)
  writeFileSync(join(dir, 'two.ts'), 'export const LIMIT = 10 // changed\n')
  commitAll(dir)
  assert.equal(
    removalsAt(dir, '--base', 'main', '--plan').stdout,
    '{"selected":1,"total":2,"shards":1}\n',
  )
  const run = removalsAt(dir, '--base', 'main')
  assert.equal(run.stdout, 'caught two\n', run.stderr)
  assert.equal(run.status, 0)
})

test('uma mudança ainda não commitada conta, e sem --base roda todas', (t) => {
  const dir = pairRepo(t)
  writeFileSync(join(dir, 'one.test.ts'), `${readFileSync(join(dir, 'one.test.ts'), 'utf8')}\n`)
  assert.equal(
    removalsAt(dir, '--base', 'main', '--plan').stdout,
    '{"selected":1,"total":2,"shards":1}\n',
  )
  assert.equal(removalsAt(dir, '--plan').stdout, '{"selected":2,"total":2,"shards":2}\n')
})

test('uma referência de base que não existe recusa, sem rodar nem pular linha', (t) => {
  const dir = pairRepo(t)
  const run = removalsAt(dir, '--base', 'nao-existe', '--plan')
  assert.equal(run.stdout, '')
  assert.notEqual(run.status, 0)
})
