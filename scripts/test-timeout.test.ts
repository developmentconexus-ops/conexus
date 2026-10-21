import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { after, test } from 'node:test'

const ROOT = resolve(import.meta.dirname, '..')

test('o teste que trava falha pelo prazo do comando de teste', () => {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))
  const args: string[] = pkg.scripts['test:scripts'].split(' ').slice(1)
  const timeout = args.findIndex((arg) => arg.startsWith('--test-timeout='))
  assert.notEqual(timeout, -1, 'the test command has no --test-timeout')
  args[timeout] = '--test-timeout=300'
  const dir = mkdtempSync(join(tmpdir(), 'conexus-timeout-'))
  after(() => rmSync(dir, { recursive: true, force: true }))
  writeFileSync(
    join(dir, 'hang.test.ts'),
    "import test from 'node:test'\ntest('hangs', async () => {\n  await new Promise((done) => setTimeout(done, 3000))\n})\n",
  )
  const { NODE_TEST_CONTEXT: _outer, ...env } = process.env
  const run = spawnSync('node', [...args.slice(0, -1), join(dir, 'hang.test.ts')], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 120_000,
    env,
  })
  assert.notEqual(run.status, 0)
  assert.match(run.stdout + run.stderr, /timed out after 300ms/)
})
