import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { after, before, test } from 'node:test'

const REMOVALS = resolve(import.meta.dirname, 'removals.ts')
const TEST = { cwd: '.', file: 'limit.test.ts' }
const ROWS = [
  { id: 'caught', file: 'limit.ts', find: 'LIMIT = 10', replace: 'LIMIT = 11', test: TEST },
  { id: 'survived', file: 'limit.ts', find: '// the limit\n', replace: '', test: TEST },
  { id: 'absent', file: 'limit.ts', find: 'LIMIT = 99', replace: '', test: TEST },
  { id: 'repeated', file: 'limit.ts', find: 'LIMIT', replace: 'CAP', test: TEST },
  { id: 'no-file', file: 'gone.ts', find: 'x', replace: '', test: TEST },
  {
    id: 'skipped',
    file: 'limit.ts',
    find: 'LIMIT = 10',
    replace: 'LIMIT = 11',
    test: { ...TEST, name: 'pulado' },
  },
  {
    id: 'no-test',
    file: 'limit.ts',
    find: 'LIMIT = 10',
    replace: 'LIMIT = 11',
    test: { ...TEST, file: 'missing.test.ts' },
  },
  {
    id: 'broken',
    file: 'limit.ts',
    find: 'LIMIT = 10',
    replace: 'LIMIT = 11',
    test: { ...TEST, file: 'broken.test.ts' },
  },
]

let repo = ''
before(() => {
  repo = mkdtempSync(join(tmpdir(), 'conexus-removals-'))
  const files: Record<string, string> = {
    'scripts/removals.json': JSON.stringify(ROWS),
    'limit.ts': '// the limit\nexport const LIMIT = 10\nexport const DOUBLE = LIMIT * 2\n',
    'broken.test.ts': [
      "import assert from 'node:assert/strict'",
      "import { test } from 'node:test'",
      "import { LIMIT } from './limit.ts'",
      "test('quebrado', () => assert.equal(LIMIT, 11))",
      '',
    ].join('\n'),
    'limit.test.ts': [
      "import assert from 'node:assert/strict'",
      "import { test } from 'node:test'",
      "import { LIMIT } from './limit.ts'",
      "test('o limite é 10', () => assert.equal(LIMIT, 10))",
      "test('pulado', { skip: 'opt-in: never runs' }, () => assert.equal(LIMIT, 10))",
      '',
    ].join('\n'),
  }
  for (const [name, content] of Object.entries(files)) {
    mkdirSync(dirname(join(repo, name)), { recursive: true })
    writeFileSync(join(repo, name), content)
  }
  spawnSync('git', ['init', '--quiet'], { cwd: repo })
})
after(() => rmSync(repo, { recursive: true, force: true }))

function removals(...args: string[]) {
  const { NODE_TEST_CONTEXT: _outer, ...env } = process.env
  return spawnSync('node', [REMOVALS, ...args], {
    cwd: repo,
    encoding: 'utf8',
    timeout: 120_000,
    env,
  })
}

const OUTCOMES: [string, string, number][] = [
  ['caught', 'caught', 0],
  ['survived', 'survived', 1],
  ['absent', 'stale', 1],
  ['repeated', 'stale', 1],
  ['no-file', 'stale', 1],
  ['skipped', 'unreachable', 1],
  ['no-test', 'unreachable', 1],
  ['broken', 'broken-baseline', 1],
]
for (const [id, outcome, status] of OUTCOMES) {
  test(`remoção ${id}: ${outcome}, saída ${status}`, () => {
    const result = removals('--only', id)
    assert.equal(result.stdout, `${outcome} ${id}\n`, result.stderr)
    assert.equal(result.status, status)
  })
}

test('todas as linhas: uma por remoção, saída 1 quando alguma não é pega', () => {
  const result = removals()
  assert.equal(result.stdout.split('\n').filter(Boolean).length, ROWS.length)
  assert.equal(result.status, 1)
})

test('a cópia não muda o repositório', () => {
  removals('--only', 'caught')
  const status = spawnSync('git', ['status', '--porcelain'], { cwd: repo, encoding: 'utf8' })
  assert.equal(status.stdout, '?? broken.test.ts\n?? limit.test.ts\n?? limit.ts\n?? scripts/\n')
})

const BAD_MANIFESTS: [string, unknown, RegExp][] = [
  ['vazio', [], /removals\.json : must be a list with at least one row/],
  ['não é lista', { id: 'x' }, /removals\.json : /],
  ['sem campo', [{ ...ROWS[0], find: '' }], /removals\.json 0\.find: /],
  ['teste sem arquivo', [{ ...ROWS[0], test: { cwd: '.' } }], /removals\.json 0\.test\.file: /],
  ['nome vazio', [{ ...ROWS[0], test: { ...TEST, name: '' } }], /removals\.json 0\.test\.name: /],
]
for (const [name, manifest, message] of BAD_MANIFESTS) {
  test(`manifesto ruim, ${name}: o comando recusa antes de remover algo`, () => {
    const bad = mkdtempSync(join(tmpdir(), 'conexus-removals-bad-'))
    try {
      mkdirSync(join(bad, 'scripts'))
      writeFileSync(join(bad, 'scripts/removals.json'), JSON.stringify(manifest))
      const { NODE_TEST_CONTEXT: _outer, ...env } = process.env
      const result = spawnSync('node', [REMOVALS], { cwd: bad, encoding: 'utf8', env })
      assert.equal(result.stdout, '')
      assert.match(result.stderr, message)
      assert.notEqual(result.status, 0)
    } finally {
      rmSync(bad, { recursive: true, force: true })
    }
  })
}
