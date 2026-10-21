import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { delimiter, join, resolve } from 'node:path'
import { after, test } from 'node:test'
import { parse } from 'yaml'

const DEPLOY = resolve(import.meta.dirname, '../infra/deploy.sh')
const dirs: string[] = []
after(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true })
})

const STUB_DOCKER = `#!/bin/bash
echo "$* [HUB_IMAGE=\${HUB_IMAGE:-}]" >> "$CALLS"
case "$*" in
  *" ps --quiet hub") echo "\${STUB_RUNNING_ID:-}" ;;
  "inspect --format {{.Config.Image}}"*) echo "\${STUB_RUNNING_IMAGE:-}" ;;
  "image inspect"*conexus.reseal*) echo "\${STUB_RESEAL_LABEL:-}" ;;
  "image inspect"*) echo "\${STUB_LABEL:-}" ;;
  *" run --rm migrate") exit "\${STUB_MIGRATE_STATUS:-0}" ;;
  *" run --rm --no-deps hub node apps/server/src/main.ts reseal") exit "\${STUB_RESEAL_STATUS:-0}" ;;
  "run --rm --network none --user 1000 --mount type=bind,source=/etc/conexus/secrets/"*)
    [[ -n "\${STUB_MISSING_SECRET:-}" && "$*" == *"/\${STUB_MISSING_SECRET},"* ]] && exit 1; exit 0 ;;
  *" up "*) exit "\${STUB_UP_STATUS:-0}" ;;
esac
`

type Stub = {
  running?: string
  labeled?: boolean
  resealLabeled?: boolean
  migrateStatus?: number
  resealStatus?: number
  upStatus?: number
  missingSecret?: string
  hubEnv?: 'missing' | 'unreadable'
}

function deploy(argument: string, stub: Stub = {}) {
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
  const run = spawnSync('bash', [DEPLOY, argument], {
    encoding: 'utf8',
    timeout: 60_000,
    env: {
      ...process.env,
      PATH: `${join(dir, 'bin')}${delimiter}${process.env.PATH}`,
      CALLS: calls,
      HUB_ENV_FILE: hubEnv,
      STUB_RUNNING_ID: stub.running === undefined ? '' : 'container-id',
      STUB_RUNNING_IMAGE: stub.running ?? '',
      STUB_LABEL: stub.labeled === false ? '' : '1',
      STUB_RESEAL_LABEL: stub.resealLabeled === false ? '' : '1',
      STUB_MIGRATE_STATUS: String(stub.migrateStatus ?? 0),
      STUB_RESEAL_STATUS: String(stub.resealStatus ?? 0),
      STUB_UP_STATUS: String(stub.upStatus ?? 0),
      STUB_MISSING_SECRET: stub.missingSecret ?? '',
    },
  })
  const log = readFileSync(calls, 'utf8').split('\n').filter(Boolean)
  function count(text: string): number {
    return log.filter((call) => call.includes(text)).length
  }
  return { run, log, count }
}

test('uma imagem com o rótulo roda migrate uma vez e só depois sobe o Hub', () => {
  const { run, log, count } = deploy('hub@sha256:new', { running: 'hub@sha256:old' })
  assert.equal(run.status, 0, run.stderr)
  assert.equal(count('run --rm migrate'), 1)
  assert.ok(
    log.findIndex((call) => call.includes('run --rm migrate')) <
      log.findIndex((call) => call.includes(' up ')),
  )
  assert.match(run.stdout, /live: hub@sha256:new/)
})

test('uma imagem sem o rótulo pula migrate', () => {
  const { run, count } = deploy('hub@sha256:new', { labeled: false })
  assert.equal(run.status, 0, run.stderr)
  assert.equal(count('run --rm migrate'), 0)
  assert.equal(count(' up '), 1)
})

test('migrate que falha termina vermelho e não sobe o Hub', () => {
  const { run, count } = deploy('hub@sha256:new', { migrateStatus: 1 })
  assert.equal(run.status, 1)
  assert.match(run.stderr, /migration failed/)
  assert.equal(count(' up '), 0)
})

test('a imagem que já roda não muda nada', () => {
  const { run, count } = deploy('hub@sha256:same', { running: 'hub@sha256:same' })
  assert.equal(run.status, 0, run.stderr)
  assert.equal(count('run --rm migrate'), 0)
  assert.equal(count(' up '), 0)
})

test('--restart migra a imagem em uso e recria o Hub', () => {
  const { run, log, count } = deploy('--restart', { running: 'hub@sha256:old' })
  assert.equal(run.status, 0, run.stderr)
  assert.equal(count('run --rm migrate'), 1)
  assert.ok(
    log.some((call) => call.includes('--force-recreate') && call.includes('hub@sha256:old')),
  )
  assert.match(run.stdout, /restarted: hub@sha256:old/)
})

test('reseal roda depois de migrate e antes de subir o Hub, no deploy e no --restart', () => {
  for (const argument of ['hub@sha256:new', '--restart']) {
    const { run, log, count } = deploy(argument, { running: 'hub@sha256:old' })
    assert.equal(run.status, 0, run.stderr)
    assert.equal(count('main.ts reseal'), 1)
    function at(text: string) {
      return log.findIndex((call) => call.includes(text))
    }
    assert.ok(at('run --rm migrate') < at('main.ts reseal'))
    assert.ok(at('main.ts reseal') < at(' up '))
  }
})

