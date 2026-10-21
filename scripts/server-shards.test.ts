import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { test } from 'node:test'
import { secondsIn, shardsOf } from './server-shards.ts'

const SHARDS = resolve(import.meta.dirname, 'server-shards.ts')
const SECONDS = {
  'src/a.test.ts': 90,
  'src/b.test.ts': 60,
  'src/c.test.ts': 50,
  'src/d.test.ts': 40,
}
const FILES = Object.keys(SECONDS)

function load(shard: string[], seconds: Record<string, number>): number {
  return shard.reduce((sum, file) => sum + (seconds[file] ?? 0), 0)
}

test('os arquivos mais pesados vão para fatias diferentes, e cada arquivo cai numa fatia só', () => {
  const shards = shardsOf(FILES, SECONDS, 2)
  assert.deepEqual(shards, [
    ['src/a.test.ts', 'src/d.test.ts'],
    ['src/b.test.ts', 'src/c.test.ts'],
  ])
  assert.deepEqual(shards.flat().toSorted(), FILES)
})

test('as fatias ficam mais próximas pelo tempo do que pela ordem dos arquivos', () => {
  const byOrder = [FILES.slice(0, 2), FILES.slice(2)]
  function spread(shards: string[][]): number {
    const loads = shards.map((shard) => load(shard, SECONDS))
    return Math.max(...loads) - Math.min(...loads)
  }
  assert.ok(spread(shardsOf(FILES, SECONDS, 2)) < spread(byOrder))
})

test('um arquivo fora do registro pesa a média dos outros', () => {
  const [first, second] = shardsOf(
    ['src/a.test.ts', 'src/b.test.ts', 'src/new.test.ts'],
    { 'src/a.test.ts': 90, 'src/b.test.ts': 30 },
    2,
  )
  assert.deepEqual(first, ['src/a.test.ts'])
  assert.deepEqual(second, ['src/b.test.ts', 'src/new.test.ts'])
})

test('sem registro, as fatias partilham os arquivos por igual', () => {
  const shards = shardsOf(FILES, {}, 3)
  assert.deepEqual(shards.map((shard) => shard.length).toSorted(), [1, 1, 2])
})

test('a tabela do log vira o registro; a tabela dos mais lentos não entra', () => {
  const log = [
    '2026-10-20T16:21:47.7Z | 12.3 | src/hub/a.test.ts |',
    '2026-10-20T16:21:47.7Z | 0.0 | src/hub/b.test.ts |',
    '2026-10-20T16:21:47.7Z | 5.0 | src/hub/c.test.ts | um teste |',
    '| Seconds | File |',
  ].join('\n')
  assert.deepEqual(secondsIn([log]), { 'src/hub/a.test.ts': 12.3, 'src/hub/b.test.ts': 0.1 })
})

test('a linha de comando imprime a fatia, e todos com "all"', () => {
  const dir = mkdtempSync(join(tmpdir(), 'conexus-shards-'))
  try {
    mkdirSync(join(dir, 'src/deep'), { recursive: true })
    for (const file of ['src/a.test.ts', 'src/deep/b.test.ts', 'src/helper.ts']) {
      writeFileSync(join(dir, file), '')
    }
    function run(...args: string[]) {
      return spawnSync('node', [SHARDS, ...args], { cwd: dir, encoding: 'utf8' })
    }
    assert.equal(run('all').stdout, 'src/a.test.ts\nsrc/deep/b.test.ts\n')
    const slices = ['1/2', '2/2'].map((shard) => run(shard).stdout.trim())
    assert.deepEqual(slices.toSorted(), ['src/a.test.ts', 'src/deep/b.test.ts'])
    for (const bad of [[], ['3/2'], ['0/2'], ['1/2', '1/2'], ['--record']]) {
      const refused = run(...bad)
      assert.notEqual(refused.status, 0)
      assert.match(refused.stderr, /usage: server-shards\.ts/)
    }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('o registro do repositório é uma tabela de segundos positivos', () => {
  const record = JSON.parse(
    readFileSync(join(import.meta.dirname, 'server-test-seconds.json'), 'utf8'),
  )
  for (const seconds of Object.values(record)) assert.ok(typeof seconds === 'number' && seconds > 0)
})
