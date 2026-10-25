import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { after, test } from 'node:test'

const SCRIPT = resolve(import.meta.dirname, 'check-boundaries.ts')
const dirs: string[] = []
after(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true })
})

const LOCK = JSON.stringify({
  packages: {
    'node_modules/@mastra/core': { version: '1.79.0' },
    'node_modules/@mastra/fastify': { version: '1.5.23' },
    'node_modules/fastify': { version: '5.12.5' },
  },
})

function check(files: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), 'conexus-boundaries-'))
  dirs.push(dir)
  for (const [path, content] of Object.entries({ 'package-lock.json': LOCK, ...files })) {
    mkdirSync(dirname(join(dir, path)), { recursive: true })
    writeFileSync(join(dir, path), content)
  }
  return spawnSync('node', [SCRIPT, dir], { encoding: 'utf8', timeout: 120_000 })
}

test('aceita as versões instaladas e um candidato que o lockfile não tem', () => {
  const run = check({
    'docs/reference/boundaries.md':
      '## Mastra 1.79.0 and @mastra/fastify 1.5.23\n\nFastify 5.12.5 and Stryker 10.0.0.\n',
    'apps/server/a.ts': '// Mastra 1.79.0 gives its logger to the store\n',
  })
  assert.equal(run.status, 0, run.stderr)
})

test('recusa uma versão de boundaries.md que o lockfile não instala', () => {
  const run = check({ 'docs/reference/boundaries.md': 'line\n## Fastify 5.12.4: a line\n' })
  assert.equal(run.status, 1)
  assert.match(
    run.stderr,
    /^boundaries-pin-stale: docs\/reference\/boundaries\.md:2: Fastify 5\.12\.4 is 5\.12\.5/m,
  )
})

test('recusa um comentário "Mastra N.N.N" no código com outra versão', () => {
  const run = check({
    'apps/server/a.ts': 'export const a = 1\n// Mastra 1.78.0 gives its logger\n',
  })
  assert.equal(run.status, 1)
  assert.match(
    run.stderr,
    /^boundaries-pin-stale: apps\/server\/a\.ts:2: Mastra 1\.78\.0 is 1\.79\.0/m,
  )
})

test('um teste ou fixture registra quando viu, e não é conferido', () => {
  const run = check({
    'apps/server/a.test.ts': '// Mastra 1.78.0 can write the snapshot\n',
    'apps/web/tool-fixtures.ts': "// with Mastra 1.78.0's own results\n",
  })
  assert.equal(run.status, 0, run.stderr)
})
