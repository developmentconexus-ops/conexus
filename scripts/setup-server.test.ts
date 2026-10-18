import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { after, test } from 'node:test'

const SCRIPT = resolve(import.meta.dirname, '../infra/setup-server.sh')
const HOOK_SCRIPT = resolve(import.meta.dirname, '../infra/setup-runner-hook.sh')
const dir = mkdtempSync(join(tmpdir(), 'conexus-setup-'))
after(() => rmSync(dir, { recursive: true, force: true }))

const RUNNER_TOKEN = 'runner-token-value'
const TUNNEL_TOKEN = 'tunnel-token-value'
// The commands the script calls that must not touch the machine are stubs that record what they got.
const STUBBED = [
  'apt-get',
  'chown',
  'curl',
  'id',
  'install',
  'sha256sum',
  'sudo',
  'timeout',
  'usermod',
  'useradd',
]
const REAL = ['cat', 'dirname', 'grep', 'mv', 'rm', 'stat']

function secret(name: string, content: string, mode: number): string {
  const path = join(dir, name)
  writeFileSync(path, content)
  chmodSync(path, mode)
  return path
}

function environment(tunnel: string, runner: string, work: string, bin: string) {
  return {
    PATH: bin,
    RUNNER_URL: 'https://example.invalid/org/repo',
    RUNNER_VERSION: '0.0.0',
    RUNNER_SHA256: 'x',
    TUNNEL_TOKEN_FILE: tunnel,
    RUNNER_TOKEN_FILE: runner,
    CONEXUS_SETUP_TEST: '1',
    CONFIG_DIR: join(work, 'config'),
    SECRETS_DIR: join(work, 'config', 'secrets'),
    KEYRINGS_DIR: join(work, 'keyrings'),
    OS_RELEASE: join(work, 'os-release'),
    DOCKER_APT_LIST: join(work, 'docker.list'),
    RUNNER_HOME: join(work, 'runner'),
  }
}

function setup(
  tunnel: string,
  runner: string,
  extra: Record<string, string | undefined> = {},
  withDocker = false,
  runnerEnv?: string,
  script = SCRIPT,
) {
  const work = mkdtempSync(join(dir, 'work-'))
  const bin = join(work, 'bin')
  const log = join(work, 'calls.log')
  mkdirSync(bin)
  mkdirSync(join(work, 'runner'))
  if (runnerEnv !== undefined) writeFileSync(join(work, 'runner', '.env'), runnerEnv)
  writeFileSync(join(work, 'os-release'), 'VERSION_CODENAME=test\n')
  for (const name of withDocker ? [...STUBBED, 'docker'] : STUBBED) {
    const record = `printf "%s %s\\n" "\${0##*/}" "$*" >> "$CALLS"`
    const body =
      name === 'sudo'
        ? `${record}\nwhile [ $# -gt 0 ] && [[ $1 != ./* ]]; do shift; done\n[ $# -gt 0 ] && exec "$@"\nexit 0`
        : name === 'sha256sum'
          ? `${record}\ncat > /dev/null`
          : name === 'install'
            ? `${record}\nprintf "env-in-install %s\\n" "\${ACTIONS_RUNNER_INPUT_TOKEN:-unset}" >> "$CALLS"\nif [ "$1" = -d ] && [ "$#" = 4 ] && [[ $4 = "$SETUP_ROOT"/* ]]; then /usr/bin/install "$@"; fi`
            : name === 'timeout'
              ? 'shift 2\nprintf "timeout-for %s\\n" "$*" >> "$CALLS"\nexec "$@"'
              : name === 'curl'
                ? `${record}\nwhile [ $# -gt 1 ]; do [ "$1" = -o ] && : > "$2"; shift; done`
                : record
    writeFileSync(join(bin, name), `#!/bin/bash\n${body}\n`)
    chmodSync(join(bin, name), 0o755)
  }
  for (const name of REAL) symlinkSync(`/usr/bin/${name}`, join(bin, name))
  const stubs = {
    'svc.sh': `echo "svc.sh $*" >> "$CALLS"\necho "env-in-svc \${ACTIONS_RUNNER_INPUT_TOKEN:-unset}" >> "$CALLS"`,
    'config.sh': `echo "config.sh $*" >> "$CALLS"\necho "env-in-config \${ACTIONS_RUNNER_INPUT_TOKEN:-unset}" >> "$CALLS"`,
  }
  for (const [name, body] of Object.entries(stubs)) {
    writeFileSync(join(work, 'runner', name), `#!/bin/bash\n${body}\n`)
    chmodSync(join(work, 'runner', name), 0o755)
  }
  const env = { ...environment(tunnel, runner, work, bin), CALLS: log, SETUP_ROOT: work, ...extra }
  const run = spawnSync('/bin/bash', [script], { encoding: 'utf8', timeout: 120_000, env })
  const calls = (() => {
    try {
      return readFileSync(log, 'utf8').split('\n').filter(Boolean)
    } catch {
      return []
    }
  })()
  return { run, calls, env, config: join(work, 'config') }
}

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

// What the hook step alone reads: none of the tokens setup-server.sh needs (founder, 2026-10-18: B).
const NO_TOKENS = {
  RUNNER_URL: undefined,
  RUNNER_VERSION: undefined,
  RUNNER_SHA256: undefined,
  TUNNEL_TOKEN_FILE: undefined,
  RUNNER_TOKEN_FILE: undefined,
}

test('o gancho sozinho roda sem token, instala jq e o gancho, e reinicia o runner já instalado', () => {
  const service = 'LANG=C\n'
  const { run, calls, env: used, config } = setup('', '', NO_TOKENS, false, service, HOOK_SCRIPT)
  assert.equal(run.status, 0, run.stderr)
  assert.ok(calls.includes('timeout-for apt-get install -y jq'))
  const env = readFileSync(join(config, '..', 'runner', '.env'), 'utf8')
  assert.equal(
    env,
    `LANG=C\nACTIONS_RUNNER_HOOK_JOB_STARTED=${join(config, 'runner-job-started.sh')}\n`,
  )
  assert.ok(!calls.some((call) => call.startsWith('svc.sh')))
  writeFileSync(join(config, '..', 'runner', '.service'), 'actions.runner.hub.service\n')
  const again = spawnSync('/bin/bash', [HOOK_SCRIPT], {
    encoding: 'utf8',
    env: { ...used, CALLS: join(config, '..', 'again.log') },
  })
  assert.equal(again.status, 0, again.stderr)
  const restarted = readFileSync(join(config, '..', 'again.log'), 'utf8').split('\n')
  assert.deepEqual(
    restarted.filter((call) => call.startsWith('svc.sh')),
    ['svc.sh stop', 'svc.sh start'],
  )
})
