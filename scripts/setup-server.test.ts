import assert from 'node:assert/strict'
import { readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { RUNNER_TOKEN, secret, setup, TUNNEL_TOKEN } from './setup-harness.ts'

const good = secret('good', `${TUNNEL_TOKEN}\n`, 0o600)
const goodRunner = secret('good-runner', `${RUNNER_TOKEN}\n`, 0o600)

test('recusa um token legível por outros', () => {
  const { run, calls } = setup(secret('open', 'token\n', 0o644), goodRunner)
  assert.equal(run.status, 1)
  assert.match(run.stderr, /open must be readable by its owner only/)
  assert.deepEqual(calls, [])
})

test('recusa um token vazio', () => {
  const { run, calls } = setup(good, secret('empty', '', 0o600))
  assert.equal(run.status, 1)
  assert.match(run.stderr, /empty is missing or empty/)
  assert.deepEqual(calls, [])
})

test('instala o token do túnel como 0400 do usuário do cloudflared', () => {
  const { run, calls } = setup(good, goodRunner)
  assert.equal(run.status, 0, run.stderr)
  assert.ok(calls.some((call) => / -m 0400 -o 65532 .*good .*\/secrets\/tunnel_token$/.test(call)))
})

test('setup creates the traversable parent and private secrets directory without root', () => {
  const { run, config } = setup(good, goodRunner)
  assert.equal(run.status, 0, run.stderr)
  assert.equal(statSync(config).mode & 0o777, 0o711)
  assert.equal(statSync(join(config, 'secrets')).mode & 0o777, 0o700)
  assert.equal(statSync(config).uid, process.getuid?.())
})

test('toda chamada de rede e todo comando que espera tem prazo', () => {
  const { run, calls } = setup(good, goodRunner)
  assert.equal(run.status, 0, run.stderr)
  const curls = calls.filter((call) => call.startsWith('curl '))
  assert.equal(curls.length, 2)
  for (const call of curls) assert.match(call, /--connect-timeout \d+ --max-time \d+/)
  const limited = calls.filter((call) => call.startsWith('timeout-for '))
  for (const command of [
    'apt-get update',
    'apt-get install',
    'sudo',
    './svc.sh install',
    './svc.sh start',
  ]) {
    assert.ok(
      limited.some((call) => call.includes(command)),
      command,
    )
  }
})

test('o token do runner não vai na linha de comando de ninguém', () => {
  const { run, calls } = setup(good, goodRunner)
  assert.equal(run.status, 0, run.stderr)
  assert.ok(calls.some((call) => call.startsWith('sudo ') && call.includes('./config.sh')))
  const argv = calls.filter((call) => !call.startsWith('env-in-'))
  assert.doesNotMatch(argv.join('\n'), new RegExp(`${RUNNER_TOKEN}|${TUNNEL_TOKEN}|--token`))
})

test('o token do runner está só no ambiente da chamada do config.sh', () => {
  const { run, calls } = setup(good, goodRunner)
  assert.equal(run.status, 0, run.stderr)
  assert.ok(calls.includes(`env-in-config ${RUNNER_TOKEN}`))
  assert.ok(calls.some((call) => call.startsWith('config.sh --unattended')))
  assert.ok(calls.includes('env-in-install unset'))
  assert.ok(calls.includes('env-in-svc unset'))
  const others = calls.filter((call) => !call.startsWith('env-in-config '))
  assert.doesNotMatch(others.join('\n'), new RegExp(RUNNER_TOKEN))
})

test('as baixadas têm tamanho máximo, e a extração tem prazo', () => {
  const { run, calls } = setup(good, goodRunner)
  assert.equal(run.status, 0, run.stderr)
  for (const call of calls.filter((call) => call.startsWith('curl '))) {
    assert.match(call, /--max-filesize \d+/)
  }
  assert.ok(calls.some((call) => call.startsWith('timeout-for sudo -u runner tar ')))
})

test('o teste não escreve fora da pasta temporária', () => {
  const { run, calls } = setup(good, goodRunner)
  assert.equal(run.status, 0, run.stderr)
  const outside = calls.filter(
    (call) => /\/etc\/(?!conexus )/.test(call) && !/\/etc\/apt\/sources/.test(call),
  )
  assert.deepEqual(outside, [])
})

test('os ajustes de teste só valem com CONEXUS_SETUP_TEST=1', () => {
  const { calls } = setup(good, goodRunner, { CONEXUS_SETUP_TEST: undefined }, true)
  assert.ok(calls.some((call) => call.includes('/etc/conexus/secrets/tunnel_token')))
  assert.ok(!calls.some((call) => call.includes('work-')))
})

test('o runner recebe o gancho de início de trabalho, instalado fora do alcance dele', () => {
  const { run, calls, config } = setup(good, goodRunner)
  assert.equal(run.status, 0, run.stderr)
  assert.ok(
    calls.some((call) =>
      /^install -m 0755 .*runner-job-started\.sh .*\/runner-job-started\.sh$/.test(call),
    ),
  )
  const env = readFileSync(join(config, '..', 'runner', '.env'), 'utf8')
  assert.equal(env, `ACTIONS_RUNNER_HOOK_JOB_STARTED=${join(config, 'runner-job-started.sh')}\n`)
  assert.ok(calls.indexOf('chown runner:runner .env.next') < calls.indexOf('svc.sh install runner'))
})

test('rodar o setup de novo troca a linha do gancho e guarda as outras', () => {
  const stale = 'LANG=C\nACTIONS_RUNNER_HOOK_JOB_STARTED=/old/hook.sh\n'
  const { run, config } = setup(good, goodRunner, {}, false, stale)
  assert.equal(run.status, 0, run.stderr)
  const env = readFileSync(join(config, '..', 'runner', '.env'), 'utf8')
  assert.equal(
    env,
    `LANG=C\nACTIONS_RUNNER_HOOK_JOB_STARTED=${join(config, 'runner-job-started.sh')}\n`,
  )
})
