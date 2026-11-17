import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { after, test } from 'node:test'

const ROOT = resolve(import.meta.dirname, '..')
const dirs: string[] = []
after(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true })
})

function vitestRun(env: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), 'conexus-vitest-'))
  dirs.push(dir)
  symlinkSync(join(ROOT, 'node_modules'), join(dir, 'node_modules'))
  writeFileSync(
    join(dir, 'vitest.config.ts'),
    `import { defineConfig } from 'vitest/config'
import { CI_RETRY, FlakyReporter } from '${join(ROOT, 'scripts/vitest-flaky-reporter.ts')}'
export default defineConfig({ test: { retry: CI_RETRY, reporters: ['default', new FlakyReporter()] } })
`,
  )
  writeFileSync(
    join(dir, 'oscila.test.ts'),
    `import { expect, test } from 'vitest'
let attempts = 0
test('suíte oscila', () => {
  attempts += 1
  expect(attempts).toBe(2)
})
`,
  )
  const records = join(dir, 'flaky.jsonl')
  const run = spawnSync(join(ROOT, 'node_modules/.bin/vitest'), ['run'], {
    cwd: dir,
    encoding: 'utf8',
    timeout: 120_000,
    env: { PATH: process.env.PATH ?? '', CONEXUS_FLAKY_FILE: records, GITHUB_JOB: 'web', ...env },
  })
  return { run, records }
}

test('na CI o teste que oscila passa na segunda rodada e entra no registro de instáveis', () => {
  const { run, records } = vitestRun({ CI: 'true' })
  assert.equal(run.status, 0, run.stdout + run.stderr)
  const [line] = readFileSync(records, 'utf8').trim().split('\n')
  const record = JSON.parse(line ?? '')
  assert.match(record.file, /oscila\.test\.ts$/)
  assert.equal(record.name, 'suíte oscila')
  assert.equal(record.job, 'web')
})

test('fora da CI o mesmo teste fica vermelho e nada entra no registro', () => {
  const { run, records } = vitestRun({})
  assert.equal(run.status, 1, run.stdout + run.stderr)
  assert.throws(() => readFileSync(records, 'utf8'), /ENOENT/)
})
