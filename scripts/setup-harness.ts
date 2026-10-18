import { spawnSync } from 'node:child_process'
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { after } from 'node:test'

const SCRIPT = resolve(import.meta.dirname, '../infra/setup-server.sh')
export const HOOK_SCRIPT = resolve(import.meta.dirname, '../infra/setup-runner-hook.sh')
const dir = mkdtempSync(join(tmpdir(), 'conexus-setup-'))
after(() => rmSync(dir, { recursive: true, force: true }))

export const RUNNER_TOKEN = 'runner-token-value'
export const TUNNEL_TOKEN = 'tunnel-token-value'
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

export function secret(name: string, content: string, mode: number): string {
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
    MIRROR_DIR: join(work, 'lib', 'main.git'),
    RELEASES_DIR: join(work, 'lib', 'releases'),
  }
}

export function setup(
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
        ? `${record}\n[ -n "\${FAIL_FETCH:-}" ] && [[ " $* " == *" fetch "* ]] && exit 1\nwhile [ $# -gt 0 ] && [[ $1 != ./* ]]; do shift; done\n[ $# -gt 0 ] && exec "$@"\nexit 0`
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
