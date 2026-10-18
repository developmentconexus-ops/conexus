import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { HOOK_SCRIPT, secret, setup } from './setup-harness.ts'

// What the hook step alone reads: none of the tokens setup-server.sh needs (founder, 2026-10-18: B).
const NO_TOKENS = {
  RUNNER_URL: undefined,
  RUNNER_VERSION: undefined,
  RUNNER_SHA256: undefined,
  TUNNEL_TOKEN_FILE: undefined,
  RUNNER_TOKEN_FILE: undefined,
}

test('o gancho sozinho roda sem token, instala git e o gancho, e reinicia o runner já instalado', () => {
  const service = 'LANG=C\n'
  const { run, calls, env: used, config } = setup('', '', NO_TOKENS, false, service, HOOK_SCRIPT)
  assert.equal(run.status, 0, run.stderr)
  assert.ok(calls.includes('timeout-for apt-get install -y git'))
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

const MIRROR_URL = 'git@github.com:owner/repo.git'
const DEPLOY_KEY = 'deploy-key-value'
function hookAlone(extra: Record<string, string>) {
  return setup('', '', { ...NO_TOKENS, ...extra }, false, '', HOOK_SCRIPT)
}

test('com a chave de leitura, o gancho prepara o espelho de main só para o runner', () => {
  const key = secret('deploy-key', `${DEPLOY_KEY}\n`, 0o600)
  const { run, calls, env, config } = hookAlone({ MIRROR_URL, DEPLOY_KEY_FILE: key })
  assert.equal(run.status, 0, run.stderr)
  const [at, copy, hosts] = [
    env.MIRROR_DIR,
    `${config}/main-mirror.key`,
    `${config}/github-known-hosts`,
  ]
  const git = `sudo -u runner git --git-dir=${at}`
  assert.deepEqual(
    calls.filter((call) => call.includes(at) || call.includes(copy)),
    [
      `install -m 0400 -o runner -g runner ${key} ${copy}`,
      `install -d -o runner -g runner -m 0700 ${at}`,
      `${git} init --quiet --bare --initial-branch=main`,
      `${git} config core.sshCommand ssh -i ${copy} -o IdentitiesOnly=yes -o BatchMode=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile=${hosts}`,
      `${git} config remote.origin.url ${MIRROR_URL}`,
      `timeout-for ${git} fetch --no-tags origin refs/heads/main:refs/heads/main`,
      `${git} fetch --no-tags origin refs/heads/main:refs/heads/main`,
    ],
  )
  assert.equal(
    readFileSync(hosts, 'utf8'),
    'github.com ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOMqqnkVzrm0SdG6UOoqKLsabgH5C9okWi0dh2l9GKJl\n',
  )
  assert.doesNotMatch(`${calls.join('\n')}${run.stdout}${run.stderr}`, new RegExp(DEPLOY_KEY))
})

test('recusa uma chave legível por outros ou um endereço que não é do GitHub, antes de instalar', () => {
  const open = hookAlone({ MIRROR_URL, DEPLOY_KEY_FILE: secret('open-key', 'k\n', 0o644) })
  assert.equal(open.run.status, 1)
  assert.match(open.run.stderr, /open-key must be readable by its owner only/)
  const key = secret('key-for-url', 'k\n', 0o600)
  const wrong = hookAlone({ MIRROR_URL: 'https://example.invalid/x.git', DEPLOY_KEY_FILE: key })
  assert.equal(wrong.run.status, 1)
  assert.match(wrong.run.stderr, /MIRROR_URL must be git@github.com:<owner>\/<repo>.git/)
  for (const { calls } of [open, wrong]) {
    assert.ok(!calls.some((call) => call.includes('main-mirror.key') || call.includes('sudo')))
  }
})

test('sem a chave e sem espelho, o gancho fica instalado e diz que recusa tudo', () => {
  const { run, calls } = hookAlone({})
  assert.equal(run.status, 0, run.stderr)
  assert.match(run.stderr, /no mirror of main at .*: the hook refuses every job until/)
  assert.ok(!calls.some((call) => call.startsWith('sudo')))
})

test('o gancho cria a pasta dos registros de versão só para o runner', () => {
  const { run, calls, env } = hookAlone({})
  assert.equal(run.status, 0, run.stderr)
  assert.ok(calls.includes(`install -d -o runner -g runner -m 0700 ${env.RELEASES_DIR}`))
})

test('se o espelho falha, o .env já nomeia o gancho e a falha é do espelho', () => {
  const key = secret('failing-key', 'k\n', 0o600)
  const { run, calls, config } = setup(
    '',
    '',
    { ...NO_TOKENS, MIRROR_URL, DEPLOY_KEY_FILE: key, FAIL_FETCH: '1' },
    false,
    'LANG=C\n',
    HOOK_SCRIPT,
  )
  assert.notEqual(run.status, 0)
  assert.doesNotMatch(run.stdout, /mirror of main ready/)
  const env = readFileSync(join(config, '..', 'runner', '.env'), 'utf8')
  assert.equal(
    env,
    `LANG=C\nACTIONS_RUNNER_HOOK_JOB_STARTED=${join(config, 'runner-job-started.sh')}\n`,
  )
  assert.ok(calls.some((call) => call.startsWith('install -m 0400')))
})
