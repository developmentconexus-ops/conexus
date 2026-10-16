import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { once } from 'node:events'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { after, test } from 'node:test'

const REPORTER = resolve(import.meta.dirname, 'test-reporter.ts')
const dirs: string[] = []
after(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true })
})

function directory(): string {
  const dir = mkdtempSync(join(tmpdir(), 'conexus-reporter-'))
  dirs.push(dir)
  return dir
}

function run(source: string, extra: Record<string, string> = {}) {
  const dir = directory()
  writeFileSync(join(dir, 'x.test.ts'), source)
  const { NODE_TEST_CONTEXT: _outer, GITHUB_STEP_SUMMARY: _summary, ...env } = process.env
  return spawnSync('node', ['--test', `--test-reporter=${REPORTER}`, join(dir, 'x.test.ts')], {
    encoding: 'utf8',
    timeout: 120_000,
    env: { ...env, ...extra },
  })
}

test('passa com um teste que roda', () => {
  assert.equal(run("import test from 'node:test'\ntest('a', () => {})\n").status, 0)
})

test('a lista dos mais lentos: o resumo do passo traz o teste mais lento primeiro, com o arquivo', () => {
  const summary = join(directory(), 'summary.md')
  const source = [
    "import test from 'node:test'",
    "test('rápido | com barra', () => {})",
    "test('lento', async () => { await new Promise((resolve) => setTimeout(resolve, 300)) })",
  ].join('\n')
  const result = run(source, { GITHUB_STEP_SUMMARY: summary, npm_package_name: '@conexus/x' })
  assert.equal(result.status, 0, result.stderr)
  const table = readFileSync(summary, 'utf8')
  assert.match(table, /^### Slowest tests of @conexus\/x: \d+ s in all$/m)
  const tests = [...table.matchAll(/^\| \d+\.\d \| \S*x\.test\.ts \| (.*) \|$/gm)].map(
    (row) => row[1],
  )
  assert.deepEqual(tests, ['lento', 'rápido \\| com barra'])
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

test('linha crua: aceita a linha de registro cujo valor aninhado tem a chave level', () => {
  const source =
    'import test from \'node:test\'\ntest(\'a\', () => {\n  process.stdout.write(\'{"level":30,"msg":"LISTENING","err":{"level":"x","text":"{\\\\"level\\\\":1}"}}\\n\')\n})\n'
  const result = run(source)
  assert.equal(result.status, 0, result.stderr)
})

test('linha crua: aceita a linha de registro com level aninhado e espaço em volta dos dois pontos', () => {
  const source = [
    "import test from 'node:test'",
    "test('a', () => {",
    '  process.stdout.write(\'{"level":30,"msg":"PROBE","err":{"level":"nested"}}\\n\')',
    '  process.stdout.write(\'{"level" : 30,"msg":"SPACED"}\\n\')',
    '})',
  ].join('\n')
  const result = run(source)
  assert.equal(result.status, 0, result.stderr)
})

test('linha crua: recusa sem travar a linha com aspas sem fechar', async () => {
  const source = [
    "import test from 'node:test'",
    "test('a', () => {",
    "  process.stdout.write('raw \"unterminated\\n')",
    '  process.stdout.write(\'{"level":30,"msg":"LISTENING\\n\')',
    '})',
  ].join('\n')
  const file = join(directory(), 'x.test.ts')
  writeFileSync(file, source)
  const { NODE_TEST_CONTEXT: _outer, ...env } = process.env
  const child = spawn('node', ['--test', `--test-reporter=${REPORTER}`, file], {
    env,
    detached: true,
    stdio: ['ignore', 'ignore', 'pipe'],
  })
  let stderr = ''
  child.stderr.setEncoding('utf8').on('data', (text: string) => {
    stderr += text
  })
  const hung = setTimeout(() => process.kill(-Number(child.pid), 'SIGKILL'), 20_000)
  const [status] = await once(child, 'close')
  clearTimeout(hung)
  assert.equal(status, 1, `the reporter hung or passed: ${stderr}`)
  assert.equal(stderr.match(/^raw-output: /gm)?.length, 2, stderr)
})
