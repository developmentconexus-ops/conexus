import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'
import { check, LIGHT, repository, SCRIPT } from './check-local-harness.ts'

const KILLED: [tool: string, signal: string, changed: string, step: string][] = [
  ['knip', 'SIGKILL', 'docs/a.md', 'knip'],
  ['biome', 'SIGTERM', 'docs/a.md', 'biome'],
  ['biome', 'SIGKILL', 'docs/a.md', 'biome'],
  ['tsc', 'SIGTERM', 'apps/web/src/a.ts', 'typecheck apps/web (tsc)'],
  ['wrangler', 'SIGKILL', 'apps/edge/src/a.ts', 'typecheck apps/edge (wrangler)'],
]
for (const [killed, signal, changed, step] of KILLED) {
  test(`um passo morto duas vezes por sinal é vermelho: ${killed}, ${signal}`, () => {
    const env = { KILLED_TOOL: killed, KILL_SIGNAL: signal }
    const run = check(repository([changed]), [], env)
    assert.equal(run.status, 1, run.stderr)
    const red = `check-local: RED ${step}: killed by ${signal}, twice`
    assert.ok(run.stderr.includes(red), run.stderr)
    assert.equal(run.calls.filter((call) => call.startsWith(`${killed} `)).length, 2)
  })
}

test('um passo morto uma vez pela memória roda de novo, sozinho, e a checagem fica verde', () => {
  const env = { KILLED_TOOL: 'knip', KILL_SIGNAL: 'SIGTERM', KILL_TIMES: '1' }
  const run = check(repository(['docs/a.md']), [], env)
  assert.equal(run.status, 0, run.stderr)
  const knip = LIGHT.indexOf('knip .')
  assert.deepEqual(run.calls, LIGHT.toSpliced(knip, 0, 'knip .'))
})

test('um passo morto por um sinal que não é o da memória é vermelho sem segunda vez', () => {
  const env = { KILLED_TOOL: 'knip', KILL_SIGNAL: 'SIGABRT' }
  const run = check(repository(['docs/a.md']), [], env)
  assert.equal(run.status, 1, run.stderr)
  assert.ok(run.stderr.includes('check-local: RED knip: killed by SIGABRT\n'), run.stderr)
  assert.deepEqual(run.calls, LIGHT)
})

function alive(pid: number): boolean {
  try {
    return process.kill(pid, 0)
  } catch {
    return false
  }
}

async function eventually(holds: () => boolean): Promise<boolean> {
  for (let tries = 0; tries < 200 && !holds(); tries += 1) await sleep(50)
  return holds()
}

async function assertEnded(root: string): Promise<void> {
  const pids = readFileSync(join(root, 'planted.pids'), 'utf8').split(' ').map(Number)
  const ended = await eventually(() => !pids.some(alive))
  const survivors = pids.filter(alive)
  for (const pid of survivors) process.kill(pid, 'SIGKILL')
  assert.ok(ended, `still alive: ${survivors.join(', ')}`)
}

test('um passo que estoura o prazo é vermelho, e nenhum neto sobrevive', async () => {
  const root = repository([])
  const run = check(root, ['--step-deadline', '5000'], { HUNG_TOOL: 'docs' })
  assert.equal(run.status, 1, run.stderr)
  assert.ok(run.stderr.includes('check-local: RED docs: no end within 5000 ms\n'), run.stderr)
  assert.equal(run.calls.filter((call) => call.startsWith('docs ')).length, 1)
  assert.equal(existsSync(join(root, 'outlived')), false)
  await assertEnded(root)
})

test('um passo morto não deixa neto vivo ao lado do passo seguinte', async () => {
  const root = repository([])
  const run = check(root, [], { ORPHANING_TOOL: 'docs' })
  assert.ok(run.stderr.includes('check-local: RED docs: killed by SIGABRT\n'), run.stderr)
  await assertEnded(root)
})

test('uma checagem interrompida encerra o passo em andamento e os netos', async () => {
  const root = repository([])
  const run = spawn('node', [SCRIPT, '--root', root], {
    stdio: 'ignore',
    timeout: 60_000,
    env: { ...process.env, npm_config_update_notifier: 'false', HUNG_TOOL: 'docs' },
  })
  const exit = once(run, 'exit')
  assert.ok(await eventually(() => existsSync(join(root, 'planted.pids'))))
  run.kill('SIGINT')
  const [, signal] = await exit
  assert.equal(signal, 'SIGINT')
  await assertEnded(root)
})

test('um passo que sai com erro é vermelho, e os outros ainda rodam', () => {
  const run = check(repository(['docs/a.md']), [], { FAILED_TOOL: 'docs' })
  assert.equal(run.status, 1)
  assert.ok(run.stderr.includes('check-local: RED docs: exit 2'), run.stderr)
  assert.deepEqual(run.calls, LIGHT)
})
