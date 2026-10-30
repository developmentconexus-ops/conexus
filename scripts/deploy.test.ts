import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { delimiter, join, resolve } from 'node:path'
import { after, test } from 'node:test'
import { MachineTemplate } from '../apps/server/src/platform/config-machine.ts'

const DEPLOY = resolve(import.meta.dirname, '../infra/deploy.sh')
const dirs: string[] = []
after(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true })
})

const STUB_DOCKER = `#!/bin/bash
echo "$* [HUB_IMAGE=\${HUB_IMAGE:-}] [HUB_E2B_TEMPLATE=\${HUB_E2B_TEMPLATE:-}]" >> "$CALLS"
case "$*" in
  *" ps --quiet hub") echo "\${STUB_RUNNING_ID:-}" ;;
  "inspect --format {{.Config.Image}}"*) echo "\${STUB_RUNNING_IMAGE:-}" ;;
  "inspect --format {{range .Config.Env}}"*)
    echo "PATH=/usr/bin"; [ -n "\${STUB_RUNNING_TEMPLATE:-}" ] && echo "HUB_E2B_TEMPLATE=$STUB_RUNNING_TEMPLATE"; exit 0 ;;
  "image inspect"*conexus.reseal*) echo "\${STUB_RESEAL_LABEL:-}" ;;
  "image inspect"*) echo "\${STUB_LABEL:-}" ;;
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
const NEW_TEMPLATE = 'conexus-builder:1111111'
const OLD_TEMPLATE = 'conexus-builder:0000000'

type Stub = {
  running?: string
  runningTemplate?: string
  labeled?: boolean
  resealLabeled?: boolean
  migrateStatus?: number
  migrateSequence?: string
  resealStatus?: number
  upStatus?: number
  missingSecret?: string
  hubEnv?: 'missing' | 'unreadable'
}

function deploy(
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
      STUB_RUNNING_ID: stub.running === undefined ? '' : 'container-id',
      STUB_RUNNING_IMAGE: stub.running ?? '',
      STUB_RUNNING_TEMPLATE:
        stub.runningTemplate ?? (stub.running === undefined ? '' : OLD_TEMPLATE),
      STUB_LABEL: stub.labeled === false ? '' : '1',
      STUB_RESEAL_LABEL: stub.resealLabeled === false ? '' : '1',
      STUB_MIGRATE_STATUS: String(stub.migrateStatus ?? 0),
      STUB_MIGRATE_SEQUENCE: stub.migrateSequence ?? '',
      MIGRATE_RETRY_SECONDS: '0',
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

test('migrate que diz 75 é repetido, e passando na terceira tentativa o Hub sobe', () => {
  const { run, count } = deploy('hub@sha256:new', { migrateSequence: '75 75 0' })
  assert.equal(run.status, 0, run.stderr)
  assert.equal(count('run --rm migrate'), 3)
  assert.equal(count(' up '), 1)
})

test('migrate que diz 75 três vezes termina vermelho e não sobe o Hub', () => {
  const { run, count } = deploy('hub@sha256:new', { migrateSequence: '75' })
  assert.equal(run.status, 1)
  assert.equal(count('run --rm migrate'), 3)
  assert.match(run.stderr, /migration failed/)
  assert.equal(count(' up '), 0)
})

test('migrate que falha por outro motivo não é repetido', () => {
  const { run, count } = deploy('hub@sha256:new', { migrateSequence: '1 0' })
  assert.equal(run.status, 1)
  assert.equal(count('run --rm migrate'), 1)
})

test('a imagem que já roda com o mesmo template não muda nada', () => {
  const { run, count } = deploy('hub@sha256:same', {
    running: 'hub@sha256:same',
    runningTemplate: NEW_TEMPLATE,
  })
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
  'hub_e2b_api_key',
  'hub_connector_apps',
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
        `run --rm --network none --user 1000 --mount type=bind,source=/etc/conexus/secrets/${secret},target=/run/check,readonly --entrypoint test hub@sha256:new -s /run/check [HUB_IMAGE=] [HUB_E2B_TEMPLATE=]`,
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

/** The template each call to Compose named, for the calls that hold `text`. */
function templatesOf(log: string[], text: string): string[] {
  return log
    .filter((call) => call.includes(text))
    .map((call) => /\[HUB_E2B_TEMPLATE=([^\]]*)\]$/.exec(call)?.[1] ?? '')
}

test('o Release sobe a imagem com o template do mesmo commit, e migrate lê o arquivo com ele', () => {
  const { run, log } = deploy('hub@sha256:new', { running: 'hub@sha256:old' })
  assert.equal(run.status, 0, run.stderr)
  assert.deepEqual(templatesOf(log, ' up '), [NEW_TEMPLATE])
  assert.deepEqual(templatesOf(log, 'run --rm migrate'), [NEW_TEMPLATE])
  assert.match(run.stdout, new RegExp(`live: hub@sha256:new with ${NEW_TEMPLATE}`))
})

test('a mesma imagem com outro template sobe de novo', () => {
  const { run, log } = deploy('hub@sha256:same', { running: 'hub@sha256:same' })
  assert.equal(run.status, 0, run.stderr)
  assert.deepEqual(templatesOf(log, ' up '), [NEW_TEMPLATE])
})

test('sem template, a volta a uma versão de antes do registro do template mantém o do Hub no ar', () => {
  for (const template of [null, '']) {
    const { run, log } = deploy('hub@sha256:old', { running: 'hub@sha256:new' }, template)
    assert.equal(run.status, 0, run.stderr)
    assert.deepEqual(templatesOf(log, ' up '), [OLD_TEMPLATE])
  }
})

test('--restart mantém o template no ar, e com um template de candidato recria o Hub com ele', () => {
  const keep = deploy('--restart', { running: 'hub@sha256:old' })
  assert.equal(keep.run.status, 0, keep.run.stderr)
  assert.deepEqual(templatesOf(keep.log, '--force-recreate'), [OLD_TEMPLATE])
  const candidate = deploy('--restart', { running: 'hub@sha256:old' }, NEW_TEMPLATE)
  assert.equal(candidate.run.status, 0, candidate.run.stderr)
  assert.deepEqual(templatesOf(candidate.log, '--force-recreate'), [NEW_TEMPLATE])
  assert.match(candidate.run.stdout, new RegExp(`restarted: hub@sha256:old with ${NEW_TEMPLATE}`))
})

test('a imagem nova que não fica saudável volta à imagem e ao template de antes', () => {
  const { run, log } = deploy('hub@sha256:new', { running: 'hub@sha256:old', upStatus: 1 })
  assert.equal(run.status, 1)
  const ups = log.filter((call) => call.includes(' up '))
  assert.equal(ups.length, 2)
  assert.match(
    ups[1] ?? '',
    new RegExp(`\\[HUB_IMAGE=hub@sha256:old\\] \\[HUB_E2B_TEMPLATE=${OLD_TEMPLATE}\\]$`),
  )
})

test('sem template e sem Hub no ar recusa antes de migrate e não sobe nada', () => {
  const { run, count } = deploy('hub@sha256:new', {}, null)
  assert.equal(run.status, 1)
  assert.match(run.stderr, /no template/)
  assert.equal(count('run --rm migrate'), 0)
  assert.equal(count(' up '), 0)
})

test('deploy.sh aceita um template exatamente quando o Hub o aceita', () => {
  for (const value of [
    NEW_TEMPLATE,
    'conexus-builder:5a2ae2be',
    'conexus-builder',
    'conexus-builder:',
    'Conexus-builder:1111111',
    'conexus-builder:1111111:1111111',
    'conexus-builder:$(id)',
  ]) {
    const { run, count } = deploy('hub@sha256:new', { running: 'hub@sha256:old' }, value)
    const accepted = MachineTemplate.safeParse(value).success
    assert.equal(run.status === 0, accepted, `${value}: ${run.stderr}`)
    if (!accepted) {
      assert.match(run.stderr, /not a template name:tag/)
      assert.equal(count(' up '), 0)
    }
  }
})
