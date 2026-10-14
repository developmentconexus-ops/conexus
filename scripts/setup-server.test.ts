import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { after, test } from 'node:test'

const SCRIPT = resolve(import.meta.dirname, '../infra/setup-server.sh')
const dir = mkdtempSync(join(tmpdir(), 'conexus-setup-'))
after(() => rmSync(dir, { recursive: true, force: true }))

function secret(name: string, content: string, mode: number): string {
  const path = join(dir, name)
  writeFileSync(path, content)
  chmodSync(path, mode)
  return path
}

function run(tunnel: string, runner: string) {
  return spawnSync('bash', [SCRIPT], {
    encoding: 'utf8',
    env: {
      PATH: process.env.PATH ?? '',
      RUNNER_URL: 'https://example.invalid/org/repo',
      RUNNER_VERSION: '0.0.0',
      RUNNER_SHA256: 'x',
      TUNNEL_TOKEN_FILE: tunnel,
      RUNNER_TOKEN_FILE: runner,
    },
  })
}

const good = secret('good', 'token\n', 0o600)

test('recusa um token legível por outros', () => {
  const result = run(secret('open', 'token\n', 0o644), good)
  assert.equal(result.status, 1)
  assert.match(result.stderr, /open must be readable by its owner only/)
})

test('recusa um token vazio', () => {
  const result = run(good, secret('empty', '', 0o600))
  assert.equal(result.status, 1)
  assert.match(result.stderr, /empty is missing or empty/)
})

test('o token do runner não vai na linha de comando', () => {
  assert.doesNotMatch(readFileSync(SCRIPT, 'utf8'), /--token\b/)
})

test('toda chamada de fora tem prazo', () => {
  const calls = readFileSync(SCRIPT, 'utf8')
    .split('\n')
    .filter((line) => /\bcurl\b/.test(line) && !line.includes('apt-get install'))
  assert.equal(calls.length, 1)
  assert.match(calls[0] ?? '', /^fetch=\(curl .*--connect-timeout \d+ --max-time \d+\)$/)
})
