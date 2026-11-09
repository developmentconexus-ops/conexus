import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { test } from 'node:test'
import { SERVER_TIMEOUT_MINUTES, secondsIn, shardCount, shardsOf } from './server-shards.ts'

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

test('a contagem de fatias mantém cada uma em metade do tempo limite, arredondando para cima', () => {
  // Dois arquivos de 140 s mais 1,7 s de partida somam 283,4 s: uma fatia de 300 s (metade de 10 min) basta.
  const two = { 'src/a.test.ts': 140, 'src/b.test.ts': 140 }
  assert.equal(shardCount(Object.keys(two), two, 10), 1)
  // Mais um arquivo de 20 s passa de 300 s e pede a segunda fatia.
  const three = { ...two, 'src/c.test.ts': 20 }
  assert.equal(shardCount(Object.keys(three), three, 10), 2)
  // O tempo limite maior pede menos fatias.
  assert.equal(shardCount(Object.keys(three), three, 20), 1)
})

test('um arquivo fora do registro pesa a média na contagem, e sem registro há uma fatia', () => {
  const files = ['src/a.test.ts', 'src/b.test.ts', 'src/new.test.ts']
  const seconds = { 'src/a.test.ts': 280, 'src/b.test.ts': 280 }
  // 280 + 280 + a média 280, mais três partidas: 845,1 s, três fatias de 300 s.
  assert.equal(shardCount(files, seconds, 10), 3)
  assert.equal(shardCount(files, {}, 10), 1)
})

test('a contagem do registro do repositório cabe nas fatias que o balanceamento monta', () => {
  const record: Record<string, number> = JSON.parse(
    readFileSync(join(import.meta.dirname, 'server-test-seconds.json'), 'utf8'),
  )
  const files = Object.keys(record)
  const count = shardCount(files, record, SERVER_TIMEOUT_MINUTES)
  const loads = shardsOf(files, record, count).map((shard) =>
    shard.reduce((sum, file) => sum + (record[file] ?? 0) + 1.7, 0),
  )
  // Heaviest first, a shard ends no more than its heaviest file over the even share.
  const even = loads.reduce((a, b) => a + b, 0) / count
  assert.ok(Math.max(...loads) <= even + Math.max(...Object.values(record)) + 1.7)
})

test('o tempo limite do job server em ci.yml é o que a contagem de fatias supõe', () => {
  const workflow = readFileSync(join(import.meta.dirname, '../.github/workflows/ci.yml'), 'utf8')
  const job = /^ {2}server:\n(?:(?: {4}.*)?\n)*/m.exec(workflow)?.[0] ?? ''
  assert.equal(/^ {4}timeout-minutes: (\d+)$/m.exec(job)?.[1], String(SERVER_TIMEOUT_MINUTES))
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
    assert.match(run('--count').stdout, /^\d+\n$/)
    for (const bad of [[], ['3/2'], ['0/2'], ['1/2', '1/2'], ['--record'], ['--count', '1']]) {
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
