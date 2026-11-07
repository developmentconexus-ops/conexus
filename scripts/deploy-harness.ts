import { spawnSync } from 'node:child_process'
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { delimiter, join, resolve } from 'node:path'
import { after } from 'node:test'

export const SECRETS = [
  'hub_session_secret',
  'hub_mail_token',
  'hub_neon_api_key',
  'hub_app_login_key',
  'hub_cloudflare_apps_token',
  'hub_tools_access_client_id',
  'hub_tools_access_client_secret',
  'hub_seal_keys',
  'hub_mastra_database_url',
  'hub_git_copy_key',
  'hub_e2b_api_key',
  'hub_connector_apps',
]

const DEPLOY = resolve(import.meta.dirname, '../infra/deploy.sh')
const dirs: string[] = []
after(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true })
})

const STUB_DOCKER = `#!/bin/bash
echo "$* [HUB_IMAGE=\${HUB_IMAGE:-}] [HUB_E2B_TEMPLATE=\${HUB_E2B_TEMPLATE:-}]" >> "$CALLS"
[[ -n "\${STUB_HANG:-}" && "$*" == *"$STUB_HANG"* ]] && exec sleep 30
case "$*" in
  *" ps --quiet hub") echo "\${STUB_RUNNING_ID:-}" ;;
  "inspect --format {{.Config.Image}}"*) echo "\${STUB_RUNNING_IMAGE:-}" ;;
  "inspect --format {{range .Config.Env}}"*)
    echo "PATH=/usr/bin"; [ -n "\${STUB_RUNNING_TEMPLATE:-}" ] && echo "HUB_E2B_TEMPLATE=$STUB_RUNNING_TEMPLATE"; exit 0 ;;
  "image inspect"*) [ -n "\${STUB_INSPECT_STATUS:-}" ] && exit "$STUB_INSPECT_STATUS"
    case "$*" in *conexus.reseal*) echo "\${STUB_RESEAL_LABEL:-}" ;; *) echo "\${STUB_LABEL:-}" ;; esac ;;
  "pull --quiet"*) exit "\${STUB_PULL_STATUS:-0}" ;;
  *" run --rm migrate")
    n=$(( $(cat "$CALLS.migrate" 2>/dev/null || echo 0) + 1 )); echo "$n" > "$CALLS.migrate"
    read -ra seq <<< "\${STUB_MIGRATE_SEQUENCE:-\${STUB_MIGRATE_STATUS:-0}}"
    exit "\${seq[$((n - 1))]:-\${seq[\${#seq[@]}-1]}}" ;;
  *" run --rm --no-deps hub node apps/server/src/main.ts reseal") exit "\${STUB_RESEAL_STATUS:-0}" ;;
  "run --rm --network none --user 1000 --mount type=bind,source=/etc/conexus/secrets/"*)
    [[ -n "\${STUB_MISSING_SECRET:-}" && "$*" == *"/\${STUB_MISSING_SECRET},"* ]] && exit 1; exit 0 ;;
  *" up "*) exit "\${STUB_UP_STATUS:-0}" ;;
esac
`

/** The template a Release built beside the image, and the one the running Hub was started with. */
export const NEW_TEMPLATE = 'conexus-builder:1111111'
export const OLD_TEMPLATE = 'conexus-builder:0000000'

export type Stub = {
  running?: string
  runningTemplate?: string
  labeled?: boolean
  resealLabeled?: boolean
  migrateStatus?: number
  migrateSequence?: string
  resealStatus?: number
  upStatus?: number
  pullStatus?: number
  inspectStatus?: number
  /** A docker call whose arguments contain this text never answers, so only the script's bound ends it. */
  hang?: string
  missingSecret?: string
  hubEnv?: 'missing' | 'unreadable'
}

function stubEnv(stub: Stub): Record<string, string> {
  const running = stub.running
  return {
    STUB_RUNNING_ID: running === undefined ? '' : 'container-id',
    STUB_RUNNING_IMAGE: running ?? '',
    STUB_RUNNING_TEMPLATE: stub.runningTemplate ?? (running === undefined ? '' : OLD_TEMPLATE),
    STUB_LABEL: stub.labeled === false ? '' : '1',
    STUB_RESEAL_LABEL: stub.resealLabeled === false ? '' : '1',
    STUB_MIGRATE_STATUS: String(stub.migrateStatus ?? 0),
    STUB_MIGRATE_SEQUENCE: stub.migrateSequence ?? '',
    STUB_RESEAL_STATUS: String(stub.resealStatus ?? 0),
    STUB_UP_STATUS: String(stub.upStatus ?? 0),
    STUB_PULL_STATUS: String(stub.pullStatus ?? 0),
    STUB_INSPECT_STATUS: stub.inspectStatus === undefined ? '' : String(stub.inspectStatus),
    STUB_MISSING_SECRET: stub.missingSecret ?? '',
    STUB_HANG: stub.hang ?? '',
    ...(stub.hang === undefined ? {} : { DEPLOY_WAIT_SECONDS: '1' }),
  }
}

export function deploy(
  argument: string,
  stub: Stub = {},
  template: string | null = argument === '--restart' ? null : NEW_TEMPLATE,
) {
  const dir = mkdtempSync(join(tmpdir(), 'conexus-deploy-'))
  dirs.push(dir)
  mkdirSync(join(dir, 'bin'))
  writeFileSync(join(dir, 'bin/docker'), STUB_DOCKER)
  chmodSync(join(dir, 'bin/docker'), 0o755)
  const calls = join(dir, 'calls')
  const hubEnv = join(dir, 'hub.env')
  if (stub.hubEnv !== 'missing') writeFileSync(hubEnv, 'HUB_MAIL_FROM=a@b.test\n')
  if (stub.hubEnv === 'unreadable') chmodSync(hubEnv, 0o000)
  writeFileSync(calls, '')
  const args = template === null ? [argument] : [argument, template]
  const run = spawnSync('bash', [DEPLOY, ...args], {
    encoding: 'utf8',
    timeout: 60_000,
    env: {
      ...process.env,
      PATH: `${join(dir, 'bin')}${delimiter}${process.env.PATH}`,
      CALLS: calls,
      HUB_ENV_FILE: hubEnv,
      MIGRATE_RETRY_SECONDS: '0',
      ...stubEnv(stub),
    },
  })
  const log = readFileSync(calls, 'utf8').split('\n').filter(Boolean)
  function count(text: string): number {
    return log.filter((call) => call.includes(text)).length
  }
  return { run, log, count }
}
