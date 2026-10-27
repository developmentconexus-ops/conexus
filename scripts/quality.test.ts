import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { after, test } from 'node:test'

const SCRIPT = resolve(import.meta.dirname, 'quality.ts')
const FILE = 'apps/web/src/a.ts'
const dirs: string[] = []
after(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true })
})

function git(dir: string, ...args: string[]) {
  execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@example.com', ...args], {
    cwd: dir,
    timeout: 120_000,
  })
}

function write(dir: string, path: string, content: string) {
  mkdirSync(dirname(join(dir, path)), { recursive: true })
  writeFileSync(join(dir, path), content)
}

/** A function whose complexity is 1 + 2 + ... + depth: each `if` counts its nesting. */
function nested(name: string, depth: number): string {
  const open = Array.from({ length: depth }, (_, i) => `${' '.repeat(i + 1)}if (n > ${i}) {`)
  const close = Array.from({ length: depth }, (_, i) => `${' '.repeat(depth - i)}}`)
  return [
    `export function ${name}(n: number): number {`,
    ...open,
    '  return n',
    ...close,
    '  return 0',
    '}',
    '',
  ].join('\n')
}

function clone(name: string): string {
  const lines = Array.from(
    { length: 12 },
    (_, i) => `  const value${i} = input.field${i} * ${i + 3} + offset${i}`,
  )
  return [
    `export function ${name}(input: Record<string, number>, offset: number): number {`,
    ...lines,
    '  return value0',
    '}',
    '',
  ].join('\n')
}

function quality(before: Record<string, string>, after: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), 'conexus-quality-'))
  dirs.push(dir)
  git(dir, 'init', '-q', '-b', 'main')
  for (const [path, content] of Object.entries(before)) write(dir, path, content)
  git(dir, 'add', '.')
  git(dir, 'commit', '-q', '-m', 'base', '--allow-empty')
  for (const [path, content] of Object.entries(after)) write(dir, path, content)
  return spawnSync('node', [SCRIPT, 'main', '--fast', '--root', dir], {
    encoding: 'utf8',
    timeout: 120_000,
  })
}

test('aceita uma função tocada até 15', () => {
  const run = quality({ [FILE]: nested('f', 3) }, { [FILE]: nested('f', 5) })
  assert.equal(run.status, 0, run.stderr)
  assert.match(run.stdout, /a\.ts:1 f: 6 -> 15/)
})

test('recusa uma função nova acima de 15', () => {
  const run = quality({ [FILE]: 'export const a = 1\n' }, { [FILE]: nested('g', 6) })
  assert.equal(run.status, 1)
  assert.match(run.stderr, /^quality: complexity: apps\/web\/src\/a\.ts:1 g is 21$/m)
})

test('recusa uma função já acima de 15 que subiu e aceita a que desceu', () => {
  const before = { [FILE]: nested('h', 6) }
  const raised = quality(before, { [FILE]: nested('h', 7) })
  assert.equal(raised.status, 1)
  assert.match(raised.stderr, /h is 28$/m)
  const lowered = quality(before, { [FILE]: nested('h', 5) })
  assert.equal(lowered.status, 0, lowered.stderr)
})

test('ignora uma função acima de 15 que a mudança não toca', () => {
  const run = quality(
    { [FILE]: nested('h', 6) },
    { [FILE]: `${nested('h', 6)}export const b = 2\n` },
  )
  assert.equal(run.status, 0, run.stderr)
})

test('recusa um clone novo com um lado nas linhas mudadas', () => {
  const run = quality({ [FILE]: clone('one') }, { 'apps/web/src/b.ts': clone('two') })
  assert.equal(run.status, 1)
  assert.match(run.stderr, /^quality: new clone: apps\/web\/src\/.\.ts:/m)
})

test('não conta como novo um clone que já existia', () => {
  const both = { [FILE]: clone('one'), 'apps/web/src/b.ts': clone('two') }
  const run = quality(both, { 'apps/web/src/b.ts': `${clone('two')}export const c = 3\n` })
  assert.equal(run.status, 0, run.stderr)
})
