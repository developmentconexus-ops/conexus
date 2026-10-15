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
    timeout: 120_000,
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

test('linha crua: recusa o que não é uma linha de registro com nível e código', () => {
  const source = [
    "import test from 'node:test'",
    "test('a', () => {",
    "  process.stdout.write('# SERVER_ERROR: x\\n')",
    '  process.stderr.write(\'{"level":50,"msg":"not a code"}\\n\')',
    '  process.stdout.write(\'{"level":30,"level":30,"msg":"TWO_LEVELS"}\\n\')',
    '})',
  ].join('\n')
  const result = run(source)
  assert.equal(result.status, 1)
  assert.equal(result.stderr.match(/^raw-output: /gm)?.length, 3, result.stderr)
  assert.match(result.stderr, /^raw-output: .*x\.test\.ts: # SERVER_ERROR: x$/m)
})

test('linha crua: aceita a linha de registro com um nível e um código', () => {
  const source =
    'import test from \'node:test\'\ntest(\'a\', () => {\n  process.stdout.write(\'{"level":30,"msg":"LISTENING"}\\n\')\n})\n'
  const result = run(source)
  assert.equal(result.status, 0, result.stderr)
})
