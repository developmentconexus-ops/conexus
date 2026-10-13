// check-suppressions refuses a suppression without a cause and a count that does not match.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { after, test } from 'node:test'

const SCRIPT = resolve(import.meta.dirname, 'check-suppressions.ts')
const dirs: string[] = []
after(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true })
})

function suppression(kind: string, cause: string): string {
  return ['//', kind, cause].filter(Boolean).join(' ')
}

function check(files: Record<string, string>, recorded: Record<string, number>) {
  const dir = mkdtempSync(join(tmpdir(), 'conexus-suppressions-'))
  dirs.push(dir)
  const all = { ...files, 'scripts/suppressions.json': JSON.stringify(recorded) }
  for (const [path, content] of Object.entries(all)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true })
    writeFileSync(join(dir, path), content)
  }
  return spawnSync('node', [SCRIPT, dir], { encoding: 'utf8' })
}

test('aceita a contagem registrada, com causa', () => {
  const line = suppression('biome-ignore lint/suspicious/noExplicitAny:', 'the vendor type is any')
  const run = check({ 'a.ts': `${line}\nexport const a = 1\n` }, { 'a.ts': 1 })
  assert.equal(run.status, 0, run.stderr)
})

test('recusa supressão sem mudar a contagem', () => {
  const line = suppression('biome-ignore lint/suspicious/noExplicitAny:', 'the vendor type is any')
  const run = check({ 'a.ts': `${line}\nexport const a = 1\n` }, {})
  assert.equal(run.status, 1)
  assert.match(run.stderr, /^suppression-count-changed: a\.ts: 1 in the file, 0 /m)
})

test('recusa contagem registrada de uma supressão que saiu', () => {
  const run = check({ 'a.ts': 'export const a = 1\n' }, { 'a.ts': 1 })
  assert.equal(run.status, 1)
  assert.match(run.stderr, /^suppression-count-changed: a\.ts: 0 in the file, 1 /m)
})

test('recusa supressão sem causa', () => {
  const line = suppression('biome-ignore lint/suspicious/noExplicitAny', '')
  const run = check({ 'a.ts': `${line}\nexport const a = 1\n` }, { 'a.ts': 1 })
  assert.equal(run.status, 1)
  assert.match(run.stderr, /^suppression-without-cause: a\.ts:1$/m)
})

test('recusa @ts-expect-error sem causa', () => {
  const run = check(
    { 'a.ts': `${suppression('@ts-expect-error', '')}\nexport const a: number = ''\n` },
    { 'a.ts': 1 },
  )
  assert.equal(run.status, 1)
  assert.match(run.stderr, /^suppression-without-cause: a\.ts:1$/m)
})
