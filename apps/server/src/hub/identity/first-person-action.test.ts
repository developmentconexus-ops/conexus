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
import { delimiter, join } from 'node:path'
import type { TestContext } from 'node:test'
import { test } from 'node:test'

const ROOT = join(import.meta.dirname, '..', '..', '..', '..', '..')

const STUB_DOCKER = `#!/bin/bash
printf '%s\\n' "$@" > "$CALLS"
case "$*" in
  *" ps --quiet hub") echo "\${STUB_RUNNING_ID:-}" ;;
  "inspect "*) echo "hub@sha256:live" ;;
  *" run --rm --no-deps -T hub "*) echo "LINK-FOR-SUMMARY"; echo '{"msg":"FIRST_PERSON_LINK_GIVEN"}' >&2; exit "\${STUB_STATUS:-0}" ;;
esac
`

function workflowScript(): string {
  const lines = readFileSync(join(ROOT, '.github/workflows/first-person.yml'), 'utf8').split('\n')
  const start = lines.findIndex((line) => line.trim() === 'run: |')
  const body = lines.slice(start + 1).filter((line) => line.startsWith('          ') || line === '')
  return body.map((line) => line.slice(10)).join('\n')
}

function runWorkflow(t: TestContext, stub: { running: boolean; status: number }) {
  const dir = mkdtempSync(join(tmpdir(), 'conexus-action-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  mkdirSync(join(dir, 'bin'))
  writeFileSync(join(dir, 'bin', 'docker'), STUB_DOCKER)
  chmodSync(join(dir, 'bin', 'docker'), 0o755)
  writeFileSync(join(dir, 'summary'), '')
  const env = {
    PATH: `${join(dir, 'bin')}${delimiter}/usr/bin${delimiter}/bin`,
    CALLS: join(dir, 'calls'),
    GITHUB_STEP_SUMMARY: join(dir, 'summary'),
    PERSON_NAME: 'Ana "$(touch pwned)" Lima',
    PERSON_EMAIL: 'ana@example.test',
    STUB_RUNNING_ID: stub.running ? 'container-id' : '',
    STUB_STATUS: String(stub.status),
  }
  const result = spawnSync('bash', ['-e', '-c', workflowScript()], {
    cwd: dir,
    env,
    encoding: 'utf8',
  })
  const summary = readFileSync(join(dir, 'summary'), 'utf8')
  const calls = stub.running ? readFileSync(join(dir, 'calls'), 'utf8') : ''
  return { result, summary, calls, dir }
}

test('a ação: o link vai só ao resumo, o nome e o e-mail entram como argumentos inteiros', (t) => {
  assert.doesNotMatch(workflowScript(), /\$\{\{/)
  const { result, summary, calls, dir } = runWorkflow(t, { running: true, status: 0 })
  assert.equal(result.status, 0, result.stderr)
  assert.equal(summary, 'LINK-FOR-SUMMARY\n')
  assert.doesNotMatch(`${result.stdout}${result.stderr}`, /LINK-FOR-SUMMARY/)
  assert.ok(
    calls.includes('\n--name\nAna "$(touch pwned)" Lima\n--email\nana@example.test\n'),
    calls,
  )
  assert.ok(calls.includes('\n--summary\n/dev/stdout\n'), calls)
  assert.equal(existsSync(join(dir, 'pwned')), false)
})

test('a ação: termina vermelha quando o comando sai com 1, e sem Hub no ar', (t) => {
  assert.equal(runWorkflow(t, { running: true, status: 1 }).result.status, 1)
  const idle = runWorkflow(t, { running: false, status: 0 })
  assert.equal(idle.result.status, 1)
  assert.match(idle.result.stderr, /no Hub is running/)
})
