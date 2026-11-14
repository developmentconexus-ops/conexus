import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { after, test } from 'node:test'

const SCRIPT = resolve(import.meta.dirname, 'flaky-issues.ts')
const dirs: string[] = []
after(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true })
})

function setup(records: string[][], issues = '', fail = false) {
  const dir = mkdtempSync(join(tmpdir(), 'conexus-flaky-issues-'))
  dirs.push(dir)
  mkdirSync(join(dir, 'records'))
  for (const [index, lines] of records.entries()) {
    writeFileSync(join(dir, 'records', `${index}.jsonl`), lines.join('\n'))
  }
  writeFileSync(join(dir, 'gh.log'), '')
  const answer = fail
    ? 'echo "sem rede" >&2\nexit 1'
    : `[ "$1 $2" = "issue list" ] && printf '%s' '${issues}'\nexit 0`
  writeFileSync(join(dir, 'gh'), `#!/bin/sh\necho "$@" >> "${join(dir, 'gh.log')}"\n${answer}\n`)
  chmodSync(join(dir, 'gh'), 0o755)
  return dir
}

function run(dir: string) {
  const result = spawnSync('node', [SCRIPT, join(dir, 'records')], {
    encoding: 'utf8',
    timeout: 120_000,
    env: {
      ...process.env,
      PATH: `${dir}:${process.env.PATH}`,
      GITHUB_REPOSITORY: 'o/r',
      GITHUB_RUN_ID: '9',
      GITHUB_SERVER_URL: 'https://github.com',
    },
  })
  return { result, ghLog: readFileSync(join(dir, 'gh.log'), 'utf8') }
}

function record(name: string, job = 'server'): string {
  return JSON.stringify({ file: 'x.test.ts', name, job })
}

test('o teste instável sem issue abre uma, uma só, mesmo registrado por dois jobs', () => {
  const dir = setup([[record('oscila')], [record('oscila', 'web'), record('outro')]])
  const { result, ghLog } = run(dir)
  assert.equal(result.status, 0, result.stderr)
  const created = ghLog.split('\n').filter((line) => line.startsWith('issue create'))
  assert.equal(created.length, 2)
  assert.match(
    created[0] ?? '',
    /^issue create --label flaky --title Teste instável: x\.test\.ts › oscila --body Passou só na segunda rodada/,
  )
  assert.match(ghLog, /^label create flaky --force .* -R o\/r$/m)
})

test('o teste instável que já tem issue ganha um comentário, e a issue fechada reabre', () => {
  const dir = setup([[record('oscila')]], '7\tCLOSED\tTeste instável: x.test.ts › oscila\n')
  const { result, ghLog } = run(dir)
  assert.equal(result.status, 0, result.stderr)
  assert.match(ghLog, /^issue reopen 7 -R o\/r$/m)
  assert.match(ghLog, /^issue comment 7 --body Passou só na segunda rodada/m)
  assert.doesNotMatch(ghLog, /issue create/)
})

test('uma issue aberta só ganha o comentário', () => {
  const dir = setup([[record('oscila')]], '7\tOPEN\tTeste instável: x.test.ts › oscila\n')
  const { ghLog } = run(dir)
  assert.doesNotMatch(ghLog, /issue reopen/)
  assert.match(ghLog, /issue comment 7/)
})

test('sem registro não chama o gh', () => {
  const { result, ghLog } = run(setup([]))
  assert.equal(result.status, 0)
  assert.equal(ghLog, '')
})

test('um gh que falha deixa a execução verde, com o aviso', () => {
  const { result } = run(setup([[record('oscila')]], '', true))
  assert.equal(result.status, 0, result.stderr)
  assert.match(
    result.stdout,
    /::warning title=Teste instável::o registro não chegou ao GitHub: sem rede/,
  )
})

test('dois artefatos com o mesmo nome de arquivo, cada um na sua pasta, chegam os dois', () => {
  const dir = setup([])
  for (const [folder, name] of [
    ['flaky-server-1', 'um'],
    ['flaky-web', 'dois'],
  ]) {
    mkdirSync(join(dir, 'records', folder))
    writeFileSync(join(dir, 'records', folder, 'flaky.jsonl'), record(name))
  }
  const { result, ghLog } = run(dir)
  assert.equal(result.status, 0, result.stderr)
  const created = ghLog.split('\n').filter((line) => line.startsWith('issue create'))
  assert.equal(created.length, 2)
  assert.match(created.join('\n'), /› um /)
  assert.match(created.join('\n'), /› dois /)
})
