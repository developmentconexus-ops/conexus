import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { after, before, test } from 'node:test'

const REMOVALS = resolve(import.meta.dirname, 'removals.ts')
const TEST = { cwd: '.', file: 'limit.test.ts', name: 'o limite é 10' }
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
    id: 'unrelated',
    file: 'limit.ts',
    find: 'LIMIT = 10',
    replace: 'LIMIT = 11',
    test: { ...TEST, file: 'unrelated.test.ts', name: 'o alvo' },
  },
  {
    id: 'child',
    file: 'limit.ts',
    find: 'LIMIT = 10',
    replace: 'LIMIT = 11',
    test: { ...TEST, file: 'child.test.ts', name: 'filho' },
  },
  {
    id: 'broken',
    file: 'limit.ts',
    find: 'LIMIT = 10',
    replace: 'LIMIT = 11',
    test: { ...TEST, file: 'broken.test.ts', name: 'quebrado' },
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
    'child.ts': [
      "import assert from 'node:assert/strict'",
      "import { LIMIT } from './limit.ts'",
      'assert.equal(LIMIT, 10)',
      '',
    ].join('\n'),
    'child.test.ts': [
      "import assert from 'node:assert/strict'",
      "import { spawnSync } from 'node:child_process'",
      "import { test } from 'node:test'",
      "test('filho', () => {",
      "  assert.equal(spawnSync('node', ['child.ts'], { cwd: import.meta.dirname }).status, 0)",
      '})',
      '',
    ].join('\n'),
    'unrelated.test.ts': [
      "import assert from 'node:assert/strict'",
      "import { after, describe, test } from 'node:test'",
      "import { LIMIT } from './limit.ts'",
      "describe('grupo', () => {",
      '  after(() => assert.equal(LIMIT, 10))',
      "  test('o alvo', () => assert.equal(typeof LIMIT, 'number'))",
      '})',
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

function removalsAt(cwd: string, ...args: string[]) {
  const { NODE_TEST_CONTEXT: _outer, ...env } = process.env
  return spawnSync('node', [REMOVALS, ...args], {
    cwd,
    encoding: 'utf8',
    timeout: 120_000,
    env,
  })
}

function removals(...args: string[]) {
  return removalsAt(repo, ...args)
}

test('ignored mail renderers are carried into the baseline and mutated scratch trees', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'conexus-removals-renderer-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const invitation = 'apps/server/src/hub/identity/invitation-render.mjs'
  const notification = 'apps/server/src/hub/notifications/notification-render.mjs'
  const files = {
    '.gitignore': `${invitation}\n${notification}`,
    'scripts/removals.json': JSON.stringify([{ ...ROWS[0], test: { ...TEST, name: 'renderer' } }]),
    'limit.ts': 'export const LIMIT = 10\n',
    [invitation]: 'export const expected = 10\n',
    [notification]: 'export const other = 10\n',
    'apps/server/src/hub/identity/port.ts': 'export {}\n',
    'limit.test.ts': `import { test } from 'node:test'; import assert from 'node:assert/strict';
      import { LIMIT } from './limit.ts'; import { expected } from './${invitation}';
      import { other } from './${notification}';
      test('renderer', () => assert.equal(LIMIT, expected + other - 10));`,
  }
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, file)), { recursive: true })
    writeFileSync(join(dir, file), content)
  }
  spawnSync('git', ['init', '--quiet'], { cwd: dir })
  const result = removalsAt(dir, '--only', 'caught')
  assert.equal(result.stdout, 'caught caught\n', result.stderr)
  assert.equal(result.status, 0)
})

test('a tracked symlink to a folder is carried into the scratch tree as a symlink', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'conexus-removals-link-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const files = {
    'scripts/removals.json': JSON.stringify([{ ...ROWS[0], test: { ...TEST, name: 'link' } }]),
    'limit.ts': 'export const LIMIT = 10\n',
    'real/skill.md': 'skill\n',
    'limit.test.ts': `import { test } from 'node:test'; import assert from 'node:assert/strict';
      import { lstatSync, readlinkSync } from 'node:fs'; import { LIMIT } from './limit.ts';
      test('link', () => {
        assert.ok(lstatSync('link').isSymbolicLink());
        assert.equal(readlinkSync('link'), 'real');
        assert.equal(LIMIT, 10);
      });`,
  }
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, file)), { recursive: true })
    writeFileSync(join(dir, file), content)
  }
  symlinkSync('real', join(dir, 'link'))
  spawnSync('git', ['init', '--quiet'], { cwd: dir })
  spawnSync('git', ['add', '-A'], { cwd: dir })
  const result = removalsAt(dir, '--only', 'caught')
  assert.equal(result.stdout, 'caught caught\n', result.stderr)
  assert.equal(result.status, 0)
})

