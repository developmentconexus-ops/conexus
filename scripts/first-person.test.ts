import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { delimiter, join, resolve } from 'node:path'
import type { TestContext } from 'node:test'
import { test } from 'node:test'

const SCRIPT = resolve(import.meta.dirname, '../infra/first-person.sh')

const STUB_DOCKER = `#!/bin/bash
printf '%s\\n' "$@" > "$CALLS"
case "$*" in
  *" ps --quiet hub") echo "\${STUB_RUNNING_ID:-}" ;;
  "inspect "*) echo "hub@sha256:live" ;;
  *" run --rm --no-deps -T hub "*) echo "LINK-FOR-TERMINAL"; echo '{"msg":"FIRST_PERSON_LINK_GIVEN"}' >&2; exit "\${STUB_STATUS:-0}" ;;
esac
`

function runScript(t: TestContext, stub: { running: boolean; status: number }) {
  const dir = mkdtempSync(join(tmpdir(), 'conexus-first-person-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  mkdirSync(join(dir, 'bin'))
  writeFileSync(join(dir, 'bin', 'docker'), STUB_DOCKER)
  chmodSync(join(dir, 'bin', 'docker'), 0o755)
  const env = {
    PATH: `${join(dir, 'bin')}${delimiter}/usr/bin${delimiter}/bin`,
    CALLS: join(dir, 'calls'),
    STUB_RUNNING_ID: stub.running ? 'container-id' : '',
    STUB_STATUS: String(stub.status),
  }
  const result = spawnSync('bash', [SCRIPT, 'Ana "$(touch pwned)" Lima', 'ana@example.test'], {
    cwd: dir,
    env,
    encoding: 'utf8',
  })
  const calls = stub.running ? readFileSync(join(dir, 'calls'), 'utf8') : ''
  return { result, calls, dir }
}

test('a primeira pessoa: o link vai só ao terminal, o nome e o e-mail entram como argumentos inteiros', (t) => {
  const { result, calls, dir } = runScript(t, { running: true, status: 0 })
  assert.equal(result.status, 0, result.stderr)
  assert.equal(result.stdout, 'LINK-FOR-TERMINAL\n')
  assert.doesNotMatch(result.stderr, /LINK-FOR-TERMINAL/)
  assert.ok(
    calls.includes('\n--name\nAna "$(touch pwned)" Lima\n--email\nana@example.test\n'),
    calls,
  )
  assert.ok(calls.includes('\n--summary\n/dev/stdout\n'), calls)
  assert.equal(existsSync(join(dir, 'pwned')), false)
})

test('a primeira pessoa: sai com 1 quando o comando sai com 1, e sem Hub no ar', (t) => {
  assert.equal(runScript(t, { running: true, status: 1 }).result.status, 1)
  const idle = runScript(t, { running: false, status: 0 })
  assert.equal(idle.result.status, 1)
  assert.match(idle.result.stderr, /no Hub is running/)
})

test('nenhum workflow cria a primeira pessoa: a página de uma execução é pública', () => {
  const workflows = resolve(import.meta.dirname, '../.github/workflows')
  assert.equal(existsSync(join(workflows, 'first-person.yml')), false)
})
