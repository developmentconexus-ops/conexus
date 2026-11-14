import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative, resolve } from 'node:path'
import { after, test } from 'node:test'

const SCRIPT = resolve(import.meta.dirname, 'test-run.ts')
const REPORTER = resolve(import.meta.dirname, 'test-reporter.ts')
const dirs: string[] = []
after(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true })
})

function flaky(name: string): string {
  return [
    "import { existsSync, writeFileSync } from 'node:fs'",
    "import test from 'node:test'",
    `test('${name}', () => {`,
    "  if (existsSync('seen')) return",
    "  writeFileSync('seen', '1')",
    "  throw new Error('first time')",
    '})',
    "test('estável', () => {})",
  ].join('\n')
}

function setup(source: string) {
  const dir = mkdtempSync(join(tmpdir(), 'conexus-test-run-'))
  dirs.push(dir)
  writeFileSync(join(dir, 'x.test.ts'), source)
  return dir
}

function run(dir: string, env: Record<string, string>, args = ['x.test.ts']) {
  const { NODE_TEST_CONTEXT: _outer, CI: _ci, ...base } = process.env
  const summary = join(dir, 'summary.md')
  const result = spawnSync('node', [SCRIPT, `--test-reporter=${REPORTER}`, ...args], {
    cwd: dir,
    encoding: 'utf8',
    timeout: 120_000,
    env: {
      ...base,
      CONEXUS_FLAKY_FILE: join(dir, 'flaky.jsonl'),
      GITHUB_JOB: 'server',
      GITHUB_STEP_SUMMARY: summary,
      ...env,
    },
  })
  return {
    result,
    records: () => readFileSync(join(dir, 'flaky.jsonl'), 'utf8'),
    recorded: () => existsSync(join(dir, 'flaky.jsonl')),
    summary: () => readFileSync(summary, 'utf8'),
  }
}

test('na CI, o teste que falhou e passou na segunda rodada deixa a execução verde, marcado e registrado', () => {
  const dir = setup(flaky('oscila'))
  const { result, records, summary } = run(dir, { CI: 'true' })
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stderr, /second run of the 1 test\(s\) that failed/)
  assert.match(result.stdout, /::warning title=Teste instável::x\.test\.ts › oscila/)
  assert.match(summary(), /^\| `x\.test\.ts` \| oscila \|$/m)
  assert.deepEqual(JSON.parse(records()), { file: 'x.test.ts', name: 'oscila', job: 'server' })
})

test('um teste que falha nas duas rodadas deixa a execução vermelha, e a segunda rodada só leva o arquivo que falhou', () => {
  const dir = setup(
    "import test from 'node:test'\ntest('quebra', () => { throw new Error('sempre') })\n",
  )
  writeFileSync(join(dir, 'y.test.ts'), "import test from 'node:test'\ntest('y', () => {})\n")
  const { result } = run(dir, { CI: 'true' }, ['x.test.ts', 'y.test.ts'])
  assert.equal(result.status, 1)
  assert.match(result.stderr, /in x\.test\.ts\n/)
})

function never(dir: string, name: string): Record<string, string> {
  const file = relative(resolve(import.meta.dirname, '..'), join(dir, 'x.test.ts'))
  writeFileSync(join(dir, 'never.json'), JSON.stringify({ files: [], tests: [{ file, name }] }))
  return { CONEXUS_RERUN_NEVER: join(dir, 'never.json') }
}

test('um teste da lista das classes T4 nunca ganha a segunda rodada: a execução fica vermelha e ele roda uma vez', () => {
  const dir = setup(flaky('B lista só os seus projetos'))
  const { result, recorded } = run(dir, { CI: 'true', ...never(dir, 'seus projetos') })
  assert.equal(result.status, 1)
  assert.match(
    result.stderr,
    /no second run, a test of a class T4 forbids rerunning failed: x\.test\.ts › B lista/,
  )
  assert.equal(recorded(), false)
})

test('um teste dentro de uma suíte da lista também fica sem a segunda rodada', () => {
  const source = [
    "import { existsSync, writeFileSync } from 'node:fs'",
    "import { describe, test } from 'node:test'",
    "describe('isolamento entre empresas', () => {",
    "  test('B lista só os seus projetos', () => {",
    "    if (existsSync('seen')) return",
    "    writeFileSync('seen', '1')",
    "    throw new Error('first time')",
    '  })',
    '})',
  ].join('\n')
  const dir = setup(source)
  const { result } = run(dir, { CI: 'true', ...never(dir, 'isolamento entre empresas') })
  assert.equal(result.status, 1)
  assert.match(result.stderr, /forbids rerunning failed/)
})

test('sem estar na lista, o mesmo teste de suíte ganha a segunda rodada, e só a falha dele conta', () => {
  const source = [
    "import { existsSync, writeFileSync } from 'node:fs'",
    "import { describe, test } from 'node:test'",
    "describe('um grupo', () => {",
    "  test('oscila', () => {",
    "    if (existsSync('seen')) return",
    "    writeFileSync('seen', '1')",
    "    throw new Error('first time')",
    '  })',
    '})',
  ].join('\n')
  const { result } = run(setup(source), { CI: 'true' })
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stderr, /second run of the 1 test\(s\) that failed/)
})

test('um arquivo que quebrou inteiro não ganha a segunda rodada', () => {
  const source = [
    "import { existsSync, writeFileSync } from 'node:fs'",
    "import test from 'node:test'",
    "if (!existsSync('seen')) {",
    "  writeFileSync('seen', '1')",
    "  throw new Error('quebra no topo')",
    '}',
    "test('ok', () => {})",
  ].join('\n')
  const { result } = run(setup(source), { CI: 'true' })
  assert.equal(result.status, 1)
  assert.match(result.stderr, /no second run, a test file failed whole: x\.test\.ts/)
})

test('uma falha da regra do reporter, sem teste vermelho, não ganha a segunda rodada', () => {
  const dir = setup(
    "import test from 'node:test'\ntest('a', () => { console.log('saída solta') })\n",
  )
  const { result } = run(dir, { CI: 'true' })
  assert.equal(result.status, 1)
  assert.match(result.stderr, /no second run, the run failed with no test failing/)
})

test('fora da CI não há segunda rodada: o flake aparece como falha', () => {
  const dir = setup(flaky('oscila'))
  const { result } = run(dir, {})
  assert.equal(result.status, 1)
  assert.doesNotMatch(result.stderr, /second run/)
})

test('uma opção depois dos arquivos é recusada', () => {
  const dir = setup(flaky('oscila'))
  const { result } = run(dir, { CI: 'true' }, ['x.test.ts', '--test-timeout=5'])
  assert.equal(result.status, 2)
  assert.match(result.stderr, /options come before the files/)
})

test('sem arquivo de registro o teste instável aparece no resumo e a execução fica verde', () => {
  const dir = setup(flaky('oscila'))
  const { result, summary } = run(dir, { CI: 'true', CONEXUS_FLAKY_FILE: '' })
  assert.equal(result.status, 0, result.stderr)
  assert.match(summary(), /oscila/)
})
