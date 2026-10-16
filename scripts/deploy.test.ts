import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { delimiter, join, resolve } from 'node:path'
import { after, test } from 'node:test'

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
  "image inspect"*) echo "\${STUB_LABEL:-}" ;;
  *" run --rm migrate") exit "\${STUB_MIGRATE_STATUS:-0}" ;;
  "run --rm --network none --user 1000 --mount type=bind,source=/etc/conexus/secrets/"*)
    [[ -n "\${STUB_MISSING_SECRET:-}" && "$*" == *"/\${STUB_MISSING_SECRET},"* ]] && exit 1; exit 0 ;;
  *" up "*) exit "\${STUB_UP_STATUS:-0}" ;;
esac
`

type Stub = {
  running?: string
  labeled?: boolean
  migrateStatus?: number
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
      STUB_MIGRATE_STATUS: String(stub.migrateStatus ?? 0),
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

for (const secret of ['hub_session_secret', 'hub_mail_token']) {
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
  for (const secret of ['hub_session_secret', 'hub_mail_token']) {
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
      skip: hubEnv === 'unreadable' && AS_ROOT,
    }, () => {
      const { run, log } = deploy(argument, { running: 'hub@sha256:old', hubEnv })
      assert.equal(run.status, 1)
      assert.match(run.stderr, /missing or unreadable hub\.env: .*hub\.env; write it first/)
      assert.deepEqual(log, [])
    })
  }
}
