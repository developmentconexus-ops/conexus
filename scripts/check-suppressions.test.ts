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
  return spawnSync('node', [SCRIPT, dir], { encoding: 'utf8', timeout: 120_000 })
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

test('conta a supressão de JSX dentro de chaves', () => {
  const jsx = [
    'export const a = (',
    '  <input',
    '    // placeholder',
    '  />',
    ')',
    '{/* biome-ignore lint/a11y/noAutofocus: the field opens the dialog */}',
    '',
  ].join('\n')
  const run = check({ 'a.tsx': jsx }, {})
  assert.equal(run.status, 1)
  assert.match(run.stderr, /^suppression-count-changed: a\.tsx: 1 in the file, 0 /m)
})

test('recusa supressão de JSX sem causa', () => {
  const run = check({ 'a.tsx': '{/* biome-ignore lint/a11y/noAutofocus */}\n' }, { 'a.tsx': 1 })
  assert.equal(run.status, 1)
  assert.match(run.stderr, /^suppression-without-cause: a\.tsx:1$/m)
})

test('conta a supressão de um workflow e recusa a que não tem causa', () => {
  const file = '.github/workflows/a.yml'
  const withCause = '- run: x # zizmor: ignore[github-env] the value is not from the event\n'
  assert.equal(check({ [file]: withCause }, { [file]: 1 }).status, 0)
  const counted = check({ [file]: withCause }, {})
  assert.equal(counted.status, 1)
  assert.match(
    counted.stderr,
    /^suppression-count-changed: \.github\/workflows\/a\.yml: 1 in the file/m,
  )
  const bare = check({ [file]: '- run: x # zizmor: ignore[github-env]\n' }, { [file]: 1 })
  assert.match(bare.stderr, /^suppression-without-cause: \.github\/workflows\/a\.yml:1$/m)
})

test('conta o ignore da configuração do zizmor e recusa o que não tem comentário de causa', () => {
  const file = '.github/zizmor.yml'
  function body(comment: string): string {
    return `rules:\n  self-repository:\n${comment}    ignore:\n      - ci.yml\n`
  }
  assert.equal(check({ [file]: body('    # why\n') }, { [file]: 1 }).status, 0)
  assert.equal(check({ [file]: body('    # why\n') }, {}).status, 1)
  assert.match(
    check({ [file]: body('') }, { [file]: 1 }).stderr,
    /^suppression-without-cause: \.github\/zizmor\.yml:3$/m,
  )
})
