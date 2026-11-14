import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { after, test } from 'node:test'

const SCRIPT = resolve(import.meta.dirname, 'test-run.ts')
const REPORTER = resolve(import.meta.dirname, 'test-reporter.ts')
const dirs: string[] = []
after(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true })
})

// A test that fails the first time it runs and passes the next, counted by a file beside it.
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
  writeFileSync(join(dir, 'gh.log'), '')
  writeFileSync(join(dir, 'issues.json'), '[]')
  writeFileSync(
    join(dir, 'gh'),
    `#!/bin/sh\necho "$@" >> "${join(dir, 'gh.log')}"\n[ "$1 $2" = "issue list" ] && cat "${join(dir, 'issues.json')}"\nexit 0\n`,
  )
  chmodSync(join(dir, 'gh'), 0o755)
  return dir
}

function run(dir: string, env: Record<string, string>, args = ['x.test.ts']) {
  const { NODE_TEST_CONTEXT: _outer, CI: _ci, GH_TOKEN: _token, ...base } = process.env
  const summary = join(dir, 'summary.md')
  const result = spawnSync('node', [SCRIPT, `--test-reporter=${REPORTER}`, ...args], {
    cwd: dir,
    encoding: 'utf8',
    timeout: 120_000,
    env: {
      ...base,
      PATH: `${dir}:${process.env.PATH}`,
      GITHUB_STEP_SUMMARY: summary,
      GITHUB_REPOSITORY: 'o/r',
      GITHUB_RUN_ID: '9',
      GITHUB_SERVER_URL: 'https://github.com',
      ...env,
    },
  })
  return {
    result,
    ghLog: readFileSync(join(dir, 'gh.log'), 'utf8'),
    summary: () => readFileSync(summary, 'utf8'),
  }
}

test('na CI, o teste que falhou e passou na segunda rodada deixa a execução verde, marcado e com issue', () => {
  const dir = setup(flaky('oscila'))
  const { result, ghLog, summary } = run(dir, { CI: 'true', GH_TOKEN: 'x' })
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stderr, /second run of the 1 test\(s\) that failed/)
  assert.match(result.stdout, /::warning title=Teste instável::x\.test\.ts › oscila/)
  assert.match(summary(), /^\| `x\.test\.ts` \| oscila \|$/m)
  assert.match(
    ghLog,
    /^issue create -R o\/r --label flaky --title Teste instável: x\.test\.ts › oscila /m,
  )
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

test('um teste de recusa nunca ganha a segunda rodada: a execução fica vermelha e ele roda uma vez', () => {
  const dir = setup(flaky('recusa quem é de outra empresa'))
  const { result, ghLog } = run(dir, { CI: 'true', GH_TOKEN: 'x' })
  assert.equal(result.status, 1)
  assert.match(
    result.stderr,
    /no second run, a test of a class T4 forbids rerunning failed: x\.test\.ts › recusa/,
  )
  assert.equal(ghLog, '')
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

test('sem GH_TOKEN o teste instável aparece no resumo e não abre issue', () => {
  const dir = setup(flaky('oscila'))
  const { result, ghLog, summary } = run(dir, { CI: 'true' })
  assert.equal(result.status, 0, result.stderr)
  assert.match(summary(), /oscila/)
  assert.equal(ghLog, '')
})

test('o teste instável que já tem issue ganha um comentário, e a issue fechada reabre', () => {
  const dir = setup(flaky('oscila'))
  const issue = { number: 7, title: 'Teste instável: x.test.ts › oscila', state: 'CLOSED' }
  writeFileSync(join(dir, 'issues.json'), JSON.stringify([issue]))
  const { result, ghLog } = run(dir, { CI: 'true', GH_TOKEN: 'x' })
  assert.equal(result.status, 0, result.stderr)
  assert.match(ghLog, /^issue reopen 7 -R o\/r$/m)
  assert.match(ghLog, /^issue comment 7 -R o\/r --body Passou só na segunda rodada/m)
  assert.doesNotMatch(ghLog, /issue create/)
})

test('um gh que falha deixa a execução verde, com o aviso e o resumo', () => {
  const dir = setup(flaky('oscila'))
  writeFileSync(join(dir, 'gh'), '#!/bin/sh\necho "sem rede" >&2\nexit 1\n')
  const { result, summary } = run(dir, { CI: 'true', GH_TOKEN: 'x' })
  assert.equal(result.status, 0, result.stderr)
  assert.match(
    result.stdout,
    /::warning title=Teste instável::o registro não chegou ao GitHub: sem rede/,
  )
  assert.match(summary(), /oscila/)
})
