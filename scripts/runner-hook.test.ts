import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { after, test } from 'node:test'

const HOOK = resolve(import.meta.dirname, '../infra/runner-job-started.sh')
const dir = mkdtempSync(join(tmpdir(), 'conexus-hook-'))
after(() => rmSync(dir, { recursive: true, force: true }))

let planted = 0
function hook(event: string, ref: string, payload?: string) {
  const path = join(dir, `event-${planted++}.json`)
  if (payload !== undefined) writeFileSync(path, payload)
  const run = spawnSync('bash', [HOOK], {
    encoding: 'utf8',
    timeout: 20_000,
    env: {
      PATH: process.env.PATH,
      GITHUB_EVENT_NAME: event,
      GITHUB_REF: ref,
      GITHUB_EVENT_PATH: payload === undefined ? join(dir, 'absent.json') : path,
    },
  })
  return { status: run.status, stderr: run.stderr }
}

function release(target: string) {
  return JSON.stringify({ action: 'published', release: { target_commitish: target } })
}

test('um Release de main é aceito', () => {
  assert.deepEqual(hook('release', 'refs/tags/v0.8.0', release('main')), { status: 0, stderr: '' })
})

test('um disparo manual de main é aceito', () => {
  assert.deepEqual(hook('workflow_dispatch', 'refs/heads/main'), { status: 0, stderr: '' })
})

test('um push é recusado, mesmo em main', () => {
  assert.deepEqual(hook('push', 'refs/heads/main', '{}'), {
    status: 1,
    stderr: "refused: a 'push' event does not reach this runner\n",
  })
})

test('um pull request é recusado', () => {
  assert.deepEqual(hook('pull_request', 'refs/pull/9/merge', '{}'), {
    status: 1,
    stderr: "refused: a 'pull_request' event does not reach this runner\n",
  })
})

test('um evento sem nome é recusado', () => {
  assert.deepEqual(hook('', ''), {
    status: 1,
    stderr: "refused: a '' event does not reach this runner\n",
  })
})

test('um disparo manual de outro ramo é recusado', () => {
  assert.deepEqual(hook('workflow_dispatch', 'refs/heads/feat/x'), {
    status: 1,
    stderr: 'refused: a manual run of refs/heads/feat/x is not main\n',
  })
  assert.deepEqual(hook('workflow_dispatch', 'refs/tags/v0.8.0'), {
    status: 1,
    stderr: 'refused: a manual run of refs/tags/v0.8.0 is not main\n',
  })
})

test('um Release de outro ramo ou de um commit solto é recusado', () => {
  assert.deepEqual(hook('release', 'refs/tags/v0.8.0', release('feat/x')), {
    status: 1,
    stderr: "refused: the release targets 'feat/x', not main\n",
  })
  assert.deepEqual(hook('release', 'refs/tags/v0.8.0', release('0123456789abcdef')), {
    status: 1,
    stderr: "refused: the release targets '0123456789abcdef', not main\n",
  })
  assert.deepEqual(hook('release', 'refs/tags/v0.8.0', '{"release":{}}'), {
    status: 1,
    stderr: "refused: the release targets '', not main\n",
  })
})

test('um Release sem arquivo de evento legível ou sem JSON é recusado', () => {
  assert.deepEqual(hook('release', 'refs/tags/v0.8.0'), {
    status: 1,
    stderr: 'refused: the release event file is missing or unreadable\n',
  })
  assert.deepEqual(hook('release', 'refs/tags/v0.8.0', 'not json'), {
    status: 1,
    stderr: 'refused: the release event is not JSON\n',
  })
})