test('uma imagem de antes da etapa 11, sem o rótulo, pula reseal: Voltar atrás para ela sobe', () => {
  for (const argument of ['hub@sha256:old', '--restart']) {
    const { run, count } = deploy(argument, { running: 'hub@sha256:new', resealLabeled: false })
    assert.equal(run.status, 0, run.stderr)
    assert.equal(count('main.ts reseal'), 0)
    assert.equal(count(' up '), 1)
    assert.match(run.stdout, /no reseal in: hub@sha256:(old|new)/)
  }
})

test('reseal que falha termina vermelho e não sobe o Hub', () => {
  const { run, count } = deploy('hub@sha256:new', { resealStatus: 1 })
  assert.equal(run.status, 1)
  assert.match(run.stderr, /reseal failed: hub@sha256:new/)
  assert.equal(count(' up '), 0)
})

const SECRETS = [
  'hub_session_secret',
  'hub_mail_token',
  'hub_neon_api_key',
  'hub_app_login_key',
  'hub_cloudflare_apps_token',
  'hub_seal_keys',
  'hub_mastra_database_url',
  'hub_git_copy_key',
]

test('--restart sem Hub rodando termina vermelho', () => {
  const { run, count } = deploy('--restart')
  assert.equal(run.status, 1)
  assert.match(run.stderr, /no Hub is running/)
  assert.equal(count(' up '), 0)
})

test('--restart cujo Hub não fica saudável diz como voltar atrás', () => {
  const { run } = deploy('--restart', { running: 'hub@sha256:old', upStatus: 1 })
  assert.equal(run.status, 1)
  assert.match(run.stderr, /not healthy after the restart/)
  assert.match(run.stderr, /Voltar atrás/)
})

for (const secret of SECRETS) {
  test(`sem ${secret} recusa antes de migrate e não sobe o Hub`, () => {
    const { run, count } = deploy('hub@sha256:new', {
      running: 'hub@sha256:old',
      missingSecret: secret,
    })
    assert.equal(run.status, 1)
    assert.match(run.stderr, new RegExp(`missing secret: ${secret}`))
    assert.equal(count('run --rm migrate'), 0)
    assert.equal(count(' up '), 0)
  })

  test(`--restart sem ${secret} recusa e não recria o Hub`, () => {
    const { run, count } = deploy('--restart', { running: 'hub@sha256:old', missingSecret: secret })
    assert.equal(run.status, 1)
    assert.match(run.stderr, new RegExp(`missing secret: ${secret}`))
    assert.equal(count(' up '), 0)
  })
}

test('os segredos são conferidos na imagem nova, sem rede, como o usuário do Hub', () => {
  const { run, log } = deploy('hub@sha256:new')
  assert.equal(run.status, 0, run.stderr)
  for (const secret of SECRETS) {
    assert.ok(
      log.includes(
        `run --rm --network none --user 1000 --mount type=bind,source=/etc/conexus/secrets/${secret},target=/run/check,readonly --entrypoint test hub@sha256:new -s /run/check [HUB_IMAGE=]`,
      ),
      log.join('\n'),
    )
  }
})

const AS_ROOT = process.getuid?.() === 0
for (const hubEnv of ['missing', 'unreadable'] as const) {
  for (const argument of ['hub@sha256:new', '--restart']) {
    test(`${argument} com hub.env ${hubEnv} recusa antes de qualquer chamada ao Docker`, {
      skip:
        hubEnv === 'unreadable' && AS_ROOT
          ? 'opt-in: root reads any file, so this case needs a user without root'
          : false,
    }, () => {
      const { run, log } = deploy(argument, { running: 'hub@sha256:old', hubEnv })
      assert.equal(run.status, 1)
      assert.match(run.stderr, /missing or unreadable hub\.env: .*hub\.env; write it first/)
      assert.deepEqual(log, [])
    })
  }
}

const INFRA = resolve(import.meta.dirname, '../infra')

test('a imagem do Hub traz o git e a pasta dos repositórios é um volume do usuário do Hub (0051)', () => {
  const dockerfile = readFileSync(join(INFRA, 'hub.Dockerfile'), 'utf8')
  const last = dockerfile.slice(dockerfile.lastIndexOf('\nFROM '))
  assert.match(last, /apt-get install[^\n]*\bgit\b/)
  assert.match(
    last,
    /mkdir -p \/var\/lib\/conexus\/git && chown node:node \/var\/lib\/conexus\/git/,
  )
  const compose = parse(readFileSync(join(INFRA, 'compose.yaml'), 'utf8'))
  assert.deepEqual(compose.services.hub.volumes, ['hub_git:/var/lib/conexus/git'])
  assert.ok('hub_git' in compose.volumes)
  assert.equal(compose.services.hub.environment.HUB_GIT_ROOT, '/var/lib/conexus/git')
  assert.equal(
    compose.services.hub.environment.HUB_GIT_COPY_KEY_FILE,
    '/run/secrets/hub_git_copy_key',
  )
  assert.ok(compose.services.hub.secrets.includes('hub_git_copy_key'))
})