const OUTCOMES: [string, string, number][] = [
  ['caught', 'caught', 0],
  ['survived', 'survived', 1],
  ['absent', 'stale', 1],
  ['repeated', 'stale', 1],
  ['no-file', 'stale', 1],
  ['skipped', 'unreachable', 1],
  ['no-test', 'unreachable', 1],
  ['child', 'caught', 0],
  ['broken', 'broken-baseline', 1],
  ['unrelated', 'survived', 1],
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

test('fatias: cada linha roda numa fatia só, e as fatias juntas rodam todas', () => {
  const slices = [1, 2, 3].map((index) => removals('--shard', `${index}/3`).stdout.split('\n'))
  const ids = slices.flatMap((lines) => lines.filter(Boolean).map((line) => line.split(' ')[1]))
  assert.deepEqual(ids.toSorted(), ROWS.map((row) => row.id).toSorted())
  assert.deepEqual(
    slices.map((lines) => lines.filter(Boolean).length),
    [4, 3, 3],
  )
})

test('uma fatia sem linha recusa', () => {
  const result = removals('--shard', '11/11')
  assert.equal(result.stdout, '')
  assert.match(result.stderr, /removals\.json has no row for shard 11\/11/)
  assert.notEqual(result.status, 0)
})

test('a cópia não muda o repositório', () => {
  removals('--only', 'caught')
  const status = spawnSync('git', ['status', '--porcelain'], { cwd: repo, encoding: 'utf8' })
  assert.equal(
    status.stdout,
    '?? broken.test.ts\n?? child.test.ts\n?? child.ts\n?? limit.test.ts\n?? limit.ts\n?? scripts/\n?? unrelated.test.ts\n',
  )
})

const BAD_MANIFESTS: [string, unknown, RegExp][] = [
  ['vazio', [], /removals\.json : must be a list with at least one row/],
  ['não é lista', { id: 'x' }, /removals\.json : /],
  ['sem campo', [{ ...ROWS[0], find: '' }], /removals\.json 0\.find: /],
  ['teste sem arquivo', [{ ...ROWS[0], test: { cwd: '.' } }], /removals\.json 0\.test\.file: /],
  [
    'teste sem nome',
    [{ ...ROWS[0], test: { cwd: '.', file: 'limit.test.ts' } }],
    /removals\.json 0\.test\.name: /,
  ],
  ['chave a mais na linha', [{ ...ROWS[0], nmae: 'x' }], /removals\.json 0: .*nmae/],
  [
    'chave a mais no teste',
    [{ ...ROWS[0], test: { ...TEST, nmae: 'x' } }],
    /removals\.json 0\.test: .*nmae/,
  ],
  ['id repetido', [ROWS[0], ROWS[0]], /removals\.json 1\.id: repeats the id caught/],
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

for (const args of [
  ['--only'],
  ['--only', '--only'],
  ['--only', 'caught', 'survived'],
  ['caught'],
  ['--shard'],
  ['--shard', '0/2'],
  ['--shard', '3/2'],
  ['--shard', '1'],
  ['--shard', '1/2', '1/2'],
  ['--base'],
  ['--base', 'main', '--base', 'main'],
  ['--plan', '--only', 'caught'],
  ['--plan', '--shard', '1/2'],
  ['--pull-request', '{}'],
]) {
  test(`argumentos ${JSON.stringify(args)}: o comando recusa e não roda linha`, () => {
    const result = removals(...args)
    assert.equal(result.stdout, '')
    assert.match(
      result.stderr,
      /usage: removals\.ts \[--base <ref> \[--pull-request <json>\]\] \[--only <row id> \| --shard <index>\/<total> \| --plan\]/,
    )
    assert.notEqual(result.status, 0)
  })
}
