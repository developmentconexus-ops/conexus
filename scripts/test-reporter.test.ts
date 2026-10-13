// The reporter fails a run with zero tests and a skip that does not start with `opt-in:`.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { after, test } from 'node:test'

const REPORTER = resolve(import.meta.dirname, 'test-reporter.ts')
const dirs: string[] = []
after(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true })
})

function run(source: string) {
  const dir = mkdtempSync(join(tmpdir(), 'conexus-reporter-'))
  dirs.push(dir)
  writeFileSync(join(dir, 'x.test.ts'), source)
  const { NODE_TEST_CONTEXT: _outer, ...env } = process.env
  return spawnSync('node', ['--test', `--test-reporter=${REPORTER}`, join(dir, 'x.test.ts')], {
    encoding: 'utf8',
    env,
  })
}

test('passa com um teste que roda', () => {
  assert.equal(run("import test from 'node:test'\ntest('a', () => {})\n").status, 0)
})

test('recusa zero testes', () => {
  const result = run('export {}\n')
  assert.equal(result.status, 1)
  assert.match(result.stderr, /^zero-tests: /m)
})

test('recusa pular sem opt-in', () => {
  const result = run("import test from 'node:test'\ntest('a', { skip: 'later' }, () => {})\n")
  assert.equal(result.status, 1)
  assert.match(result.stderr, /^skip-without-opt-in: a$/m)
})

test('aceita pular com opt-in', () => {
  const source =
    "import test from 'node:test'\ntest('a', { skip: 'opt-in: needs a key' }, () => {})\ntest('b', () => {})\n"
  assert.equal(run(source).status, 0)
})
